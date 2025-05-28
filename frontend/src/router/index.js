import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth'; 
import LoginPage from '../views/Login.vue';
import SignupPage from '../views/SignUp.vue';
import UserHomePage from '../views/Home.vue';
import Sip from '../views/sip.vue'


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
      component: Sip,
    }, 
    
  ]
});

// Middleware para rotas protegidas
router.beforeEach((to, from, next) => {
    if (to.name === 'login' || to.name === 'signup') {
      next()
      return
    }
    
    const authStore = useAuthStore();
    
    if (to.meta.requiresAuth && !authStore.user) {
      next('/login');
    } else {
      next();
    }
});

export default router;