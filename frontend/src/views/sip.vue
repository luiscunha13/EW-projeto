<template>
  <div class="sip-uploader">
    <h2>Create and Upload SIP</h2>

    <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
    <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

    <form @submit.prevent="handleSubmit">

      <div class="form-group">
        <label for="title">SIP Title:</label>
        <input type="text" id="title" v-model="sipMetadata.title" required />
      </div>

      <div class="form-group">
        <label for="description">SIP Description:</label>
        <textarea id="description" v-model="sipMetadata.description" rows="3"></textarea>
      </div>

      <div class="form-group">
        <label for="visibility">Visibility (public/private):</label>
        <div class="checkbox-container">
          <input type="checkbox" id="visibility" v-model="sipMetadata.isPublic" />
          <label for="visibility" class="checkbox-label">Make this SIP publicly visible</label>
        </div>
      </div>

      <div class="form-group">
        <label for="resourceType">Resource Type:</label>
        <select 
          id="resourceType" 
          v-model="sipMetadata.resourceType" 
          @change="resetOptionalFields"
          required
        >
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

      <!-- Global Optional Fields -->
      <div v-if="sipMetadata.resourceType" class="optional-fields">
        <!-- Desporto Fields -->
        <div v-if="sipMetadata.resourceType === 'desporto'">
          <div class="form-group">
            <label for="sport">Sport:</label>
            <input type="text" id="sport" v-model="sipMetadata.sport" />
          </div>
          <div class="form-group">
            <label for="activityTime">Activity Time (minutes):</label>
            <input type="number" id="activityTime" v-model="sipMetadata.activityTime" />
          </div>
          <div class="form-group">
            <label for="activityDistance">Activity Distance (km):</label>
            <input type="number" id="activityDistance" v-model="sipMetadata.activityDistance" step="0.1" />
          </div>
        </div>

        <!-- Académico Fields -->
        <div v-if="sipMetadata.resourceType === 'académico'">
          <div class="form-group">
            <label for="institution">Institution:</label>
            <input type="text" id="institution" v-model="sipMetadata.institution" />
          </div>
          <div class="form-group">
            <label for="course">Course:</label>
            <input type="text" id="course" v-model="sipMetadata.course" />
          </div>
          <div class="form-group">
            <label for="schoolYear">School Year:</label>
            <input type="number" id="schoolYear" v-model="sipMetadata.schoolYear" />
          </div>
        </div>

        <!-- Familiar Fields -->
        <div v-if="sipMetadata.resourceType === 'familiar'">
          <div class="form-group">
            <label for="familyMember">Family Members (comma separated):</label>
            <input type="text" id="familyMember" v-model="sipMetadata.familyMemberInput" 
                   @change="updateFamilyMembers" />
          </div>
        </div>

        <!-- Viagem Fields -->
        <div v-if="sipMetadata.resourceType === 'viagem'">
          <div class="form-group">
            <label for="places">Places (comma separated):</label>
            <input type="text" id="places" v-model="sipMetadata.placesInput" 
                   @change="updatePlaces" />
          </div>
        </div>

        <!-- Trabalho Fields -->
        <div v-if="sipMetadata.resourceType === 'trabalho'">
          <div class="form-group">
            <label for="company">Company:</label>
            <input type="text" id="company" v-model="sipMetadata.company" />
          </div>
          <div class="form-group">
            <label for="position">Position:</label>
            <input type="text" id="position" v-model="sipMetadata.position" />
          </div>
        </div>

        <!-- Pessoal Fields -->
        <div v-if="sipMetadata.resourceType === 'pessoal'">
          <div class="form-group">
            <label for="feeling">Feeling:</label>
            <input type="text" id="feeling" v-model="sipMetadata.feeling" />
          </div>
        </div>

        <!-- Entretenimento Fields -->
        <div v-if="sipMetadata.resourceType === 'entretenimento'">
          <div class="form-group">
            <label for="artist">Artist:</label>
            <input type="text" id="artist" v-model="sipMetadata.artist" />
          </div>
          <div class="form-group">
            <label for="genre">Genre:</label>
            <input type="text" id="genre" v-model="sipMetadata.genre" />
          </div>
          <div class="form-group">
            <label for="movie">Movie:</label>
            <input type="text" id="movie" v-model="sipMetadata.movie" />
          </div>
          <div class="form-group">
            <label for="festival">Festival:</label>
            <input type="text" id="festival" v-model="sipMetadata.festival" />
          </div>
        </div>
      </div>

      <h3>Add Resource Files</h3>
      <div v-for="(fileItem, index) in fileItems" :key="index" class="file-item-section">
        <h4>Resource {{ index + 1 }}</h4>
        <div class="form-group">
          <label :for="'file-' + index">Select File:</label>
          <input type="file" :id="'file-' + index" @change="handleIndividualFileChange($event, index)" required />
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
import axios from 'axios';
import { saveAs } from 'file-saver';

