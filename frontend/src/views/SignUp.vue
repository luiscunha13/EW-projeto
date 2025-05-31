<template>
  <div class="signup-container">
    <div class="card">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
      <form @submit.prevent="handleSignup">
        <div class="input-group">
          <input v-model="username" type="text" placeholder="Username" required>
        </div>
        <div class="input-group">
          <input v-model="name" type="name" placeholder="Name" required>
        </div>
        <div class="input-group">
          <input v-model="password" type="password" placeholder="Password" required>
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" class="btn-primary">Sign Up</button>
      </form>

      <p class="text-center">Already have an account? <router-link to="/login" class="link">Log in</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const username = ref('');
const name = ref('');
const password = ref('');
const errorMessage = ref('');
const authStore = useAuthStore();
const router = useRouter();

const handleSignup = async () => {
  errorMessage.value = '';
  try {
    const result = await authStore.register(username.value, name.value, password.value);

    if (!result.success) {
      errorMessage.value = result.error;
      console.error('Signup failed:', result.err);
    }
    else{
      router.push('/login');
    }
  } catch (error) {
    errorMessage.value = error.message || 'An unexpected error occurred. Please try again.';
    console.error('Signup error:', error);
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

.logo {
  display: block;
  margin: 0 auto 20px;
  width: 220px;
  height: auto;
}

.signup-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f8f8;
  padding: 20px;
  font-family: 'Inter', sans-serif;
}

.card {
  background: white;
  padding: 50px;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 400px;
}

h2 {
  color: #111;
  text-align: center;
  margin-bottom: 40px;
  font-size: 35px;
  font-weight: 600;
  letter-spacing: -0.5px;
}

.input-group {
  margin-bottom: 24px;
}

input {
  width: 100%;
  height: 50px;
  padding: 16px 20px;
  border: 2px solid #eaeaea;
  border-radius: 12px;
  font-size: 15px;
  transition: all 0.3s;
  height: 50px;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #111;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
}

.error-message {
  color: #dc3545;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  text-align: center;
  animation: fadeIn 0.3s ease-in-out;
}

.btn-primary {
  width: 100%;
  padding: 18px;
  background-color: #111;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: #000;
}

.text-center {
  text-align: center;
  color: #666;
  margin-top: 24px;
  font-size: 15px;
}

.link {
  color: #111;
  font-weight: 600;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}
</style>