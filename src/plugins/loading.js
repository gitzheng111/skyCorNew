import { createVNode, render } from 'vue'
import GlobalLoading from '../components/GlobalLoading.vue'

let loadingInstance = null

export function createLoading() {
  if (loadingInstance) return loadingInstance

  const container = document.createElement('div')
  document.body.appendChild(container)

  const vnode = createVNode(GlobalLoading)
  render(vnode, container)

  loadingInstance = vnode.component.exposed
  return loadingInstance
}

export function useLoading() {
  return createLoading()
}

export default {
  install(app) {
    const loading = createLoading()
    app.config.globalProperties.$loading = loading
    app.provide('loading', loading)
  }
}
