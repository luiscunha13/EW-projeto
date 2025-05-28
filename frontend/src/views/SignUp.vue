<template>
  <div class="signup-container">
    <div class="card">
      <h2>EuBit</h2>
      <form @submit.prevent="handleSignup">
        <div class="input-group">
          <input v-model="username" type="text" placeholder="Username" required>
        </div>
        <div class="input-group">
          <input v-model="email" type="email" placeholder="Email" required>
        </div>
        <div class="input-group">
          <input v-model="password" type="password" placeholder="Password" required>
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
const email = ref('');
const password = ref('');
const router = useRouter();
const authStore = useAuthStore();

const handleSignup = async () => {
  try {
    await authStore.signup(username.value, email.value, password.value);
    router.push('/login');
  } catch (error) {
    console.error('Registration error:', error);
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

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