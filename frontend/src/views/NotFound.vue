<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <button class="home-button" @click="navigateToHome">
        Return to Home
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const navigateToHome = () => {
  router.push('/home');
};
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f8f8f8;
  font-family: 'Inter', sans-serif;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.not-found-content h1 {
  font-size: 72px;
  font-weight: 700;
  color: #111;
  margin: 0 0 16px 0;
}

.not-found-content h2 {
  font-size: 24px;
  font-weight: 600;
  color: #111;
  margin: 0 0 16px 0;
}

.not-found-content p {
  font-size: 16px;
  color: #666;
  margin: 0 0 32px 0;
  line-height: 1.5;
}

.home-button {
  padding: 12px 24px;
  border-radius: 8px;
  background-color: #111;
  color: white;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.home-button:hover {
  background-color: #333;
}
</style>