// 全局配置
// 后端服务地址：
// - H5 本地调试直接访问 localhost
// - 微信小程序在开发者工具勾选「不校验合法域名」后同样可用 localhost
// - 微信真机预览需改为电脑的局域网 IP（如 http://192.168.1.100:3000/api）
// - 生产环境统一替换为 HTTPS 域名

// #ifdef H5
export const BASE_URL = 'http://localhost:3000/api'
// #endif

// #ifdef MP-WEIXIN
export const BASE_URL = 'http://localhost:3000/api' // 真机调试请改为局域网 IP
// #endif