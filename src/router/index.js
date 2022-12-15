import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'home',
        component: () => import('@/views/HomeView.vue')
    },
    {
        path: '/ChatView/:roomName/:userId',
        name: 'chat',
        component: () => import('@/views/ChatView.vue')
    }
]

const router = new VueRouter({
    routes
})

export default router