export default {
  data() {
      return {
          sipMetadata: {
              title: '',
              description: '',
              isPublic: false,
              submitter: 'fausto',
              creationDate: new Date().toISOString().split('T')[0],
              resourceType: '',
              // Optional fields will be added dynamically
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
      });
    },

    removeFileItem(index) {
      this.fileItems.splice(index, 1);
    },

    resetOptionalFields() {
      // Clear all optional fields when resource type changes
      const fieldsToClear = [
        'sport', 'activityTime', 'activityDistance',
        'institution', 'course', 'schoolYear',
        'familyMember', 'familyMemberInput',
        'places', 'placesInput',
        'company', 'position',
        'feeling',
        'artist', 'genre', 'movie', 'festival'
      ];
      
      fieldsToClear.forEach(field => {
        this.$delete(this.sipMetadata, field);
      });
    },

    updateFamilyMembers() {
      if (this.sipMetadata.familyMemberInput) {
        this.sipMetadata.familyMember = this.sipMetadata.familyMemberInput
          .split(',')
          .map(item => item.trim())
          .filter(item => item);
      } else {
        this.sipMetadata.familyMember = [];
      }
    },

    updatePlaces() {
      if (this.sipMetadata.placesInput) {
        this.sipMetadata.places = this.sipMetadata.placesInput
          .split(',')
          .map(item => item.trim())
          .filter(item => item);
      } else {
        this.sipMetadata.places = [];
      }
    },

    handleIndividualFileChange(event, index) {
      const selectedFile = event.target.files[0];
      if (selectedFile) {
          this.fileItems[index].file = selectedFile;
      }
    },

    async handleSubmit() {
          this.successMessage = '';
          this.errorMessage = '';
          this.isUploading = true;

          try {
              // Validation
              if (!this.sipMetadata.title) {
                  throw new Error('SIP title is required');
              }
              if (!this.sipMetadata.resourceType) {
                  throw new Error('Resource type is required');
              }
              if (this.fileItems.length === 0) {
                  throw new Error('At least one file is required');
              }
              for (const fileItem of this.fileItems) {
                  if (!fileItem.file) {
                      throw new Error('All files must be selected');
                  }
              }

              const zip = new JSZip();
              const manifest = {
                  version: "1.0",
                  created: new Date().toISOString(),
                  title: this.sipMetadata.title,
                  description: this.sipMetadata.description,
                  isPublic: this.sipMetadata.isPublic,
                  submitter: this.sipMetadata.submitter,
                  resourceType: this.sipMetadata.resourceType,
                  files: []
              };

              // Add optional fields to manifest based on resource type
              const optionalFields = this.getOptionalFieldsForResourceType(this.sipMetadata.resourceType);
              optionalFields.forEach(field => {
                  if (this.sipMetadata[field] !== undefined && this.sipMetadata[field] !== '') {
                      manifest[field] = this.sipMetadata[field];
                  }
              });

              // Create folders in ZIP
              const dataFolder = zip.folder('data');
              const metadataFolder = zip.folder('metadata');

              // Process each file
              for (const fileItem of this.fileItems) {
                  const file = fileItem.file;
                  
                  // 1. Add file to data folder
                  dataFolder.file(file.name, file);
                  const fileHash = await this.calculateSHA256(file);

                  // 2. Create metadata file (simpler now without resource type)
                  const metadata = {
                      creationDate: this.sipMetadata.creationDate,
                      submissionDate: new Date().toISOString(),
                      submitter: this.sipMetadata.submitter,
                      originalFilename: file.name,
                      mimeType: file.type,
                      size: file.size,
                      isPublic: this.sipMetadata.isPublic
                  };

                  const metadataContent = JSON.stringify(metadata, null, 2);
                  const metadataFileName = `${file.name}.json`;
                  metadataFolder.file(metadataFileName, metadataContent);
                  const metadataHash = await this.calculateSHA256(new Blob([metadataContent]));

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
              const response = await axios.post('http://localhost:14000/api/ingest', formData);

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

      getOptionalFieldsForResourceType(resourceType) {
          const fieldsMap = {
              desporto: ['sport', 'activityTime', 'activityDistance'],
              académico: ['institution', 'course', 'schoolYear'],
              familiar: ['familyMember'],
              viagem: ['places'],
              trabalho: ['company', 'position'],
              pessoal: ['feeling'],
              entretenimento: ['artist', 'genre', 'movie', 'festival']
          };

          return fieldsMap[resourceType] || [];
      },

      async downloadSip() {
          this.successMessage = '';
          this.errorMessage = '';
          this.isUploading = true;

          try {
              // Validation
              if (!this.sipMetadata.title) {
                  throw new Error('SIP title is required');
              }
              if (!this.sipMetadata.resourceType) {
                  throw new Error('Resource type is required');
              }
              if (this.fileItems.length === 0) {
                  throw new Error('At least one file is required');
              }
              for (const fileItem of this.fileItems) {
                  if (!fileItem.file) {
                      throw new Error('All files must be selected');
                  }
              }

              const zip = new JSZip();
              const manifest = {
                  version: "1.0",
                  created: new Date().toISOString(),
                  title: this.sipMetadata.title,
                  description: this.sipMetadata.description,
                  isPublic: this.sipMetadata.isPublic,
                  submitter: this.sipMetadata.submitter,
                  resourceType: this.sipMetadata.resourceType,
                  files: []
              };

              // Add optional fields to manifest based on resource type
              const optionalFields = this.getOptionalFieldsForResourceType(this.sipMetadata.resourceType);
              optionalFields.forEach(field => {
                  if (this.sipMetadata[field] !== undefined && this.sipMetadata[field] !== '') {
                      manifest[field] = this.sipMetadata[field];
                  }
              });

              // Create folders in ZIP
              const dataFolder = zip.folder('data');
              const metadataFolder = zip.folder('metadata');

              // Process each file
              for (const fileItem of this.fileItems) {
                  const file = fileItem.file;
                  
                  // 1. Add file to data folder
                  dataFolder.file(file.name, file);
                  const fileHash = await this.calculateSHA256(file);

                  // 2. Create metadata file (simpler now without resource type)
                  const metadata = {
                      creationDate: this.sipMetadata.creationDate,
                      submissionDate: new Date().toISOString(),
                      submitter: this.sipMetadata.submitter,
                      originalFilename: file.name,
                      mimeType: file.type,
                      size: file.size,
                      isPublic: this.sipMetadata.isPublic
                  };

                  const metadataContent = JSON.stringify(metadata, null, 2);
                  const metadataFileName = `${file.name}.json`;
                  metadataFolder.file(metadataFileName, metadataContent);
                  const metadataHash = await this.calculateSHA256(new Blob([metadataContent]));

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
              title: '',
              description: '',
              isPublic: false,
              submitter: 'fausto',
              creationDate: new Date().toISOString().split('T')[0],
              resourceType: ''
          };
          this.fileItems = [];
          this.addFileItem();
      }
  }
};
</script>

<style scoped>
/* Keep all existing styles the same */
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
input[type="number"],
textarea,
select {
  width: calc(100% - 20px); /* Adjust for padding */
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box; /* Include padding in element's total width and height */
}

textarea {
  resize: vertical;
  min-height: 80px;
}

input[type="file"] {
  padding: 5px 0;
}

.checkbox-container {
  display: flex;
  align-items: center;
}

input[type="checkbox"] {
  margin-right: 10px;
}

.checkbox-label {
  font-weight: normal;
  margin-bottom: 0;
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

.optional-fields {
  margin-top: 15px;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
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