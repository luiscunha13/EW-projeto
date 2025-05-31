import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth'; 
import LoginPage from '../views/Login.vue';
import SignupPage from '../views/SignUp.vue';
import UserHomePage from '../views/Home.vue';
import CreatePost from '../views/CreatePost.vue'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      redirect: '/login' 
    },
    { 
      path: '/login', 
      name: 'login',
      component: LoginPage 
    },
    { path: '/signup', 
      name: 'signup',
      component: SignupPage
    },
    { path: '/home', 
      name: 'userhomepage', 
      component: UserHomePage,
      meta: { requiresAuth: true } // Rota que requer autenticação
    }, 
    {
      path: '/createpost',
      name: 'createpost',
      component: CreatePost,
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: () => import('@/views/AuthCallback.vue'),
    }
    
  ]
});

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Se a rota não precisa de autenticação, deixa passar
  // Se precisa de admin, verifica permissões
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    const isAdmin = await authStore.verifyTokenAdmin(authStore.token)
    if (!isAdmin) {
      next('/home')
      return
    }
  }
  else if (!to.matched.some(record => record.meta.requiresAuth)) {
    next()
    return
  }
  
  // Verifica se tem token
  if (!authStore.token) {
    next('/login')
    return
  }
  
  // Valida o token no servidor
  const isTokenValid = await authStore.verifyToken(authStore.token)
  if (!isTokenValid) {
    authStore.logout()
    next('/login')
    return
  }
  console.log('Token válido, prosseguindo...')
  next() // Permite navegação
})

export default router;