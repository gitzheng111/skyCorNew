// store/modules/seasonData.js
export default {
  namespaced: true,
  
  state: () => ({
    seasonStorage: {},
    currentSeasonId: ''
  }),

  mutations: {
    TEST_MUTATION(state) {
      console.log('测试 mutation 执行成功')
    },
    INIT_SEASON_STORAGE(state, { seasonKey, workType }) {
      const storageKey = `${seasonKey}_${workType}`
      if (!state.seasonStorage[storageKey]) {
        state.seasonStorage[storageKey] = {
          data: [],
          lastModified: new Date().toISOString()
        }
      }
      state.currentSeasonId = storageKey
    },

    UPDATE_SEASON_DATA(state, { id, newData }) {
      const storage = state.seasonStorage[state.currentSeasonId]
      const index = storage.data.findIndex(item => item.id === id)
      
      if (index !== -1) {
        storage.data[index] = { 
          ...storage.data[index], 
          ...newData,
          lastModified: new Date().toISOString()
        }
      } else {
        storage.data.push({
          id,
          ...newData,
          createTime: new Date().toISOString()
        })
      }
    }
  },

  actions: {
    SYNC_FROM_LOCALSTORAGE({ commit, state }) {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key)) || []
            commit('INIT_SEASON_STORAGE', {
              seasonKey: key.split('_')[0],
              workType: key.split('_')[1]
            })
            data.forEach(item => {
              commit('UPDATE_SEASON_DATA', {
                id: item.id,
                newData: item
              })
            })
          } catch (e) {
            console.error(`Failed to parse ${key}`, e)
          }
        }
      })
    },
    testAction({ commit }) {
      console.log('测试 action 执行成功')
      commit('TEST_MUTATION')
    },
    persistData({ state }) {
      Object.entries(state.seasonStorage).forEach(([key, value]) => {
        localStorage.setItem(key, JSON.stringify(value.data))
      })
    }
  },

  getters: {
    getCurrentSeasonData: (state) => {
      return state.seasonStorage[state.currentSeasonId]?.data || []
    }
  }
}
