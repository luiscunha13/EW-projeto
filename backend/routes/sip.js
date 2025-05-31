const express = require('express');
const router = express.Router();
const multer = require('multer');
const JSZip = require('jszip');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const Metadata = require('../models/metadata');
const FileInfo = require('../models/fileInfo');

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

router.post('/ingest', upload.single('sip'), async (req, res) => {
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

        const userStoragePath = path.join(__dirname, '..', 'storage', submitter);
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

        res.json({
            message: 'SIP package successfully processed',
            metadataId: metadataDoc._id,
            files: storedFiles.map(f => ({
                filename: f.filename,
                fileId: f.fileId
            })),
            storageLocation: userStoragePath
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
            fs.writeFileSync(fileStoragePath, fileData);

            // Store file info in MongoDB
            const fileInfoDoc = await FileInfo.create({
                filename: fileName,
                file_path: fileStoragePath,
                checksum: fileInfo.checksum.value,
                mimeType: fileInfo.mimeType || 'application/octet-stream'
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
            occurrenceDate: new Date(manifest.created),
            title: manifest.title,
            description: manifest.description,
            visibility: manifest.isPublic ? 'public' : 'private',
            files: fileIds,
            resourceType: manifest.resourceType,
            comments: [] 
        };

        // Add resource-specific fields based on the resourceType
        switch (manifest.resourceType) {
            case 'desporto':
                if (manifest.sport) metadataDoc.sport = manifest.sport;
                if (manifest.activityTime) metadataDoc.activityTime = manifest.activityTime;
                if (manifest.activityDistance) metadataDoc.activityDistance = manifest.activityDistance;
                break;
                
            case 'académico':
                if (manifest.institution) metadataDoc.institution = manifest.institution;
                if (manifest.course) metadataDoc.course = manifest.course;
                if (manifest.schoolYear) metadataDoc.schoolYear = manifest.schoolYear;
                break;
                
            case 'familiar':
                metadataDoc.familyMember = manifest.familyMember || [];
                break;
                
            case 'viagem':
                metadataDoc.places = manifest.places || [];
                break;
                
            case 'trabalho':
                if (manifest.company) metadataDoc.company = manifest.company;
                if (manifest.position) metadataDoc.position = manifest.position;
                break;
                
            case 'pessoal':
                if (manifest.feeling) metadataDoc.feeling = manifest.feeling;
                break;
                
            case 'entretenimento':
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

module.exports = router;