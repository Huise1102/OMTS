import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

// uni-app Vue3 入口：使用 createSSRApp 以兼容 SSR / 多端渲染
export function createApp() {
  const app = createSSRApp(App)
  app.use(createPinia())
  return { app }
}