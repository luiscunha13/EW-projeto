<template>
  <div style="display: none;"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    const error = urlParams.get('error')
    
    if (error) {
      router.push('/login')
      return
    }
    
    if (!token) {
      router.push('/login')
      return
    }
    
    // Processar token do Google rapidamente
    const result = await authStore.processGoogleAuth(token)
    
    if (result.success) {
      // Redirecionar imediatamente para /home
      router.push('/home')
    } else {
      router.push('/login')
    }
    
  } catch (error) {
    console.error('Callback processing error:', error)
    router.push('/login')
  }
})
</script>