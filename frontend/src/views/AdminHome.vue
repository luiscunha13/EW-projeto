<template>
    <main class="admin-home">
        <h1>Admin Home</h1>
        <p>Welcome to the admin dashboard!</p>
        <router-link to="/admin/users">Users List</router-link>
        <router-link to="/admin/settings">User Logs</router-link>
    </main>

</template>

<style scoped>

.admin-home {
    padding: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}

</style>

<script>
import { Button } from '@/components/ui/button'
</script>