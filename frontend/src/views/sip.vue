<template>
    <div class="sip-uploader">
      <h2>Create and Upload SIP</h2>
  
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
  
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="producer">Producer (for the entire SIP):</label>
          <input type="text" id="producer" v-model="sipMetadata.producer" required />
        </div>
  
        <h3>Add Resource Files</h3>
        <div v-for="(fileItem, index) in fileItems" :key="index" class="file-item-section">
          <h4>Resource {{ index + 1 }}</h4>
          <div class="form-group">
            <label :for="'file-' + index">Select File:</label>
            <input type="file" :id="'file-' + index" @change="handleIndividualFileChange($event, index)" required />
          </div>
  
          <div class="form-group">
            <label :for="'title-' + index">Title:</label>
            <input type="text" :id="'title-' + index" v-model="fileItem.metadata.title" required />
          </div>
  
          <div class="form-group">
            <label :for="'resourceType-' + index">Resource Type:</label>
            <select :id="'resourceType-' + index" v-model="fileItem.metadata.resourceType" required>
              <option value="">Select a type</option>
              <option value="desporto">Desporto</option>
              <option value="académico">Académico</option>
              <option value="familiar">Familiar</option>
              <option value="viagem">Viagem</option>
              <option value="trabalho">Trabalho</option>
              <option value="pessoal">Pessoal</option>
              <option value="entretenimento">Entretenimento</option>
              <option value="outro">Outro</option>
            </select>
          </div>
  
          <button type="button" @click="removeFileItem(index)" class="remove-button">Remove Resource</button>
        </div>
  
        <button type="button" @click="addFileItem" class="add-button">Add New File Resource</button>
  
        <button type="submit" :disabled="isUploading" class="submit-button">
          {{ isUploading ? 'Uploading SIP...' : 'Upload Full SIP' }}
        </button>
        <button 
            type="button" 
            @click="downloadSip" 
            :disabled="isUploading || fileItems.length === 0" 
            class="download-button">
            Download SIP for Inspection
        </button>
      </form>
    </div>
  </template>
  
  <script>
  import JSZip from 'jszip'; 
  import { saveAs } from 'file-saver';
  
  export default {
    data() {
        return {
            sipMetadata: {
                producer: '',
                submitter: '',
                creationDate: new Date().toISOString().split('T')[0]
            },
            fileItems: [],
            successMessage: '',
            errorMessage: '',
            isUploading: false,
        };
    },
    created() {
      this.addFileItem(); // Start with one file item when the component is created
    },
    methods: {
      addFileItem() {
        this.fileItems.push({
          file: null, // The actual File object
          metadata: {
            title: '',
            resourceType: '',
            // creationDate and producer will be derived/set from the main SIP metadata
          },
        });
      },
  
      removeFileItem(index) {
        this.fileItems.splice(index, 1);
      },
  
      handleIndividualFileChange(event, index) {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            // Direct assignment works in Vue 3
            this.fileItems[index].file = selectedFile;
            
            // Pre-fill title if empty, using file name
            if (!this.fileItems[index].metadata.title) {
                this.fileItems[index].metadata.title = selectedFile.name.split('.').slice(0, -1).join('.');
            }
        }
      },
  
      async handleSubmit() {
            this.successMessage = '';
            this.errorMessage = '';
            this.isUploading = true;

            try {
                // Validation (keep existing validation)

                const zip = new JSZip();
                const manifest = {
                    version: "1.0",
                    created: new Date().toISOString(),
                    producer: this.sipMetadata.producer,
                    submitter: this.sipMetadata.submitter,
                    files: []
                };

                // Create folders in ZIP
                const dataFolder = zip.folder('data');
                const metadataFolder = zip.folder('metadata');

                // Process each file
                for (const fileItem of this.fileItems) {
                    const file = fileItem.file;
                    
                    // 1. Add file to data folder
                    dataFolder.file(file.name, file);
                    const fileHash = await this.calculateSHA256(file);

                    // 2. Create metadata file
                    const metadata = {
                        creationDate: this.sipMetadata.creationDate,
                        submissionDate: new Date().toISOString(),
                        producer: this.sipMetadata.producer,
                        submitter: this.sipMetadata.submitter,
                        title: fileItem.metadata.title,
                        resourceType: fileItem.metadata.resourceType,
                        originalFilename: file.name,
                        mimeType: file.type,
                        size: file.size
                    };

                    const metadataFileName = `${file.name}.json`;
                    metadataFolder.file(metadataFileName, JSON.stringify(metadata, null, 2));
                    const metadataHash = await this.calculateSHA256(new Blob([JSON.stringify(metadata)]));

                    // 3. Add to manifest
                    manifest.files.push({
                        filePath: `data/${file.name}`,
                        metadataPath: `metadata/${metadataFileName}`,
                        checksum: {
                            algorithm: "SHA-256",
                            value: fileHash
                        },
                        metadataChecksum: {
                            algorithm: "SHA-256",
                            value: metadataHash
                        },
                        size: file.size
                    });
                }

                // Add manifest to ZIP
                zip.file('manifesto-SIP.json', JSON.stringify(manifest, null, 2));

                // Generate and send/download ZIP
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                
                // Send to backend (or download)
                const formData = new FormData();
                formData.append('sip', zipBlob, 'submission.zip');
                const response = await fetch('http://localhost:3000/api/ingest', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to upload SIP');
                }

                this.successMessage = 'SIP created and uploaded successfully!';
                this.resetForm();

            } catch (error) {
                this.errorMessage = error.message;
                console.error('Error:', error);
            } finally {
                this.isUploading = false;
            }
        },
        async downloadSip() {
            this.successMessage = '';
            this.errorMessage = '';
            this.isUploading = true;

            try {
                // Validation (keep existing validation)

                const zip = new JSZip();
                const manifest = {
                    version: "1.0",
                    created: new Date().toISOString(),
                    producer: this.sipMetadata.producer,
                    submitter: this.sipMetadata.submitter,
                    files: []
                };

                // Create folders in ZIP
                const dataFolder = zip.folder('data');
                const metadataFolder = zip.folder('metadata');

                // Process each file
                for (const fileItem of this.fileItems) {
                    const file = fileItem.file;
                    
                    // 1. Add file to data folder
                    dataFolder.file(file.name, file);
                    const fileHash = await this.calculateSHA256(file);

                    // 2. Create metadata file
                    const metadata = {
                        title: fileItem.metadata.title,
                        resourceType: fileItem.metadata.resourceType,
                        creationDate: this.sipMetadata.creationDate,
                        submissionDate: new Date().toISOString(),
                        producer: this.sipMetadata.producer,
                        submitter: this.sipMetadata.submitter,
                        originalFilename: file.name,
                        mimeType: file.type,
                        size: file.size
                    };

                    const metadataFileName = `${file.name}.json`;
                    metadataFolder.file(metadataFileName, JSON.stringify(metadata, null, 2));
                    const metadataHash = await this.calculateSHA256(new Blob([JSON.stringify(metadata)]));

                    // 3. Add to manifest
                    manifest.files.push({
                        filePath: `data/${file.name}`,
                        metadataPath: `metadata/${metadataFileName}`,
                        checksum: {
                            algorithm: "SHA-256",
                            value: fileHash
                        },
                        metadataChecksum: {
                            algorithm: "SHA-256",
                            value: metadataHash
                        },
                        size: file.size
                    });
                }

                // Add manifest to ZIP
                zip.file('manifesto-SIP.json', JSON.stringify(manifest, null, 2));

                // Generate and send/download ZIP
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                
                saveAs(zipBlob, 'sip_inspection.zip');
                this.successMessage = 'SIP downloaded for inspection!';
                this.resetForm();

            } catch (error) {
                this.errorMessage = error.message;
                console.error('Error:', error);
            } finally {
                this.isUploading = false;
            }
        },

        async calculateSHA256(data) {
            const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        },

        resetForm() {
            this.sipMetadata = {
                producer: '',
                submitter: '',
                creationDate: new Date().toISOString().split('T')[0]
            };
            this.fileItems = [];
            this.addFileItem();
        }
    }
  };
  </script>
  
  <style scoped>
  .sip-uploader {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    border: 1px solid #ccc;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    font-family: sans-serif;
  }
  
  h2, h3 {
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 10px;
    margin-bottom: 20px;
  }
  
  .form-group {
    margin-bottom: 15px;
  }
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
    color: #555;
  }
  
  input[type="text"],
  textarea,
  select {
    width: calc(100% - 20px); /* Adjust for padding */
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box; /* Include padding in element's total width and height */
  }
  
  input[type="file"] {
    padding: 5px 0;
  }
  
  .file-item-section {
    border: 1px dashed #a0a0a0;
    padding: 15px;
    margin-bottom: 20px;
    border-radius: 5px;
    background-color: #f9f9f9;
  }
  
  .file-item-section h4 {
    margin-top: 0;
    color: #007bff;
  }
  
  .add-button, .submit-button, .remove-button {
    background-color: #007bff;
    color: white;
    padding: 10px 15px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 10px;
    margin-right: 10px;
    transition: background-color 0.3s ease;
  }
  
  .add-button:hover, .submit-button:hover {
    background-color: #0056b3;
  }
  
  .remove-button {
    background-color: #dc3545;
  }
  
  .remove-button:hover {
    background-color: #c82333;
  }
  
  .submit-button {
    display: block;
    width: 100%;
    margin-top: 30px;
    padding: 12px;
    font-size: 18px;
  }
  
  button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .success-message {
    color: green;
    background-color: #e6ffe6;
    border: 1px solid green;
    padding: 10px;
    margin-bottom: 15px;
    border-radius: 4px;
  }
  
  .error-message {
    color: red;
    background-color: #ffe6e6;
    border: 1px solid red;
    padding: 10px;
    margin-bottom: 15px;
    border-radius: 4px;
  }
  </style>