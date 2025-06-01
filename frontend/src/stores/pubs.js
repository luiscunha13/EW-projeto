import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import JSZip from 'jszip';
import axios from 'axios';
import { useAuthStore } from './auth';

export const usePublicationsStore = defineStore('publications', () => {
    const activePublications = ref({});
    const loading = ref(false);
    const error = ref(null);

    async function calculateSHA256(data) {
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
    
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', uint8Array);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function extractFilesFromDIP(zip, manifest) {
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
    
                // Create object URL for the blob
                const fileUrl = URL.createObjectURL(fileData);
                
                // Determine if it's a media file
                const isMedia = fileInfo.filePath.match(/\.(mp4|webm|ogg|mov|avi|mp3|wav|m4a|flac)$/i);
                
                results.push({
                    filename: fileName,
                    fileUrl,
                    blob: fileData, // Store the original blob
                    mimeType: fileMetadata?.mimeType || fileData.type || 'application/octet-stream',
                    size: fileInfo.size,
                    cleanUp: () => {
                        URL.revokeObjectURL(fileUrl);
                    }
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

    const processDIP = async (zipData) => {

        try {
            const zip = await JSZip.loadAsync(zipData);
            const manifestContent = await zip.file('manifesto-DIP.json').async('string');
            const manifest = JSON.parse(manifestContent);

            const verificationResults = await verifyFiles(zip, manifest);
            if (verificationResults.errors.length > 0) {
                throw new Error('File verification failed: ' + 
                    verificationResults.errors.map(e => e.error).join(', '));
            }

            const files = await extractFilesFromDIP(zip, manifest);

            const publication = {
                id: manifest.id,
                user: manifest.submitter,
                occurrenceDate: manifest.occurenceDate,
                title: manifest.title,
                description: manifest.description,
                visibility: manifest.visibility,
                resourceType: manifest.resourceType,
                comments: manifest.comments || [],
                files: files.filter(f => !f.error),
                createdAt: manifest.created,
                ...getResourceSpecificFields(manifest)
            };
            
            return publication;
        } catch (err) {
            console.error('Error processing DIP:', err);
            throw err;
        }
    };

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

    const loadPublications = async (type, username = null) => {
        try {
            const authStore = useAuthStore();
            loading.value = true;
            error.value = null;

            cleanupActivePublications();

            let response;
            switch (type) {
                case 'visible':
                    response = await axios.get('http://localhost:14000/api/publications/visible', {
                        responseType: 'arraybuffer',
                        headers: {
                            Authorization: `Bearer ${authStore.token}`,
                        },
                    });
                    break;
                case 'user':
                    if (!username) throw new Error('Username required for user publications');
                    response = await axios.get(`http://localhost:14000/api/publications/user/${username}`, {
                        responseType: 'arraybuffer',
                        headers: {
                            Authorization: `Bearer ${authStore.token}`,
                        },
                    });
                    break;
                case 'self':
                    if (!username) throw new Error('Username required for self publications');
                    response = await axios.get(`http://localhost:14000/api/publications/self/${username}`, {
                        responseType: 'arraybuffer',
                        headers: {
                            Authorization: `Bearer ${authStore.token}`,
                        },
                    });
                    break;
                default:
                    throw new Error('Invalid publication type requested');
            }

            const masterZip = await JSZip.loadAsync(response.data);
            const dipFiles = Object.keys(masterZip.files).filter(f => f.endsWith('.zip'));

            const processingPromises = dipFiles.map(async filename => {
                const dipData = await masterZip.file(filename).async('arraybuffer');
                return processDIP(dipData);
            });

            const publications = await Promise.all(processingPromises);
            
            publications.forEach(pub => {
                activePublications.value[pub.id] = pub;
            });
            console.log('PUBS', publications)
            return publications;
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };

    const getPublicationById = async (id) => {
        try {
            const authStore = useAuthStore();
            loading.value = true;
            error.value = null;
    
            const response = await axios.get(`http://localhost:14000/api/publications/${id}`, {
                responseType: 'arraybuffer',
                headers: {
                    Authorization: `Bearer ${authStore.token}`,
                },
            });
    
            // Process the DIP directly (no master zip in this case)
            const publication = await processDIP(response.data);
            
            activePublications.value[publication.id] = publication;
            return publication;
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
            throw err;
        } finally {
            loading.value = false;
        }
    };
    const cleanupActivePublications = () => {
        Object.values(activePublications.value).forEach(pub => {
            pub.files.forEach(file => {
                if (file.cleanUp) file.cleanUp();
            });
        });
        activePublications.value = {};
    };

    const getPublication = (id) => {
        return activePublications.value[id];
    };

    const addComment = async (publicationId, username, comment) => {
        try {
            const authStore = useAuthStore();
            const response = await axios.post(
                `http://localhost:14000/api/publications/${publicationId}/comments`,
                { username, comment },
                {
                    headers: {
                        Authorization: `Bearer ${authStore.token}`,
                    },
                }
            );
    
            // Update local state
            const publication = activePublications.value[publicationId];
            if (publication) {
                publication.comments.push(response.data.comments.slice(-1)[0]); // Add the new comment
            }
    
            return response.data;
        } catch (err) {
            console.error('Error adding comment:', err);
            throw err;
        }
    };

    return {
        activePublications: computed(() => activePublications.value),
        loading,
        error,
        loadPublications,
        cleanupActivePublications,
        getPublication,
        getPublicationById,
        addComment
    };
});