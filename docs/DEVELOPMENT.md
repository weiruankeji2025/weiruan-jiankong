# 威软探针 - 开发文档

## 📁 项目结构

```
weiruan-jiankong/
├── server/                 # 控制端后端
│   ├── index.js           # 入口文件
│   ├── database.js        # 数据库操作
│   ├── websocket.js       # WebSocket处理
│   ├── routes/            # API路由
│   │   └── api.js
│   ├── package.json
│   └── .env              # 环境配置
│
├── agent/                 # 被控端Agent
│   ├── index.js          # Agent主程序
│   ├── config.json       # Agent配置
│   └── package.json
│
├── dashboard/            # 前端监控面板
│   ├── public/
│   ├── src/
│   │   ├── App.js        # 主应用
│   │   ├── themes.js     # 主题配置
│   │   ├── components/   # React组件
│   │   │   ├── Dashboard.js
│   │   │   ├── ServerCard.js
│   │   │   ├── ThemeSelector.js
│   │   │   └── AddServerModal.js
│   │   └── index.js
│   └── package.json
│
├── scripts/              # 部署脚本
│   ├── install-server.sh
│   └── install-agent.sh
│
├── docs/                 # 文档
│   ├── DEPLOYMENT.md
│   ├── DEVELOPMENT.md
│   └── NOTES.md
│
├── package.json
└── README.md
```

---

## 🛠 技术栈

### 后端
- **Runtime**: Node.js 18+
- **框架**: Express 4.x
- **WebSocket**: ws 8.x
- **数据库**: better-sqlite3 (SQLite)
- **工具库**: uuid, cors, dotenv

### 前端
- **框架**: React 18.x
- **构建工具**: Create React App
- **图表**: Chart.js + react-chartjs-2
- **图标**: lucide-react
- **HTTP客户端**: axios

### Agent
- **Runtime**: Node.js 18+
- **WebSocket**: ws 8.x
- **系统调用**: child_process, os模块

---

## 🚀 本地开发

### 环境准备

```bash
# 克隆项目
git clone https://github.com/your-repo/weiruan-jiankong.git
cd weiruan-jiankong

# 安装所有依赖
npm run install-all
```

### 启动控制端

```bash
# 配置环境变量
cd server
cp .env.example .env
# 编辑 .env 文件

# 启动开发服务器
npm run dev

# 或使用 nodemon 自动重载
npm install -g nodemon
nodemon index.js
```

服务将运行在:
- API: http://localhost:3001
- WebSocket: ws://localhost:3002

### 启动前端

```bash
cd dashboard

# 开发模式
npm start
```

访问: http://localhost:3000

### 测试Agent

```bash
cd agent

# 编辑配置文件
nano config.json

# 启动Agent
node index.js
```

---

## 📡 API接口文档

### 服务器管理

#### 1. 创建服务器

```http
POST /api/servers
Content-Type: application/json

{
  "name": "服务器名称"
}
```

响应:
```json
{
  "id": "uuid",
  "name": "服务器名称",
  "token": "认证token"
}
```

#### 2. 获取所有服务器

```http
GET /api/servers
```

响应:
```json
[
  {
    "id": "uuid",
    "name": "服务器名称",
    "token": "token",
    "status": "online",
    "created_at": 1234567890,
    "last_seen": 1234567890,
    "systemInfo": {
      "hostname": "localhost",
      "platform": "linux",
      "arch": "x64",
      "osVersion": "Ubuntu 20.04",
      "uptime": 123456
    },
    "latestStats": {
      "cpu_usage": 45.5,
      "cpu_cores": 4,
      "memory_total": 8589934592,
      "memory_used": 4294967296,
      ...
    }
  }
]
```

#### 3. 获取服务器详情

```http
GET /api/servers/:id
```

响应:
```json
{
  "id": "uuid",
  "name": "服务器名称",
  "systemInfo": {...},
  "stats": [
    {
      "timestamp": 1234567890,
      "cpu_usage": 45.5,
      ...
    }
  ]
}
```

#### 4. 删除服务器

```http
DELETE /api/servers/:id
```

响应:
```json
{
  "success": true
}
```

#### 5. 获取安装脚本

```http
GET /api/servers/:id/install-script
```

响应: 纯文本bash脚本

#### 6. 清理旧数据

```http
POST /api/cleanup
Content-Type: application/json

{
  "days": 7
}
```

响应:
```json
{
  "success": true,
  "deletedRecords": 1234
}
```

---

## 🔌 WebSocket协议

### 连接

```javascript
const ws = new WebSocket('ws://localhost:3002');
```

### 消息格式

所有消息都是JSON格式：

```json
{
  "type": "message_type",
  "data": {...}
}
```

### Agent消息类型

#### 1. 注册 (Agent -> Server)

