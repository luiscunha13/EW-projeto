import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import JSZip from 'jszip';
import axios from 'axios';
import crypto from 'crypto';

export const usePublicationsStore = defineStore('publications', () => {
    // Active publications in memory (cleared when not needed)
    const activePublications = ref({});
    const loading = ref(false);
    const error = ref(null);

    // Cache for already processed publications (optional optimization)
    const publicationCache = ref(new Map());

    // Helper function to calculate SHA-256 hash
    async function calculateSHA256(data) {
        // Convert different input types to Uint8Array
        let uint8Array;
        if (data instanceof ArrayBuffer) {
            uint8Array = new Uint8Array(data);
        } else if (typeof data === 'string') {
            const encoder = new TextEncoder();
            uint8Array = encoder.encode(data);
        } else if (data instanceof Uint8Array) {
            uint8Array = data;
        } else if (data instanceof Blob) {
            const arrayBuffer = await data.arrayBuffer();
            uint8Array = new Uint8Array(arrayBuffer);
        } else {
            throw new Error('Unsupported data type for SHA-256 calculation');
        }
    
        // Calculate hash using Web Crypto API
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', uint8Array);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Process and extract files from SIP (without permanent storage)
    async function extractFilesFromSIP(zip, manifest) {
        const results = [];
        
        for (const fileInfo of manifest.files) {
            try {
                const fileEntry = zip.file(fileInfo.filePath) || 
                                 zip.file(`data/${fileInfo.filePath}`) || 
                                 zip.file(fileInfo.filePath.replace(/^data\//, ''));
                
                if (!fileEntry) {
                    throw new Error(`File not found: ${fileInfo.filePath}`);
                }

                const fileData = await fileEntry.async('blob');
                const fileName = fileInfo.filePath.split('/').pop();
                
                // Create object URL for temporary access
                const fileUrl = URL.createObjectURL(fileData);
                
                results.push({
                    filename: fileName,
                    fileUrl,
                    mimeType: fileInfo.mimeType || 'application/octet-stream',
                    size: fileInfo.size,
                    cleanUp: () => URL.revokeObjectURL(fileUrl) // Cleanup function
                });
            } catch (err) {
                console.error(`Error processing file ${fileInfo.filePath}:`, err);
                results.push({
                    originalPath: fileInfo.filePath,
                    error: err.message
                });
            }
        }
        
        return results;
    }

    // Process a single SIP package
    const processSIP = async (zipData, sipId) => {
        // Check cache first
        if (publicationCache.value.has(sipId)) {
            return publicationCache.value.get(sipId);
        }

        try {
            const zip = await JSZip.loadAsync(zipData);
            const manifestContent = await zip.file('manifesto-SIP.json').async('string');
            const manifest = JSON.parse(manifestContent);

            // Verify files
            const verificationResults = await verifyFiles(zip, manifest);
            if (verificationResults.errors.length > 0) {
                throw new Error('File verification failed: ' + 
                    verificationResults.errors.map(e => e.error).join(', '));
            }

            // Extract files
            const files = await extractFilesFromSIP(zip, manifest);

            // Create publication object
            const publication = {
                id: sipId,
                user: manifest.submitter,
                occurrenceDate: manifest.occurenceDate,
                title: manifest.title,
                description: manifest.description,
                visibility: manifest.visibility === 'public',
                resourceType: manifest.resourceType,
                comments: manifest.comments || [],
                files: files.filter(f => !f.error),
                createdAt: manifest.created,
                // Resource-specific fields
                ...getResourceSpecificFields(manifest)
            };

            // Add to cache
            publicationCache.value.set(sipId, publication);
            
            return publication;
        } catch (err) {
            console.error('Error processing SIP:', err);
            throw err;
        }
    };

    // Helper to extract resource-specific fields
    function getResourceSpecificFields(manifest) {
        const fields = {};
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
                fields[field] = manifest[field];
            }
        });
        
        return fields;
    }

    // Verify files in SIP package
    async function verifyFiles(zip, manifest) {
        const results = { valid: [], errors: [] };
        
        for (const fileInfo of manifest.files) {
            try {
                // File existence check
                let fileEntry = zip.file(fileInfo.filePath);
                if (!fileEntry) {
                    const fileName = fileInfo.filePath.replace(/^data\//, '');
                    fileEntry = zip.file(`data/${fileName}`) || zip.file(fileName);
                }
                
                if (!fileEntry) {
                    results.errors.push({
                        file: fileInfo.filePath,
                        status: 'missing',
                        error: 'File not found in package'
                    });
                    continue;
                }

                // Checksum verification
                const fileData = await fileEntry.async('arraybuffer');
                const calculatedHash = await calculateSHA256(fileData);
                
                if (calculatedHash !== fileInfo.checksum.value) {
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
                        results.errors.push({
                            file: fileInfo.filePath,
                            status: 'metadata_missing',
                            error: 'Metadata file not found'
                        });
                        continue;
                    }

                    const metadataData = await metadataEntry.async('arraybuffer');
                    const metadataHash = await calculateSHA256(metadataData);
                    
                    if (fileInfo.metadataChecksum && metadataHash !== fileInfo.metadataChecksum.value) {
                        results.errors.push({
                            file: fileInfo.filePath,
                            status: 'metadata_invalid',
                            error: `Metadata checksum mismatch. Expected: ${fileInfo.metadataChecksum.value}, Got: ${metadataHash}`
                        });
                        continue;
                    }
                }

                results.valid.push({
                    file: fileInfo.filePath,
                    status: 'valid',
                    size: fileInfo.size
                });
            } catch (err) {
                results.errors.push({
                    file: fileInfo.filePath,
                    status: 'error',
                    error: err.message
                });
            }
        }
        
        return results;
    }

    // Load publications for a specific view
    const loadPublications = async (type, username = null) => {
        try {
            loading.value = true;
            error.value = null;

            // Clean up previous publications
            cleanupActivePublications();

            let response;
            switch (type) {
                case 'visible':
                    response = await axios.get('http://localhost:14000/api/publications/visible', {
                        responseType: 'arraybuffer'});
                    break;
                case 'user':
                    if (!username) throw new Error('Username required for user publications');
                    response = await axios.get(`http://localhost:14000/api/publications/user/${username}`, {
                        responseType: 'arraybuffer'});
                    break;
                case 'self':
                    if (!username) throw new Error('Username required for self publications');
                    response = await axios.get(`http://localhost:14000/api/publications/self/${username}`, {
                        responseType: 'arraybuffer'});
                    break;
                default:
                    throw new Error('Invalid publication type requested');
            }

            // Process the master ZIP
            const masterZip = await JSZip.loadAsync(response.data);
            const sipFiles = Object.keys(masterZip.files).filter(f => f.endsWith('.zip'));

            // Process each SIP in parallel
            const processingPromises = sipFiles.map(async filename => {
                const sipId = filename.replace('.zip', '').replace('sip-', '');
                const sipData = await masterZip.file(filename).async('arraybuffer');
                return processSIP(sipData, sipId);
            });

            const publications = await Promise.all(processingPromises);
            
            // Store in active publications
            publications.forEach(pub => {
                activePublications.value[pub.id] = pub;
            });

            return publications;
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Clean up active publications (call when leaving page)
    const cleanupActivePublications = () => {
        Object.values(activePublications.value).forEach(pub => {
            pub.files.forEach(file => {
                if (file.cleanUp) file.cleanUp();
            });
        });
        activePublications.value = {};
    };

    // Get active publication by ID
    const getPublication = (id) => {
        return activePublications.value[id] || publicationCache.value.get(id);
    };

    // Add comment to publication
    const addComment = (publicationId, username, comment) => {
        const publication = activePublications.value[publicationId] || publicationCache.value.get(publicationId);
        if (publication) {
            publication.comments.push({ username, comment, createdAt: new Date() });
        }
    };

    return {
        activePublications: computed(() => activePublications.value),
        loading,
        error,
        loadPublications,
        cleanupActivePublications,
        getPublication,
        addComment
    };
});