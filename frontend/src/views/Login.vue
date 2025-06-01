<template>
  <div class="login-container">
    <div class="card">
      <img src="@/assets/logo.png" alt="Logo" class="logo" />
      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <input v-model="username" type="username" placeholder="Username" required>
        </div>
        <div class="input-group">
          <input v-model="password" type="password" placeholder="Password" required>
        </div>
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        <button type="submit" class="btn-primary">Log In</button>
      </form>

      <div class="divider">
        <span>or</span>
      </div>

      <button @click="loginWithGoogle" class="btn-social google">
        <svg-icon type="google" /> Continue with Google
      </button>

      <p class="text-center">Don't have an account? <router-link to="/signup" class="link">Sign up</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const username = ref('');
const password = ref('');
const errorMessage = ref('');
const router = useRouter();
const authStore = useAuthStore();

authStore.initialize(router);

const handleLogin = async () => {
  errorMessage.value = '';
  if (username.value === '1@1' && password.value === '1') {
    console.log('Bypassing login with test credentials');
    router.push('/home');
    return;
  }
  try {
    const result = await authStore.login(username.value, password.value);

    if (!result.success) {
      errorMessage.value = result.error;
      console.error('Login failed:', result.error);
    }
    else if (authStore.user.role === 'admin') {
      router.push('/admin');
    }
    else{
      router.push('/home');
    }
  } catch (error) {
    errorMessage.value = error.message || 'An unexpected error occurred. Please try again.';
    console.error('Login error:', error);
  }
};

const loginWithGoogle = () => {
  authStore.loginWithGoogle();
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

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f8f8;
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

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
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

.btn-social {
  width: 100%;
  height: 50px;
  padding: 16px;
  border: 2px solid #eaeaea;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
  transition: all 0.3s;
  background: white;
}

.btn-social:hover {
  background-color: #f5f5f5;
}

.btn-social.google {
  color: #db4437;
}

.divider {
  display: flex;
  align-items: center;
  margin: 30px 0;
  color: #999;
  font-size: 15px;
}

.divider::before, .divider::after {
  content: "";
  flex: 1;
  border-bottom: 1px solid #eaeaea;
}

.divider::before {
  margin-right: 16px;
}

.divider::after {
  margin-left: 16px;
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