// 后端服务入口
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const errorHandler = require('./middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { time: new Date().toISOString() } });
});

// 挂载业务路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/movie', require('./routes/movie'));
app.use('/api/showtime', require('./routes/showtime'));
app.use('/api/order', require('./routes/order'));
app.use('/api/chat', require('./routes/chat'));

// 404 兜底
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null });
});

// 全局错误处理
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`后端服务已启动: http://localhost:${PORT}`);
});