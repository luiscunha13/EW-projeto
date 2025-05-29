const express = require('express');
var router = express.Router();
const multer = require('multer');
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const { SHA256 } = require('crypto-js');

const upload = multer({ dest: 'uploads/' });

router.post('/api/ingest', upload.single('sip'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No SIP package uploaded' });
        }

        const zipData = fs.readFileSync(req.file.path);
        const zip = await JSZip.loadAsync(zipData);
        const zipFiles = Object.keys(zip.files);

        if (!zipFiles.includes('manifesto-SIP.json')) {
            return res.status(400).json({ error: 'Manifest file not found in SIP' });
        }

        const manifestContent = await zip.file('manifest-SIP.json').async('string');
        const manifest = JSON.parse(manifestContent);

        const verificationResults = await Promise.all(
            manifest.files.map(async fileInfo => {
                try {
                    const filePath = fileInfo.filePath.replace(/^\/?data\//, '');
                    if (!zipFiles.some(f => f.includes(filePath))) {
                        return {
                            file: fileInfo.filePath,
                            status: 'missing',
                            error: 'File not found in package'
                        };
                    }

                    const fileEntry = zip.file(fileInfo.filePath);
                    const fileData = await fileEntry.async('nodebuffer');
                    const calculatedHash = SHA256(fileData.toString('binary')).toString();

                    if (calculatedHash !== fileInfo.checksum.value) {
                        return {
                            file: fileInfo.filePath,
                            status: 'invalid',
                            error: 'Checksum mismatch'
                        };
                    }

                    if (fileInfo.metadataPath) {
                        const metadataPath = fileInfo.metadataPath.replace(/^\/?metadata\//, '');
                        if (!zipFiles.some(f => f.includes(metadataPath))) {
                            return {
                                file: fileInfo.filePath,
                                status: 'metadata_missing',
                                error: 'Metadata file not found'
                            };
                        }

                        const metadataEntry = zip.file(fileInfo.metadataPath);
                        const metadataData = await metadataEntry.async('nodebuffer');
                        const metadataHash = SHA256(metadataData.toString('binary')).toString();
                        
                        if (fileInfo.metadataChecksum && metadataHash !== fileInfo.metadataChecksum.value) {
                            return {
                                file: fileInfo.filePath,
                                status: 'metadata_invalid',
                                error: 'Metadata checksum mismatch'
                            };
                        }
                    }

                    return {
                        file: fileInfo.filePath,
                        status: 'valid',
                        size: fileInfo.size
                    };
                } catch (err) {
                    return {
                        file: fileInfo.filePath,
                        status: 'error',
                        error: err.message
                    };
                }
            })
        );

        const failedVerifications = verificationResults.filter(r => r.status !== 'valid');
        if (failedVerifications.length > 0) {
            return res.status(400).json({
                error: 'Some files failed verification',
                details: failedVerifications
            });
        }

        const extractPath = path.join(__dirname, 'storage', Date.now().toString());
        fs.mkdirSync(extractPath, { recursive: true });

        for (const fileInfo of manifest.files) {
            const fileEntry = zip.file(fileInfo.filePath);
            const fileData = await fileEntry.async('nodebuffer');
            const outputPath = path.join(extractPath, fileInfo.filePath);
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, fileData);

            if (fileInfo.metadataPath) {
                const metadataEntry = zip.file(fileInfo.metadataPath);
                const metadataData = await metadataEntry.async('nodebuffer');
                const metadataOutputPath = path.join(extractPath, fileInfo.metadataPath);
                fs.mkdirSync(path.dirname(metadataOutputPath), { recursive: true });
                fs.writeFileSync(metadataOutputPath, metadataData);
            }
        }

        //processar a metadata e manda la para o mongo
        for (const fileInfo of manifest.files) {
            if (fileInfo.metadataPath) {
                const metadataEntry = zip.file(fileInfo.metadataPath);
                const metadata = JSON.parse(await metadataEntry.async('string'));

                const storagePath = path.join(extractPath, fileInfo.filePath);
      
                const metadataDoc = new Metadata({
                    creationDate: new Date(metadata.creationDate),
                    submissionDate: fileInfo.submissionDate,
                    producer: metadata.producer,
                    submitter: req.user._id, 
                    title: metadata.title,
                    resourceType: metadata.resourceType,
                    originalFilename: path.basename(fileInfo.filePath),
                    mimeType: metadata.mimeType || 'application/octet-stream',
                    storageLocation: storagePath,
                });

                await metadataDoc.save();
                // mandar isto para a database
            }
        }

        fs.unlinkSync(req.file.path);

        res.json({
            message: 'SIP package successfully processed',
            receivedFiles: verificationResults,
            storageLocation: extractPath
        });

    } catch (error) {
        console.error('Error processing SIP:', error);
        res.status(500).json({ error: error.message });
    }
});

