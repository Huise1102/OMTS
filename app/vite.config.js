import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  // H5 开发端口固定为 5174，避免与本地其他服务占用冲突
  server: {
    port: 5174
  }
})