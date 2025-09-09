// store/index.js
import { createStore } from 'vuex'
import seasonData from './modules/seasonData'

// 初始状态从 localStorage 加载
const loadPersistedState = () => {
    try {
        const stored = localStorage.getItem('overflyData')
        return stored ? JSON.parse(stored) : undefined
    } catch (e) {
        console.error('存储加载失败', e)
        return undefined
    }
}

export default createStore({
    modules: {
        seasonData  // 必须注册模块:ml-citation{ref="6,7" data="citationList"}
    },
    // 优先加载持久化数据
    state: loadPersistedState() || {
        workspace: {
            flights: [],
            routes: [],
            sheets: []
        },
        meta: { version: '1.0.0' }
    },

    mutations: {
        // 全量覆盖存储
        OVERRIDE_STORAGE(state, payload) {
            state.workspace = { ...payload }
            this.commit('PERSIST_TO_STORAGE')
        },

        // 增量更新
        UPDATE_SHEETS(state, sheets) {
            state.workspace.sheets = [...sheets]
            this.commit('PERSIST_TO_STORAGE')
        },

        // 持久化方法
        PERSIST_TO_STORAGE(state) {
            localStorage.setItem('app-storage', JSON.stringify(state))
        }
    },

    actions: {
        // 异步覆盖示例
        async fetchAndOverride({ commit }, url) {
            const res = await fetch(url)
            commit('OVERRIDE_STORAGE', await res.json())
        }
    }
})
