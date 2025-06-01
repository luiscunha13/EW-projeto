import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth'; 
import LoginPage from '../views/Login.vue';
import SignupPage from '../views/SignUp.vue';
import UserHomePage from '../views/Home.vue';
import CreatePost from '../views/CreatePost.vue'
import AuthCallback from '../views/AuthCallback.vue';
import AdminHome from '../views/AdminHome.vue';
import UserManagement from '../views/UserManagement.vue';
import Logs from '../views/Logs.vue';
import testPub from '@/views/testPub.vue';
import Profile from '../views/Profile.vue';
import NotFound from '../views/NotFound.vue'
import EditPost from '@/views/EditPost.vue';
import CreateUser from '@/views/CreateUser.vue';

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
      meta: { requiresAuth: true } // Rota que requer autenticação
    },
    {
      path: '/auth/callback',
      name: 'AuthCallback',
      component: AuthCallback,
    },
    {
      path: '/testpub',
      name: 'testPub',
      component: testPub,
      meta: { requiresAuth: true } // Rota que requer autenticação
    },
    {
      path: '/profile/:username',
      name: 'profile',
      component: Profile,
      meta: { requiresAuth: true } // Rota que requer autenticação
    },
    {
      path: '/editpost/:id',
      name: 'editpost',
      component: EditPost,
      meta: { requiresAuth: true } // Rota que requer autenticação
    },
    // Exclusivo admin
    {
      path: '/admin',
      name: 'admin',
      component: AdminHome,
      meta: { requiresAdmin: true } // Rota que requer autenticação de admin
    },
    {
      path: '/admin/users',
      name: 'users',
      component: UserManagement,
      meta: { requiresAdmin: true } // Rota que requer autenticação de admin
    },
    {
      path: '/admin/logs',
      name: 'logs',
      component: Logs,
      meta: { requiresAdmin: true } // Rota que requer autenticação de admin
    },
    {
      path: '/admin/users/new',
      name: 'createuser',
      component: CreateUser,
      meta: { requiresAdmin: true } // Rota que requer autenticação de admin
    },

    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound,
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