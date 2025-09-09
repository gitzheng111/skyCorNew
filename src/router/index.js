// router/index.js
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('/src/views/Home.vue')
  }
  ,
  {
    path: '/workFlow',
    name: 'WorkFlow',
    component: () => import('/src/components/workFlow.vue')
   
  },
  {
    path: '/handMadeOnly',
    name: 'handMadeOnly',
    component: () => import('/src/components/handMadeOnly.vue')
  },
  {
    path: '/permitManage',
    name: 'permitManage',
    component: () => import('/src/views/permitManage.vue')
  },
  {
    path: '/routeManage',
    name: 'routeManage',
    component: () => import('/src/views/routeManage.vue')
  },
  {
    path: '/taskList',
    name: 'taskList',
    component: () => import('/src/views/taskList.vue')
  },
  {
    path: '/countryList',
    name: 'countryList',
    component: () => import('/src/views/countryList.vue')
  },
  {
    path: '/overflyData',
    name: 'overflyData',
    component: () => import('/src/views/overflyData.vue')
   
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
