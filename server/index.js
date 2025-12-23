const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const http = require('http');
require('dotenv').config();

const db = require('./database');
const apiRoutes = require('./routes/api');
const { handleWebSocket } = require('./websocket');

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化数据库
db.init();

// API路由
app.use('/api', apiRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: '威软探针服务运行正常',
    version: '1.0.0'
  });
});

// 启动HTTP服务器
app.listen(PORT, () => {
  console.log('=================================');
  console.log('🚀 威软探针 - 控制端已启动');
  console.log('=================================');
  console.log(`📡 API服务: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${WS_PORT}`);
  console.log('=================================');
});

// 启动WebSocket服务器
const wss = new WebSocketServer({ port: WS_PORT });
console.log(`✅ WebSocket服务启动在端口 ${WS_PORT}`);

wss.on('connection', (ws, req) => {
  handleWebSocket(ws, req, wss);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n正在关闭服务...');
  wss.close(() => {
    console.log('WebSocket服务已关闭');
    process.exit(0);
  });
});
