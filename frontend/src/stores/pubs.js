import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import JSZip from 'jszip';
import axios from 'axios';

export const usePublicationsStore = defineStore('publications', () => {
    const publications = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const tempDir = 'temp_publications'; 

    // Helper function to calculate SHA-256 hash
    const calculateSHA256 = async (data) => {
        const buffer = await data.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    };

    // Verify and process a single SIP
    const processSIP = async (zipData, filename) => {
        try {
            const zip = await JSZip.loadAsync(zipData);
            const zipFiles = Object.keys(zip.files);

            if (!zipFiles.includes('manifesto-SIP.json')) {
                throw new Error('Manifest file not found in SIP');
            }

            const manifestContent = await zip.file('manifesto-SIP.json').async('string');
            const manifest = JSON.parse(manifestContent);

            // Verify all files in the manifest
            const verification = await verifySipIntegrity(zipData);
            if (!verification.valid) {
                throw new Error(`SIP verification failed: ${verification.error}`);
            }

            // Extract files to temporary directory
            const extractedFiles = [];
            for (const fileInfo of manifest.files) {
                const fileEntry = zip.file(fileInfo.filePath);
                if (!fileEntry) continue;

                const fileData = await fileEntry.async('arraybuffer');
                const fileBlob = new Blob([fileData]);
                const fileUrl = URL.createObjectURL(fileBlob);
                
                extractedFiles.push({
                    path: fileInfo.filePath,
                    url: fileUrl,
                    name: fileInfo.filePath.split('/').pop(),
                    type: fileInfo.mimeType || 'application/octet-stream',
                    size: fileInfo.size
                });
            }

            // Structure the publication data
            const publication = {
                id: filename.replace('.zip', ''),
                user: manifest.submitter,
                occurrenceDate: manifest.occurenceDate,
                title: manifest.title,
                description: manifest.description,
                visibility: manifest.isPublic ? 'public' : 'private',
                resourceType: manifest.resourceType,
                comments: [],
                files: extractedFiles,
                createdAt: manifest.created,
                // Resource-specific fields
                sport: manifest.sport,
                activityTime: manifest.activityTime,
                activityDistance: manifest.activityDistance,
                institution: manifest.institution,
                course: manifest.course,
                schoolYear: manifest.schoolYear,
                familyMember: manifest.familyMember || [],
                places: manifest.places || [],
                company: manifest.company,
                position: manifest.position,
                feeling: manifest.feeling,
                artist: manifest.artist,
                genre: manifest.genre,
                movie: manifest.movie,
                festival: manifest.festival
            };

            return { success: true, publication };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    // Process the master ZIP containing multiple SIPs
    const processMasterZip = async (zipData) => {
        try {
            const zip = await JSZip.loadAsync(zipData);
            const zipFiles = Object.keys(zip.files);
            const processedPublications = [];

            for (const filename of zipFiles) {
                if (!filename.endsWith('.zip')) continue;

                const sipData = await zip.file(filename).async('arraybuffer');
                const result = await processSIP(sipData, filename);
                
                if (result.success) {
                    processedPublications.push(result.publication);
                } else {
                    console.error(`Failed to process ${filename}:`, result.error);
                }
            }

            // Update publications store
            publications.value = processedPublications;
            return processedPublications;
        } catch (err) {
            console.error('Error processing master ZIP:', err);
            throw err;
        }
    };

    // Download ZIP helper
    const downloadZip = async (data) => {
        try {
            const zipData = await processMasterZip(data);
            return zipData;
        } catch (err) {
            error.value = err.message;
            console.error('Error processing downloaded ZIP:', err);
            throw err;
        }
    };

    // Fetch all visible publications (for feed)
    const fetchVisiblePublications = async () => {
        try {
            loading.value = true;
            error.value = null;
            const response = await axios.get('http://localhost:14000/api/publications/visible', {
                responseType: 'arraybuffer'
            });
            return await downloadZip(response.data);
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
            console.error('Error fetching visible publications:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Fetch user publications
    const fetchUserPublications = async (username) => {
        try {
            loading.value = true;
            error.value = null;
            const response = await axios.get(
                `http://localhost:14000/api/publications/user/${username}`, 
                { responseType: 'arraybuffer' }
            );
            return await downloadZip(response.data);
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
            console.error('Error fetching user publications:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Fetch self publications (both public and private)
    const fetchSelfPublications = async (username) => {
        try {
            loading.value = true;
            error.value = null;
            const response = await axios.get(
                `http://localhost:14000/api/publications/self/${username}`, 
                { responseType: 'arraybuffer' }
            );
            return await downloadZip(response.data);
        } catch (err) {
            error.value = err.response?.data?.message || err.message;
            console.error('Error fetching user publications:', err);
            throw err;
        } finally {
            loading.value = false;
        }
    };

    // Verify SIP integrity
    const verifySipIntegrity = async (zipData) => {
        try {
            const zip = await JSZip.loadAsync(zipData);
            const zipFiles = Object.keys(zip.files);

            if (!zipFiles.includes('manifesto-SIP.json')) {
                throw new Error('Manifest file not found in SIP');
            }

            const manifestContent = await zip.file('manifesto-SIP.json').async('string');
            const manifest = JSON.parse(manifestContent);

            for (const fileInfo of manifest.files) {
                const fileEntry = zip.file(fileInfo.filePath);
                if (!fileEntry) {
                    throw new Error(`File ${fileInfo.filePath} not found in package`);
                }

                const fileData = await fileEntry.async('arraybuffer');
                const calculatedHash = await calculateSHA256(new Blob([fileData]));
                
                if (calculatedHash !== fileInfo.checksum.value) {
                    throw new Error(`Checksum mismatch for ${fileInfo.filePath}`);
                }

                if (fileInfo.metadataPath) {
                    const metadataEntry = zip.file(fileInfo.metadataPath);
                    if (!metadataEntry) {
                        throw new Error(`Metadata file ${fileInfo.metadataPath} not found`);
                    }

                    const metadataData = await metadataEntry.async('arraybuffer');
                    const metadataHash = await calculateSHA256(new Blob([metadataData]));
                    
                    if (fileInfo.metadataChecksum && metadataHash !== fileInfo.metadataChecksum.value) {
                        throw new Error(`Metadata checksum mismatch for ${fileInfo.metadataPath}`);
                    }
                }
            }
            console.log('SIP integrity verified successfully');

            return { valid: true, manifest };
        } catch (err) {
            return { valid: false, error: err.message };
        }
    };

    // Add a comment to a publication
    const addComment = (publicationId, username, comment) => {
        const publication = publications.value.find(p => p.id === publicationId);
        if (publication) {
            publication.comments.push({ username, comment });
        }
    };

    return {
        publications,
        loading,
        error,
        fetchVisiblePublications,
        fetchUserPublications,
        fetchSelfPublications,
        addComment
    };
});