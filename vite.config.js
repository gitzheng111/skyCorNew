import { defineConfig } from 'vite'

import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ['vue'] // 解决多实例冲突问题‌:ml-citation{ref="1,7" data="citationList"}
  }
})
