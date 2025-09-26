import { defineStore } from 'pinia'

export const useOverflyStore = defineStore('overfly', {
    state: () => ({
      needRefresh: false,   // boolean
    }),
    actions: {
      setNeedRefresh(val) {
        this.needRefresh = val
      }
    }
  })