const express = require('express');
const router = express.Router();
const multer = require('multer');
const JSZip = require('jszip');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const Metadata = require('../models/metadata');

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

        // Get the submitter from the manifest
        const submitter = manifest.submitter;
        if (!submitter) {
            console.log('Submitter information missing in manifest')
            return res.status(400).json({ error: 'Submitter information missing in manifest' });
        }

        const verificationResults = await verifyFiles(zip, manifest, zipFiles);
        
        if (verificationResults.errors.length > 0) {
            console.log('File verification failed', verificationResults.errors);
            return res.status(400).json({
                error: 'Some files failed verification',
                details: verificationResults.errors
            });
        }
        

        // Create user-specific storage directory using the submitter from manifest
        const userStoragePath = path.join(__dirname, '..', 'storage', submitter);
        const extractPath = path.join(userStoragePath, Date.now().toString());
        
        await processAndStoreFiles(zip, manifest, extractPath, submitter);
        //await storeMetadata(zip, manifest, extractPath, submitter);

        fs.unlinkSync(tempFilePath);

        console.log('SIP package successfully processed and stored');

        res.json({
            message: 'SIP package successfully processed',
            receivedFiles: verificationResults.valid,
            storageLocation: extractPath
        });

    } catch (error) {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
        }
        console.error('Error processing SIP:', error);
        // Ensure we return JSON for API errors
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

function calculateSHA256(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Helper functions
async function verifyFiles(zip, manifest, zipFiles) {
    const results = { valid: [], errors: [] };
    
    for (const fileInfo of manifest.files) {
        try {
            console.log(`Verifying file: ${fileInfo.filePath}`);
            
            // File existence check - be more flexible with path matching
            let fileEntry = zip.file(fileInfo.filePath);
            if (!fileEntry) {
                // Try without data/ prefix
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

            // Checksum verification - use consistent method
            const fileData = await fileEntry.async('nodebuffer'); // Use nodebuffer for consistency
            const calculatedHash = calculateSHA256(fileData);
            
            console.log(`Expected hash: ${fileInfo.checksum.value}`);
            console.log(`Calculated hash: ${calculatedHash}`);

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
                    // Try without metadata/ prefix
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
                
                console.log(`Expected metadata hash: ${fileInfo.metadataChecksum?.value}`);
                console.log(`Calculated metadata hash: ${metadataHash}`);
                
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

async function processAndStoreFiles(zip, manifest, extractPath, username) {
    fs.mkdirSync(extractPath, { recursive: true });

    // Create standard directory structure
    const dataPath = path.join(extractPath, 'data');
    const metadataPath = path.join(extractPath, 'metadata');
    fs.mkdirSync(dataPath, { recursive: true });
    fs.mkdirSync(metadataPath, { recursive: true });

    for (const fileInfo of manifest.files) {
        const fileEntry = zip.file(fileInfo.filePath);
        const fileData = await fileEntry.async('nodebuffer');
        const outputPath = path.join(dataPath, path.basename(fileInfo.filePath));
        fs.writeFileSync(outputPath, fileData);

        if (fileInfo.metadataPath) {
            const metadataEntry = zip.file(fileInfo.metadataPath);
            const metadataData = await metadataEntry.async('nodebuffer');
            const metadataOutputPath = path.join(metadataPath, path.basename(fileInfo.metadataPath));
            fs.writeFileSync(metadataOutputPath, metadataData);
        }
    }
}

async function storeMetadata(zip, manifest, extractPath, username) {
    for (const fileInfo of manifest.files) {
        if (fileInfo.metadataPath) {
            const metadataEntry = zip.file(fileInfo.metadataPath);
            const metadata = JSON.parse(await metadataEntry.async('string'));
            const filePath = path.join('data', path.basename(fileInfo.filePath));

            const metadataDoc = new Metadata({
                creationDate: new Date(metadata.creationDate),
                submissionDate: new Date(metadata.submissionDate || Date.now()),
                producer: metadata.producer,
                submitter: metadata.submitter,
                title: metadata.title,
                resourceType: metadata.resourceType,
                originalFilename: path.basename(fileInfo.filePath),
                mimeType: metadata.mimeType || 'application/octet-stream',
                storageLocation: path.join(extractPath, filePath),
                userDirectory: path.join('users', username) 
            });

            await metadataDoc.save();
        }
    }
}

module.exports = router;