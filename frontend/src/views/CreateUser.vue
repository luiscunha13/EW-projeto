<template>
  <div class="admin-page">
    <!-- Toast Notification -->
    <div v-if="toast.show" class="toast" :class="toast.type">
      {{ toast.message }}
      <button class="toast-close" @click="toast.show = false">×</button>
    </div>

    <!-- Header -->
    <header class="header">
      <div class="header-content">
        <div class="header-title">
          <Shield class="header-icon" />
          <h1>Create New User</h1>
        </div>
        <div class="header-stats">
          <button class="back-button" @click="goBack">
            ← Back to Users
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="main-content">
      <div class="form-container">
        <form @submit.prevent="handleSubmit" class="user-form">
          <!-- Username Field -->
          <div class="form-group" :class="{ 'error': errors.username }">
            <label for="username">Username*</label>
            <input
              id="username"
              v-model="form.username"
              type="text"
              placeholder="Enter username"
              @blur="validateField('username')"
            />
            <span class="error-message" v-if="errors.username">
              {{ errors.username }}
            </span>
          </div>

          <!-- Name Field -->
          <div class="form-group" :class="{ 'error': errors.name }">
            <label for="name">Full Name*</label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="Enter full name"
              @blur="validateField('name')"
            />
            <span class="error-message" v-if="errors.name">
              {{ errors.name }}
            </span>
          </div>

          <!-- Password Field -->
          <div class="form-group" :class="{ 'error': errors.password }">
            <label for="password">Password*</label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              placeholder="Enter password"
              @blur="validateField('password')"
            />
            <span class="error-message" v-if="errors.password">
              {{ errors.password }}
            </span>
          </div>

          <!-- Role Field -->
          <div class="form-group" :class="{ 'error': errors.role }">
            <label for="role">Role*</label>
            <select
              id="role"
              v-model="form.role"
              @blur="validateField('role')"
            >
              <option value="" disabled>Select a role</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <span class="error-message" v-if="errors.role">
              {{ errors.role }}
            </span>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="goBack">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="!isFormValid">
              Create User
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Shield } from 'lucide-vue-next'
import { useUsersStore } from '@/stores/users'

const router = useRouter()

// Form data
const form = reactive({
  username: '',
  name: '',
  password: '',
  role: ''
})

// Error messages
const errors = reactive({
  username: '',
  name: '',
  password: '',
  role: ''
})

// Toast notification
const toast = reactive({
  show: false,
  message: '',
  type: 'success' // 'success' or 'error'
})

// Show toast notification
const showToast = (message, type = 'success') => {
  toast.message = message
  toast.type = type
  toast.show = true
  
  // Auto-hide after 5 seconds
  setTimeout(() => {
    toast.show = false
  }, 5000)
}

// Validation rules
const validationRules = {
  username: (value) => {
    if (!value) return 'Username is required'
    return ''
  },
  name: (value) => {
    if (!value) return 'Name is required'
    return ''
  },
  password: (value) => {
    if (!value) return 'Password is required'
    return ''
  },
  role: (value) => {
    if (!value) return 'Role is required'
    if (!['user', 'admin'].includes(value)) return 'Role must be either "user" or "admin"'
    return ''
  }
}

// Validate a single field
const validateField = (field) => {
  errors[field] = validationRules[field](form[field])
}

// Validate all fields
const validateForm = () => {
  let isValid = true
  Object.keys(form).forEach(field => {
    errors[field] = validationRules[field](form[field])
    if (errors[field]) isValid = false
  })
  return isValid
}

// Check if form is valid
const isFormValid = computed(() => {
  return Object.values(errors).every(error => !error) && 
         Object.values(form).every(value => value !== '')
})

// Handle form submission
const handleSubmit = async () => {
  const isValid = validateForm()
  
  if (!isValid) {
    showToast('Please fix the form errors before submitting', 'error')
    return
  }

  try {
    const usersStore = useUsersStore()
    await usersStore.createUser({
      username: form.username,
      name: form.name,
      password: form.password,
      role: form.role
    })

    // Reset form
    Object.keys(form).forEach(key => {
      form[key] = ''
    })
    
    Object.keys(errors).forEach(key => {
      errors[key] = ''
    })

    // Show success message
    showToast('User created successfully!')

    // Redirect after a short delay to allow the toast to be seen
    setTimeout(() => {
      router.push('/admin/users')
    }, 1500)
  } catch (error) {
    console.error('Error creating user:', error)
    showToast('Failed to create user. Please try again.', 'error')
  }
}

const goBack = () => {
  router.push('/admin/users')
}
</script>

<style scoped>
/* Reuse existing admin page styles */
.admin-page {
  min-height: 100vh;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Toast notification styles */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 350px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideIn 0.3s ease-out;
}

.toast.success {
  background-color: #10b981;
}

.toast.error {
  background-color: #ef4444;
}

.toast-close {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  margin-left: 16px;
  padding: 0;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.header {
  border-bottom: 1px solid #e5e5e5;
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 600;
  color: #111111;
  margin: 0;
}

.header-icon {
  width: 32px;
  height: 32px;
  color: #111111;
}

.back-button {
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease, box-shadow 0.2s ease;
}

.back-button:hover {
  background-color: #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px;
}

/* Form styles */
.form-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.user-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #111111;
  box-shadow: 0 0 0 1px #111111;
}

.form-group.error input,
.form-group.error select {
  border-color: #dc2626;
}

.form-group.error input:focus,
.form-group.error select:focus {
  box-shadow: 0 0 0 1px #dc2626;
}

.error-message {
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.cancel-btn {
  padding: 12px 24px;
  background-color: #f3f4f6;
  border: none;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.cancel-btn:hover {
  background-color: #e5e7eb;
}

.submit-btn {
  padding: 12px 24px;
  background-color: #111111;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background-color: #333;
}

.submit-btn:disabled {
  background-color: #d1d5db;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .form-container {
    padding: 24px 16px;
  }
  
  .header-content {
    padding: 0 16px;
  }
  
  .main-content {
    padding: 24px 16px;
  }
  
  .toast {
    max-width: calc(100% - 40px);
    left: 20px;
    right: 20px;
  }
}
</style>