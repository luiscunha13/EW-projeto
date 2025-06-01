const express = require('express');
const router = express.Router();
const multer = require('multer');
const JSZip = require('jszip');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const verifyTokenSimple = require('../utils/auth').verifyTokenSimple; //sem verificar admin
const Metadata = require('../controllers/metadata');
const FileInfo = require('../controllers/fileInfo');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'storage/temp/');
  },
  filename: (req, file, cb) => {
    cb(null, `sip-${(() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})()}.zip`);
  }
});

const upload = multer({ storage });

router.use(cors());

function calculateSHA256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function verifyFiles(zip, manifest, zipFiles) {
    const results = { valid: [], errors: [] };
    
    for (const fileInfo of manifest.files) {
        try {
            console.log(`Verifying file: ${fileInfo.filePath}`);
            
            // File existence check
            let fileEntry = zip.file(fileInfo.filePath);
            if (!fileEntry) {
                const fileName = fileInfo.filePath.replace(/^data\//, '');
                fileEntry = zip.file(`data/${fileName}`) || zip.file(fileName);
            }
            
            if (!fileEntry) {
                console.log(`File not found: ${fileInfo.filePath}`);
                results.errors.push({
                    file: fileInfo.filePath,
                    status: 'missing',
                    error: 'File not found in package'
                });
                continue;
            }

            // Checksum verification
            const fileData = await fileEntry.async('nodebuffer');
            const calculatedHash = calculateSHA256(fileData);
            
            if (calculatedHash !== fileInfo.checksum.value) {
                console.log(`Checksum mismatch for ${fileInfo.filePath}`);
                results.errors.push({
                    file: fileInfo.filePath,
                    status: 'invalid',
                    error: `Checksum mismatch. Expected: ${fileInfo.checksum.value}, Got: ${calculatedHash}`
                });
                continue;
            }

            // Metadata verification
            if (fileInfo.metadataPath) {
                let metadataEntry = zip.file(fileInfo.metadataPath);
                if (!metadataEntry) {
                    const metadataFileName = fileInfo.metadataPath.replace(/^metadata\//, '');
                    metadataEntry = zip.file(`metadata/${metadataFileName}`) || zip.file(metadataFileName);
                }
                
                if (!metadataEntry) {
                    console.log(`Metadata file not found: ${fileInfo.metadataPath}`);
                    results.errors.push({
                        file: fileInfo.filePath,
                        status: 'metadata_missing',
                        error: 'Metadata file not found'
                    });
                    continue;
                }

                const metadataData = await metadataEntry.async('nodebuffer');
                const metadataHash = calculateSHA256(metadataData);
                
                if (fileInfo.metadataChecksum && metadataHash !== fileInfo.metadataChecksum.value) {
                    console.log(`Metadata checksum mismatch for ${fileInfo.filePath}`);
                    results.errors.push({
                        file: fileInfo.filePath,
                        status: 'metadata_invalid',
                        error: `Metadata checksum mismatch. Expected: ${fileInfo.metadataChecksum.value}, Got: ${metadataHash}`
                    });
                    continue;
                }
            }

            console.log(`File ${fileInfo.filePath} verified successfully`);
            results.valid.push({
                file: fileInfo.filePath,
                status: 'valid',
                size: fileInfo.size
            });
        } catch (err) {
            console.error(`Error verifying file ${fileInfo.filePath}:`, err);
            results.errors.push({
                file: fileInfo.filePath,
                status: 'error',
                error: err.message
            });
        }
    }
    
    return results;
}

async function processAndStoreFiles(zip, manifest, storagePath, submitter) {
    const results = [];
    
    for (const fileInfo of manifest.files) {
        try {
            // Store the main file
            const fileEntry = zip.file(fileInfo.filePath);
            const fileData = await fileEntry.async('nodebuffer');
            const fileName = path.basename(fileInfo.filePath);
            const fileStoragePath = path.join(storagePath, fileName);
            let fileMetadata = null;
            if (fileInfo.metadataPath) {
                let metadataEntry = zip.file(fileInfo.metadataPath);
                if (!metadataEntry) {
                    const metadataFileName = fileInfo.metadataPath.replace(/^metadata\//, '');
                    metadataEntry = zip.file(`metadata/${metadataFileName}`) || zip.file(metadataFileName);
                }
                if (metadataEntry) {
                    const metadataData = await metadataEntry.async('string');
                    fileMetadata = JSON.parse(metadataData);
                }
            }
            fs.writeFileSync(fileStoragePath, fileData);
            console.log(`file ${JSON.stringify(fileInfo)}`);
            console.log(`Stored file: ${fileName} type ${fileInfo.mimeType}`);
            console.log (`metadata: ${JSON.stringify(fileMetadata)}`);
            // Store file info in MongoDB   
            const fileInfoDoc = await FileInfo.create({
                filename: fileName,
                file_path: fileStoragePath,
                mimeType: fileMetadata.mimeType || 'application/octet-stream',
                size: fileInfo.size
            });

            results.push({
                filename: fileName,
                filePath: fileStoragePath,
                fileId: fileInfoDoc._id
            });
        } catch (err) {
            console.error(`Error storing file ${fileInfo.filePath}:`, err);
            results.push({
                originalPath: fileInfo.filePath,
                error: err.message
            });
        }
    }
    
    return results;
}

async function storeMetadata(manifest, storedFiles, submitter) {
    try {
        // Extract all file IDs from stored files
        const fileIds = storedFiles
            .filter(f => !f.error)
            .map(f => f.fileId);

        // Base metadata document
        const metadataDoc = {
            user: submitter,
            creationDate: new Date(manifest.created),
            lastModified: (() => {const now = new Date(); now.setHours(now.getHours() + 1); return now;})(),
            occurrenceDate: new Date(manifest.occurenceDate),
            title: manifest.title,
            description: manifest.description,
            visibility: manifest.visibility ? 'public' : 'private',
            files: fileIds,
            resourceType: manifest.resourceType,
            comments: [] 
        };

        // Add resource-specific fields based on the resourceType
        switch (manifest.resourceType) {
            case 'sport':
                if (manifest.sport) metadataDoc.sport = manifest.sport;
                if (manifest.activityTime) metadataDoc.activityTime = manifest.activityTime;
                if (manifest.activityDistance) metadataDoc.activityDistance = manifest.activityDistance;
                break;
                
            case 'academic':
                if (manifest.institution) metadataDoc.institution = manifest.institution;
                if (manifest.course) metadataDoc.course = manifest.course;
                if (manifest.schoolYear) metadataDoc.schoolYear = manifest.schoolYear;
                break;
                
            case 'family':
                metadataDoc.familyMember = manifest.familyMember || [];
                break;
                
            case 'trip':
                metadataDoc.places = manifest.places || [];
                break;
                
            case 'work':
                if (manifest.company) metadataDoc.company = manifest.company;
                if (manifest.position) metadataDoc.position = manifest.position;
                break;
                
            case 'personal':
                if (manifest.feeling) metadataDoc.feeling = manifest.feeling;
                break;
                
            case 'fun':
                if (manifest.artist) metadataDoc.artist = manifest.artist;
                if (manifest.genre) metadataDoc.genre = manifest.genre;
                if (manifest.movie) metadataDoc.movie = manifest.movie;
                if (manifest.festival) metadataDoc.festival = manifest.festival;
                break;
                
        }

        const savedMetadata = await Metadata.create(metadataDoc);
        return savedMetadata;

    } catch (err) {
        console.error('Error storing metadata:', err);
        throw err;
    }
}

// Helper function to reconstruct DIP for a single publication
async function reconstructDIP(metadataDoc) {
    const zip = new JSZip();
    
    // Add manifest
    const manifest = {
        version: "1.0",
        id: metadataDoc._id.toString(),
        created: metadataDoc.creationDate.toISOString(),
        occurenceDate: metadataDoc.occurrenceDate,
        title: metadataDoc.title,
        description: metadataDoc.description,
        visibility: metadataDoc.visibility === 'public',
        submitter: metadataDoc.user,
        resourceType: metadataDoc.resourceType,
        files: [],
        comments: metadataDoc.comments || []
    };

    // Add resource-specific fields to manifest
    const resourceFields = [
        'sport', 'activityTime', 'activityDistance',
        'institution', 'course', 'schoolYear',
        'familyMember', 'places',
        'company', 'position',
        'feeling',
        'artist', 'genre', 'movie', 'festival'
    ];
    
    resourceFields.forEach(field => {
        if (metadataDoc[field] !== undefined) {
            manifest[field] = metadataDoc[field];
        }
    });

    // Create folders
    const dataFolder = zip.folder('data');
    const metadataFolder = zip.folder('metadata');

    // Add files and their metadata
    for (const fileId of metadataDoc.files) {
        const fileInfo = await FileInfo.getFileInfoById(fileId);
        try {
            // Read file data
            const fileData = fs.readFileSync(fileInfo.file_path);
            
            // Calculate file hash
            const fileHash = generateSHA256(fileData);
            
            // Add to zip
            dataFolder.file(fileInfo.filename, fileData);
            
            // Create metadata file
            const fileMetadata = {
                creationDate: metadataDoc.creationDate.toISOString(),
                submissionDate: metadataDoc.lastModified.toISOString(),
                submitter: metadataDoc.user,
                originalFilename: fileInfo.filename,
                mimeType: fileInfo.mimeType,
                size: fileInfo.size,
            };
            
            const metadataContent = JSON.stringify(fileMetadata, null, 2);
            const metadataFileName = `${fileInfo.filename}.json`;
            metadataFolder.file(metadataFileName, metadataContent);
            
            // Calculate metadata hash
            const metadataHash = generateSHA256(metadataContent);

            // Add file info to manifest
            manifest.files.push({
                filePath: `data/${fileInfo.filename}`,
                metadataPath: `metadata/${metadataFileName}`,
                checksum: {
                    algorithm: "SHA-256",
                    value: fileHash
                },
                metadataChecksum: {
                    algorithm: "SHA-256",
                    value: metadataHash
                },
                size: fileInfo.size
            });

        } catch (err) {
            console.error(`Error processing file ${fileInfo.filename}:`, err);
            continue;
        }
    }

    // Add manifest to zip
    zip.file('manifesto-DIP.json', JSON.stringify(manifest, null, 2));
    
    // Generate the zip file
    return zip.generateAsync({ type: 'nodebuffer' });
}

function generateSHA256(data) {
    if (data instanceof Buffer) {
        return crypto.createHash('sha256').update(data).digest('hex');
    } else if (typeof data === 'string') {
        return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
    } else if (data instanceof Uint8Array) {
        return crypto.createHash('sha256').update(data).digest('hex');
    } else {
        // For Blob-like objects (which we shouldn't have in Node.js)
        throw new Error('Unsupported data type for SHA-256 calculation');
    }
}


/* ROUTES */

router.post('/ingest', verifyTokenSimple, upload.single('sip'), async (req, res) => {
    let tempFilePath = req.file?.path;
    
    try {
        if (!req.file) {
            console.log('No file uploaded')
            return res.status(400).json({ error: 'No SIP package uploaded' });
        }

        const zipData = fs.readFileSync(tempFilePath);
        const zip = await JSZip.loadAsync(zipData);
        const zipFiles = Object.keys(zip.files);

        if (!zipFiles.includes('manifesto-SIP.json')) {
            console.log('Manifest file not found in SIP')
            return res.status(400).json({ error: 'Manifest file not found in SIP' });
        }

        const manifestContent = await zip.file('manifesto-SIP.json').async('string');
        const manifest = JSON.parse(manifestContent);

        const submitter = manifest.submitter;
        if (!submitter) {
            console.log('Submitter information missing in manifest')
            return res.status(400).json({ error: 'Submitter information missing in manifest' });
        }

        const userStoragePath = path.join(__dirname, '..', 'storage', 'temp', submitter);
        fs.mkdirSync(userStoragePath, { recursive: true });

        const verificationResults = await verifyFiles(zip, manifest, zipFiles);
        
        if (verificationResults.errors.length > 0) {
            console.log('File verification failed', verificationResults.errors);
            return res.status(400).json({
                error: 'Some files failed verification',
                details: verificationResults.errors
            });
        }

        const storedFiles = await processAndStoreFiles(zip, manifest, userStoragePath, submitter);
        
        const metadataDoc = await storeMetadata(manifest, storedFiles, submitter);

        fs.unlinkSync(tempFilePath);

        console.log('SIP package successfully processed');

        res.status(201).jsonp({
            success: true,
            pubId: metadataDoc._id,
            pubTitle: metadataDoc.title,
        });

    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error('Error processing SIP:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

router.get('/publications/visible', verifyTokenSimple, async (req, res) => {
    try {
        console.log('Fetching all visible publications');   
        const metadataDocs = await Metadata.getMetadataPublic();

        // Create a zip containing all DIPs
        const masterZip = new JSZip();
        
        for (const doc of metadataDocs) {
            const dipBuffer = await reconstructDIP(doc);
            masterZip.file(`dip-${doc._id}.zip`, dipBuffer);
        }

        const zipData = await masterZip.generateAsync({ type: 'nodebuffer' });
        
        res.status(200).send(zipData);

    } catch (err) {
        console.error('Error fetching visible publications:', err);
        res.status(500).json({ error: 'Failed to fetch publications' });
    }
});

router.get('/publications/user/:username', verifyTokenSimple, async (req, res) => {
    try {
        const metadataDocs = await Metadata.getMetadataUserPublic(req.params.username);

        // Create a zip containing all DIPs
        const masterZip = new JSZip();
        
        for (const doc of metadataDocs) {
            const dipBuffer = await reconstructDIP(doc);
            masterZip.file(`dip-${doc._id}.zip`, dipBuffer);
        }

        const zipData = await masterZip.generateAsync({ type: 'nodebuffer' });
        
        res.status(200).send(zipData);

    } catch (err) {
        console.error('Error fetching user publications:', err);
        res.status(500).json({ error: 'Failed to fetch user publications' });
    }
});

router.get('/publications/self/:username', verifyTokenSimple, async (req, res) => {
    try {
        if (req.params.username !== req.loggedUser.username && !req.loggedUser.role === 'admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const metadataDocs = await Metadata.getMetadataByUser(req.params.username);

        // Create a zip containing all DIPs
        const masterZip = new JSZip();
        
        for (const doc of metadataDocs) {
            const dipBuffer = await reconstructDIP(doc);
            masterZip.file(`dip-${doc._id}.zip`, dipBuffer);
        }

        const zipData = await masterZip.generateAsync({ type: 'nodebuffer' });

        res.status(200).send(zipData);

    } catch (err) {
        console.error('Error fetching user publications:', err);
        res.status(500).json({ error: 'Failed to fetch user publications' });
    }
});

router.get('/publications/:id', verifyTokenSimple, async (req, res) => {
    try {

        const metadataDoc = await Metadata.getMetadataByPubId(req.params.id);

        if (!metadataDoc) {
            return res.status(404).json({ error: 'Publication not found' });
        }

        const dipBuffer = await reconstructDIP(metadataDoc);
        res.status(200).send(dipBuffer);

    } catch (err) {
        console.error('Error fetching user publications:', err);
        res.status(500).json({ error: 'Failed to fetch user publications' });
    }
});

router.post('/publications/:id/comments', verifyTokenSimple, async (req, res) => {
    try {
        const publicationId = req.params.id;
        const { username, comment } = req.body;

        if (!comment || !username) {
            return res.status(400).json({ error: 'Username and comment are required' });
        }

        // Add the comment to the publication
        const commentObj = {
            username,
            comment,
            date: new Date()
        };

        const updatedDoc = await Metadata.addComment(publicationId, commentObj);

        res.status(200).json(updatedDoc);
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

router.put('/publications/:id', verifyTokenSimple, upload.single('sip'), async (req, res) => {
    let tempFilePath = req.file?.path;
    
    try {
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ error: 'No SIP package uploaded' });
        }

        const zipData = fs.readFileSync(tempFilePath);
        const zip = await JSZip.loadAsync(zipData);
        const zipFiles = Object.keys(zip.files);

        if (!zipFiles.includes('manifesto-SIP.json')) {
            console.log('Manifest file not found in SIP');
            return res.status(400).json({ error: 'Manifest file not found in SIP' });
        }

        const manifestContent = await zip.file('manifesto-SIP.json').async('string');
        const manifest = JSON.parse(manifestContent);

        // Verify the publication exists and belongs to the submitter
        const existingPub = await Metadata.getMetadataByPubId(req.params.id);
        if (!existingPub) {
            return res.status(404).json({ error: 'Publication not found' });
        }
        if (existingPub.user !== manifest.submitter) {
            return res.status(403).json({ error: 'You can only update your own publications' });
        }

        const userStoragePath = path.join(__dirname, '..', 'storage', 'temp', manifest.submitter);
        fs.mkdirSync(userStoragePath, { recursive: true });

        const verificationResults = await verifyFiles(zip, manifest, zipFiles);
        
        if (verificationResults.errors.length > 0) {
            console.log('File verification failed', verificationResults.errors);
            return res.status(400).json({
                error: 'Some files failed verification',
                details: verificationResults.errors
            });
        }

        // Get the old file IDs before updating
        const oldFileIds = existingPub.files || [];

        // Process and store the new files
        const storedFiles = await processAndStoreFiles(zip, manifest, userStoragePath, manifest.submitter);

        // Update the metadata document
        const fileIds = storedFiles
            .filter(f => !f.error)
            .map(f => f.fileId);

        const updateDoc = {
            lastModified: new Date(),
            occurrenceDate: new Date(manifest.occurenceDate),
            title: manifest.title,
            description: manifest.description,
            visibility: manifest.visibility ? 'public' : 'private',
            files: fileIds,
            resourceType: manifest.resourceType
        };

        // Add resource-specific fields
        const resourceFields = [
            'sport', 'activityTime', 'activityDistance',
            'institution', 'course', 'schoolYear',
            'familyMember', 'places',
            'company', 'position',
            'feeling',
            'artist', 'genre', 'movie', 'festival'
        ];
        
        resourceFields.forEach(field => {
            if (manifest[field] !== undefined) {
                updateDoc[field] = manifest[field];
            }
        });

        const updatedMetadata = await Metadata.updateMetadata(
            req.params.id,
            updateDoc,
            { new: true }
        );

        // Cleanup old files that are no longer referenced
        const filesToRemove = oldFileIds.filter(id => !fileIds.includes(id.toString()));
        if (filesToRemove.length > 0) {
            console.log(`Cleaning up ${filesToRemove.length} old files`);
            await Promise.all(filesToRemove.map(async (fileId) => {
                try {
                    const fileInfo = await FileInfo.getFileInfoById(fileId);
                    if (fileInfo && fileInfo.file_path) {
                        // Delete the file from filesystem
                        if (fs.existsSync(fileInfo.file_path)) {
                            fs.unlinkSync(fileInfo.file_path);
                            console.log(`Deleted file: ${fileInfo.file_path}`);
                        }
                        // Delete the file info from database
                        await FileInfo.deleteFileInfo(fileId);
                        console.log(`Deleted file info for ID: ${fileId}`);
                    }
                } catch (err) {
                    console.error(`Error cleaning up file ${fileId}:`, err);
                }
            }));
        }

        fs.unlinkSync(tempFilePath);

        console.log('SIP package successfully updated');

        res.status(200).json({
            success: true,
            pubId: updatedMetadata._id,
            pubTitle: updatedMetadata.title,
            filesRemoved: filesToRemove.length
        });

    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error('Error updating publication:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});



module.exports = router;