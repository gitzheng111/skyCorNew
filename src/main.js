import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import elementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createStore } from 'vuex'
import { fetchAirportCode,fetchTaskList } from './api'

const store = createStore({ /* 配置 */ })

const app = createApp(App)
app.use(router).use(elementPlus).use(store).mount('#app')
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
fetchAirportCode();
fetchTaskList()
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//     app.component(key, component)
//   }