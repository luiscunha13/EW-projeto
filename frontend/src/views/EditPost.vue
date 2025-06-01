<template>
    <div class="sip-container">
      <div class="layout">
        <!-- Left Sidebar (same as CreatePost.vue) -->
        <div class="sidebar left-sidebar">
          <div class="logo" @click="navigateToHome">
            <img src="@/assets/logo.png" alt="Logo" class="logo" />
          </div>
          <div class="user-info">
            <div class="avatar">{{ userInitial }}</div>
            <div class="user-details">
              <h3>{{ currentUser.name }}</h3>
              <p>@{{ currentUser.username }}</p>
            </div>
          </div>
          <nav class="navigation">
            <button class="nav-item" @click="navigateToHome">
              <span>Home</span>
            </button>
            <button class="nav-item" @click="navigateToProfile">
              <span>Profile</span>
            </button>
            <button class="nav-item" @click="navigateToCreatePost">
              <span>Create Post</span>
            </button>
            <button class="nav-item active">
              <span>Edit Post</span>
            </button>
            <button class="nav-item" @click="handleLogout">
              <span>Logout</span>
            </button>
          </nav>
        </div>
  
        <!-- Main Content -->
        <main class="main-content">
          <div class="feed-header">
            <h2>Edit Post</h2>
          </div>
  
          <div class="sip-form-container">
            <div v-if="successMessage" class="alert success">{{ successMessage }}</div>
            <div v-if="errorMessage" class="alert error">{{ errorMessage }}</div>
  
            <div class="compose-sip">
              <div class="sip-content">
                <div class="form-group">
                  <input 
                    type="text" 
                    v-model="sipMetadata.title" 
                    placeholder="Title" 
                    class="sip-input"
                    required
                  />
                </div>
                
                <div class="form-group">
                  <textarea 
                    v-model="sipMetadata.description" 
                    placeholder="Description" 
                    rows="3"
                    class="sip-textarea"
                  ></textarea>
                </div>
  
                <div class="form-row">
                  <div class="form-group">
                    <label>Visibility</label>
                    <div class="checkbox-container">
                      <input type="checkbox" id="visibility" v-model="sipMetadata.isPublic" />
                      <label for="visibility" class="checkbox-label">Public</label>
                    </div>
                  </div>
  
                  <div class="form-group">
                    <label>Occurence Date</label>
                    <input 
                      type="date" 
                      v-model="sipMetadata.occurenceDate" 
                      class="sip-input"
                      required
                    />
                  </div>
  
                  <div class="form-group">
                    <label>Resource Type</label>
                    <select 
                      v-model="sipMetadata.resourceType" 
                      @change="resetOptionalFields"
                      class="sip-select"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="sport">Sport</option>
                      <option value="academic">Academic</option>
                      <option value="family">Family</option>
                      <option value="trip">Trip</option>
                      <option value="work">Work</option>
                      <option value="personal">Personal</option>
                      <option value="fun">Fun</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
  
                <!-- Dynamic fields based on resource type -->
                <div v-if="sipMetadata.resourceType !='other' && sipMetadata.resourceType !=''" class="optional-fields">
                  <!-- Sport Fields -->
                  <div v-if="sipMetadata.resourceType === 'sport'" class="resource-fields">
                    <h4>Sport Details</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.sport" placeholder="Sport" class="sip-input" />
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="number" v-model="sipMetadata.activityTime" placeholder="Time (minutes)" class="sip-input" />
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="number" v-model="sipMetadata.activityDistance" placeholder="Distance (km)" step="0.1" class="sip-input" />
                      </div>
                    </div>
                  </div>
                  <div v-if="sipMetadata.resourceType === 'academic'" class="resource-fields">
                    <h4>Academic Details</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.institution" placeholder="Institution" class="sip-input" />
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.course" placeholder="Course" class="sip-input" />
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.schoolYear" placeholder="School year" class="sip-input" />
                      </div>
                    </div>
                  </div>
                  <div v-if="sipMetadata.resourceType === 'family'" class="resource-fields">
                    <h4>Family Details</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.familyMember" placeholder="Family members (separated by ',')" class="sip-input" />
                      </div>
                    </div>
                  </div>
                  <div v-if="sipMetadata.resourceType === 'trip'" class="resource-fields">
                    <h4>Trip Details</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.places" placeholder="Places (separated by ',')" class="sip-input" />
                      </div>
                    </div>
                  </div>
                  <div v-if="sipMetadata.resourceType === 'work'" class="resource-fields">
                    <h4>Work Details</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.company" placeholder="Company" class="sip-input" />
                      </div>
                    </div>  
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.position" placeholder="Position" class="sip-input" />
                      </div>
                    </div>
                  </div>
                  <div v-if="sipMetadata.resourceType === 'personal'" class="resource-fields">
                    <h4>Personal Details</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.feeling" placeholder="Feeling" class="sip-input" />
                      </div>
                    </div>
                  </div>
                  <div v-if="sipMetadata.resourceType === 'fun'" class="resource-fields">
                    <h4>Event Details</h4>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.artist" placeholder="Artist" class="sip-input" />
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.genre" placeholder="Genre" class="sip-input" />
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.movie" placeholder="Movie" class="sip-input" />
                      </div>
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <input type="text" v-model="sipMetadata.festival" placeholder="Festival" class="sip-input" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- File uploads -->
                <div class="file-uploads">
                  <h3>Current Resources</h3>
                  <div v-for="(file, index) in existingFiles" :key="index" class="file-item">
                    <div class="file-input-container">
                      <span class="file-label">{{ file.filename }}</span>
                      <button 
                        type="button" 
                        @click="removeExistingFile(index)" 
                        class="remove-button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
  
                  <h3>Add New Resources</h3>
                  <div v-for="(fileItem, index) in fileItems" :key="index" class="file-item">
                    <div class="file-input-container">
                      <label :for="'file-' + index" class="file-label">
                        <span v-if="!fileItem.file">Select File {{ index + 1 }}</span>
                        <span v-else>{{ fileItem.file.name }}</span>
                      </label>
                      <input 
                        type="file" 
                        :id="'file-' + index" 
                        @change="handleIndividualFileChange($event, index)" 
                        class="file-input"
                      />
                      <button 
                        type="button" 
                        @click="removeFileItem(index)" 
                        class="remove-button"
                      >
                        ×
                      </button>
                    </div>
                  </div>
  
                  <button type="button" @click="addFileItem" class="add-file-button">
                    + Add Another File
                  </button>
                </div>
  
                <div class="sip-actions">
                  <button 
                    type="button" 
                    @click="handleSubmit" 
                    :disabled="isUploading" 
                    class="btn-primary"
                  >
                    {{ isUploading ? 'Updating...' : 'Update Post' }}
                  </button>
                  <button 
                    type="button" 
                    @click="navigateToProfile" 
                    class="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
  
        <div class="sidebar right-sidebar">
          <div class="sidebar-header">
            <h3>Users</h3>
          </div>
          <div class="users-list">
            <div 
              v-for="user in users" 
              :key="user.id" 
              class="user-item"
              @click="navigateToUserProfile(user.username)"
            >
              <div class="user-avatar">
                <div class="avatar small">{{ getInitial(user.name) }}</div>
              </div>
              <div class="user-details">
                <div class="user-name">{{ user.name }}</div>
                <div class="user-username">@{{ user.username }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import JSZip from 'jszip'; 
  import axios from 'axios';
  import { saveAs } from 'file-saver';
  import { computed, ref, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useAuthStore } from '../stores/auth';
  import { usePublicationsStore } from '../stores/pubs';
  import { useUsersStore } from '../stores/users';

  export default {
    setup() {
      const router = useRouter();
      const route = useRoute();
      const authStore = useAuthStore();
      const usersStore = useUsersStore();
      const publicationsStore = usePublicationsStore();
      
      const currentUser = authStore.user;
      const users = ref([]);
  
      const userInitial = computed(() => {
        return currentUser.name.charAt(0);
      });
  
      const getInitial = (name) => {
        return name.charAt(0);
      };
  
      const navigateToHome = () => {
        router.push('/home');
      };
  
      const navigateToProfile = () => {
        router.push(`/profile/${currentUser.username}`);
      };
  
      const navigateToCreatePost = () => {
        router.push('/createpost');
      };
  
      const navigateToUserProfile = (username) => { 
        router.push(`/profile/${username}`);
      };
  
      const handleLogout = () => {
        authStore.logout();
        router.push('/login');
      };
  
      onMounted(async () => {
        try {
          await usersStore.getUsers();
          users.value = usersStore.users_list;
        } catch (error) {
          console.error('Error loading users:', error);
        }
      });
  
      return {
        currentUser,
        userInitial,
        getInitial,
        navigateToHome,
        navigateToProfile,
        navigateToCreatePost,
        navigateToUserProfile,
        handleLogout,
        users,
        route,
        publicationsStore
      };
    },
    data() {
      const authStore = useAuthStore();
      return {
        sipMetadata: {
          title: '',
          description: '',
          isPublic: false,
          submitter: authStore.user.username,
          creationDate: new Date().toISOString().split('T')[0],
          occurenceDate: '',
          resourceType: '',
        },
        existingFiles: [],
        fileItems: [],
        successMessage: '',
        errorMessage: '',
        isUploading: false,
        postId: null
      };
    },
    async created() {
      this.postId = this.route.params.id;
      await this.loadPostData();
      this.addFileItem();
    },
    methods: {
      async loadPostData() {
        try {
          const post = await this.publicationsStore.getPublicationById(this.postId);
          
          if (!post) {
            throw new Error('Post not found');
          }
  
          // Map post data to sipMetadata structure
          this.sipMetadata = {
            title: post.title,
            description: post.description,
            isPublic: post.visibility,
            submitter: post.user,
            creationDate: post.createdAt,
            occurenceDate: this.formatDateForInput(post.occurrenceDate),
            resourceType: post.resourceType,
            ...post.metadata // Spread any additional metadata fields
          };
  
          // Store existing files
          this.existingFiles = post.files || [];
          
        } catch (error) {
          this.errorMessage = error.message || 'Failed to load post data';
          console.error('Error loading post:', error);
        }
      },
      formatDateForInput(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        },
      addFileItem() {
        this.fileItems.push({
          file: null,
        });
      },
      removeFileItem(index) {
        this.fileItems.splice(index, 1);
      },
      removeExistingFile(index) {
        this.existingFiles.splice(index, 1);
      },
      resetOptionalFields() {
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
          delete this.sipMetadata[field];
        });
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
          if (!this.sipMetadata.title) throw new Error('Post title is required');
          
          const zip = new JSZip();
          const manifest = {
            version: "1.0",
            created: new Date().toISOString(),
            occurenceDate: this.sipMetadata.occurenceDate,
            title: this.sipMetadata.title,
            description: this.sipMetadata.description,
            visibility: this.sipMetadata.isPublic,
            submitter: this.sipMetadata.submitter,
            resourceType: this.sipMetadata.resourceType,
            files: []
          };
  
          // Include any optional fields based on resource type
          const optionalFields = this.getOptionalFieldsForResourceType(this.sipMetadata.resourceType);
          optionalFields.forEach(field => {
            if (this.sipMetadata[field] !== undefined && this.sipMetadata[field] !== '') {
              manifest[field] = this.sipMetadata[field];
            }
          });
  
          const dataFolder = zip.folder('data');
          const metadataFolder = zip.folder('metadata');
  
          // Process existing files that haven't been removed
          for (const file of this.existingFiles) {
            try {
              const response = await fetch(file.fileUrl);
              const blob = await response.blob();
              dataFolder.file(file.filename, blob);
              
              const fileHash = await this.calculateSHA256(blob);
              const metadata = {
                creationDate: this.sipMetadata.creationDate,
                submissionDate: new Date().toISOString(),
                submitter: this.sipMetadata.submitter,
                originalFilename: file.filename,
                mimeType: file.mimeType,
                size: file.size
              };
  
              const metadataContent = JSON.stringify(metadata, null, 2);
              const metadataFileName = `${file.filename}.json`;
              metadataFolder.file(metadataFileName, metadataContent);
              const metadataHash = await this.calculateSHA256(new Blob([metadataContent]));
  
              manifest.files.push({
                filePath: `data/${file.filename}`,
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
            } catch (error) {
              console.error('Error processing existing file:', error);
            }
          }
  
          // Process new files
          for (const fileItem of this.fileItems) {
            if (fileItem.file) {
              const file = fileItem.file;
              dataFolder.file(file.name, file);
              
              const fileHash = await this.calculateSHA256(file);
              const metadata = {
                creationDate: this.sipMetadata.creationDate,
                submissionDate: new Date().toISOString(),
                submitter: this.sipMetadata.submitter,
                originalFilename: file.name,
                mimeType: file.type,
                size: file.size
              };
  
              const metadataContent = JSON.stringify(metadata, null, 2);
              const metadataFileName = `${file.name}.json`;
              metadataFolder.file(metadataFileName, metadataContent);
              const metadataHash = await this.calculateSHA256(new Blob([metadataContent]));
  
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
          }
  
          zip.file('manifesto-SIP.json', JSON.stringify(manifest, null, 2));
          const zipBlob = await zip.generateAsync({ type: 'blob' });
                
          const formData = new FormData();
          formData.append('sip', zipBlob, 'submission.zip');
          formData.append('postId', this.postId);
          const authStore = useAuthStore();
          const response = await axios.put(
                `http://localhost:14000/api/publications/${this.postId}`, 
                formData, 
                {
                    headers: {
                        Authorization: `Bearer ${authStore.token}`
                    }
                }
            );
  
          if (!response.data.success) {
            throw new Error(response.error || 'Failed to update post');
          }
  
          this.successMessage = 'Post updated successfully!';
          setTimeout(() => {
            this.navigateToProfile();
          }, 1500);
  
        } catch (error) {
          this.errorMessage = error.message || 'Failed to update post';
          console.error('Error:', error);
        } finally {
          this.isUploading = false;
        }
      },
      getOptionalFieldsForResourceType(resourceType) {
        const fieldsMap = {
          sport: ['sport', 'activityTime', 'activityDistance'],
          academic: ['institution', 'course', 'schoolYear'],
          family: ['familyMember'],
          trip: ['places'],
          work: ['company', 'position'],
          personal: ['feeling'],
          fun: ['artist', 'genre', 'movie', 'festival']
        };
        return fieldsMap[resourceType] || [];
      },
      async calculateSHA256(data) {
        const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      }
    }
  };
  </script>
  
  <style scoped>
  /* Reuse all styles from CreatePost.vue */
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
  
  .sip-container {
    min-height: 100vh;
    background-color: #f8f8f8;
    font-family: 'Inter', sans-serif;
  }
  
  .layout {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    max-width: 1400px;
    margin: 0 auto;
    min-height: 100vh;
  }
  
  /* Sidebar styles (same as Home.vue) */
  .sidebar {
    padding: 20px;
    height: 100vh;
    position: sticky;
    top: 0;
    overflow-y: auto;
  }
  
  .left-sidebar {
    border-right: 1px solid #eaeaea;
    background-color: white;
  }
  
  .logo:hover {
    cursor: pointer;
  }
  
  .logo {
    display: block;
    margin: 0 auto 20px;
    width: 200px;
    height: auto;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 20px;
    transition: background-color 0.2s;
    cursor: pointer;
  }
  
  .user-info:hover {
    background-color: #f5f5f5;
  }
  
  .user-details {
    margin-left: 12px;
  }
  
  .user-details h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  .user-details p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
  
  .navigation {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .nav-item {
    display: flex;
    align-items: center;
    padding: 16px;
    border-radius: 12px;
    font-size: 20px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    background: none;
    transition: background-color 0.2s;
    text-align: left;
  }
  
  .nav-item:hover {
    background-color: #f5f5f5;
  }
  
  .nav-item.active {
    font-weight: 600;
  }
  
  /* Main content styles */
  .main-content {
    border-left: 1px solid #eaeaea;
    border-right: 1px solid #eaeaea;
    background-color: white;
    min-height: 100vh;
  }
  
  .feed-header {
    padding: 16px 20px;
    border-bottom: 1px solid #eaeaea;
    position: sticky;
    top: 0;
    background-color: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(5px);
    z-index: 10;
  }
  
  .feed-header h2 {
    font-size: 25px;
    font-weight: 600;
    margin: 0;
  }
  
  /* SIP Form styles */
  .sip-form-container {
    padding: 20px;
  }
  
  .compose-sip {
    display: flex;
    gap: 16px;
    padding: 16px 0;
  }
  
  .sip-content {
    flex: 1;
  }
  
  .sip-input, .sip-textarea, .sip-select {
    width: 95%;
    padding: 12px;
    border: 1px solid #eaeaea;
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    margin-bottom: 12px;
    transition: border-color 0.2s;
  }
  
  .sip-input:focus, .sip-textarea:focus, .sip-select:focus {
    outline: none;
    border-color: #1d9bf0;
  }
  
  .sip-textarea {
    resize: vertical;
    min-height: 100px;
  }
  
  .form-row {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }
  
  .form-row .form-group {
    flex: 1;
  }
  
  .checkbox-container {
    display: flex;
    align-items: center;
    margin-top: 8px;
  }
  
  .checkbox-label {
    margin-left: 10px;
    font-weight: 500;
  }
  
  /* File upload styles */
  .file-uploads {
    margin-top: 24px;
    border-top: 1px solid #eaeaea;
    padding-top: 16px;
  }
  
  .file-item {
    margin-bottom: 12px;
  }
  
  .file-input-container {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .file-label {
    flex: 1;
    padding: 12px;
    border: 1px dashed #ccc;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .file-label:hover {
    background-color: #f5f5f5;
  }
  
  .file-input {
    display: none;
  }
  
  .remove-button {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background-color: #f5f5f5;
    color: #666;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background-color 0.2s;
  }
  
  .remove-button:hover {
    background-color: #eaeaea;
  }
  
  .add-file-button {
    width: 100%;
    padding: 12px;
    background-color: transparent;
    border: 1px dashed #ccc;
    border-radius: 12px;
    color: #1d9bf0;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .add-file-button:hover {
    background-color: #f5f5f5;
  }
  
  /* Button styles */
  .sip-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #eaeaea;
  }
  
  .btn-primary {
    padding: 12px 24px;
    background-color: #111;
    color: white;
    border: none;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .btn-primary:hover {
    background-color: #000;
  }
  
  .btn-primary:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .btn-secondary {
    padding: 12px 24px;
    background-color: transparent;
    color: #111;
    border: 1px solid #eaeaea;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .btn-secondary:hover {
    background-color: #f5f5f5;
  }
  
  .btn-secondary:disabled {
    color: #ccc;
    border-color: #eee;
    cursor: not-allowed;
  }
  
  /* Alert styles */
  .alert {
    width: 95%;
    padding: 16px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-weight: 500;
  }
  
  .success {
    background-color: #e6ffe6;
    color: #00a000;
    border: 1px solid #00a000;
  }
  
  .error {
    background-color: #ffe6e6;
    color: #e0245e;
    border: 1px solid #e0245e;
  }
  
  /* Optional fields styles */
  .optional-fields {
    margin-top: 16px;
    padding: 16px;
    background-color: #f9f9f9;
    border-radius: 12px;
  }
  
  .resource-fields h4 {
    margin-top: 0;
    margin-bottom: 16px;
    color: #555;
  }
  
  .right-sidebar {
    border-left: 1px solid #eaeaea;
    background-color: white;
  }
  
  .sidebar-header {
    padding: 16px 0;
    border-bottom: 1px solid #eaeaea;
  }
  
  .sidebar-header h3 {
    font-size: 25px;
    font-weight: 600;
    margin: 0;
  }
  
  .users-list {
    margin-top: 16px;
  }
  
  .user-item {
    display: flex;
    padding: 12px 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .user-item:hover {
    background-color: #f5f5f5;
  }
  
  .user-avatar {
    margin-right: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .user-name {
    font-weight: 600;
    font-size: 16px;
  }
  
  .user-username {
    color: #666;
    font-size: 15px;
  }
  
  .avatar.small {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  
  /* Avatar Styles */
  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #111;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 18px;
  }
  
  /* Responsive styles */
  @media (max-width: 768px) {
    .layout {
      grid-template-columns: 1fr;
    }
    .left-sidebar {
      display: none;
    }
  }
  </style>