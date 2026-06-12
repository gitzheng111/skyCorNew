import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

import { createPinia } from 'pinia'
import { createStore } from 'vuex'
import router from './router'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import loadingPlugin from './plugins/loading'
import { fetchAirportCode, fetchTaskList } from './api'

const app = createApp(App)

const pinia = createPinia()
const store = createStore({})

app.use(pinia)
app.use(store)
app.use(router)

app.use(ElementPlus, {
  locale: zhCn
})

app.use(loadingPlugin)

// icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')

// API
fetchAirportCode()
fetchTaskList()