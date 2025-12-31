import { createApp } from 'vue'
import './style.css'
import { createPinia } from 'pinia'

import App from './App.vue'
import elementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import router from './router';
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { createStore } from 'vuex'
import { fetchAirportCode,fetchTaskList } from './api'
import loadingPlugin from './plugins/loading'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'

const pinia = createPinia()

const store = createStore({ /* 配置 */ })

const app = createApp(App)

app.use(pinia)
app.use(loadingPlugin)

app.use(router).use(elementPlus).use(store).mount('#app')
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}
app.use(ElementPlus, {
  locale: zhCn,
})
fetchAirportCode();
fetchTaskList()
// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//     app.component(key, component)
//   }