```json
{
  "type": "agent_register",
  "token": "server-token"
}
```

响应:
```json
{
  "type": "registered",
  "serverId": "uuid"
}
```

#### 2. 发送监控数据 (Agent -> Server)

```json
{
  "type": "agent_data",
  "systemInfo": {
    "hostname": "localhost",
    "platform": "linux",
    "arch": "x64",
    "osVersion": "Ubuntu 20.04",
    "uptime": 123456
  },
  "monitoring": {
    "cpu": {
      "usage": 45.5,
      "cores": 4
    },
    "memory": {
      "total": 8589934592,
      "used": 4294967296,
      "free": 4294967296,
      "usagePercent": 50.0
    },
    "disk": {
      "total": 107374182400,
      "used": 53687091200,
      "free": 53687091200,
      "usagePercent": 50.0
    },
    "network": {
      "upload": 1024,
      "download": 2048,
      "totalUpload": 1073741824,
      "totalDownload": 2147483648
    },
    "ping": {
      "latency": 25.5,
      "variance": 2.3
    }
  }
}
```

### Dashboard消息类型

#### 1. 连接 (Dashboard -> Server)

```json
{
  "type": "dashboard_connect"
}
```

响应:
```json
{
  "type": "initial_data",
  "servers": [...]
}
```

#### 2. 监控数据更新 (Server -> Dashboard)

```json
{
  "type": "monitoring_update",
  "serverId": "uuid",
  "data": {
    "systemInfo": {...},
    "monitoring": {...},
    "timestamp": 1234567890
  }
}
```

#### 3. 服务器上线 (Server -> Dashboard)

```json
{
  "type": "server_online",
  "serverId": "uuid",
  "serverName": "服务器名称"
}
```

#### 4. 服务器离线 (Server -> Dashboard)

```json
{
  "type": "server_offline",
  "serverId": "uuid"
}
```

---

## 🎨 主题开发

### 主题结构

主题定义在 `dashboard/src/themes.js`:

```javascript
export const themes = {
  themeName: {
    name: '主题名称',
    background: 'linear-gradient(...)',
    cardBg: 'rgba(...)',
    cardBorder: 'rgba(...)',
    primary: '#color',
    secondary: '#color',
    text: '#color',
    textSecondary: '#color',
    accent: '#color',
    success: '#color',
    warning: '#color',
    danger: '#color',
    chartColors: ['#color1', '#color2', ...],
    shadow: '0 8px 32px rgba(...)',
    glow: '0 0 20px rgba(...)'
  }
};
```

### 添加新主题

1. 在 `themes.js` 中添加新主题对象
2. 在 `ThemeSelector.js` 中添加图标:

```javascript
const themeIcons = {
  themeName: '🎨'
};
```

---

## 🗄 数据库结构

### servers 表

```sql
CREATE TABLE servers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  last_seen INTEGER DEFAULT 0,
  status TEXT DEFAULT 'offline'
);
```

### monitoring_data 表

```sql
CREATE TABLE monitoring_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  server_id TEXT NOT NULL,
  timestamp INTEGER DEFAULT (strftime('%s', 'now')),
  cpu_usage REAL,
  cpu_cores INTEGER,
  memory_total INTEGER,
  memory_used INTEGER,
  disk_total INTEGER,
  disk_used INTEGER,
  network_upload REAL,
  network_download REAL,
  network_total_upload INTEGER,
  network_total_download INTEGER,
  ping REAL,
  ping_variance REAL,
  FOREIGN KEY (server_id) REFERENCES servers(id)
);
```

### system_info 表

```sql
CREATE TABLE system_info (
  server_id TEXT PRIMARY KEY,
  hostname TEXT,
  platform TEXT,
  arch TEXT,
  os_version TEXT,
  uptime INTEGER,
  FOREIGN KEY (server_id) REFERENCES servers(id)
);
```

---

## 🧪 测试

### 手动测试

```bash
# 测试API
curl http://localhost:3001/api/servers

# 测试WebSocket
wscat -c ws://localhost:3002
```

### 添加自动化测试

可以使用以下工具：
- Jest (单元测试)
- Supertest (API测试)
- React Testing Library (组件测试)

---

## 📦 构建部署

### 构建前端

```bash
cd dashboard
npm run build
```

生成的文件在 `dashboard/build/`

### 生产环境配置

1. 设置环境变量:
```env
NODE_ENV=production
PORT=3001
WS_PORT=3002
```

2. 使用PM2管理进程:
```bash
npm install -g pm2
pm2 start server/index.js --name weiruan-probe
pm2 save
pm2 startup
```

---

## 🤝 贡献指南

1. Fork项目
2. 创建特性分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送到分支: `git push origin feature/AmazingFeature`
5. 提交Pull Request

---

## 📄 许可证

MIT License

---

Made with ❤️ by 威软探针
