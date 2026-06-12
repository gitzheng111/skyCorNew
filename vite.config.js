import { defineConfig } from 'vite'

import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
     alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
    dedupe: ['vue'] // 解决多实例冲突问题‌:ml-citation{ref="1,7" data="citationList"}
  }
})
