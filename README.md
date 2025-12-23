# 威软探针 - VPS监控系统

<div align="center">
  <h1>🚀 威软探针</h1>
  <p>专业的VPS服务器监控解决方案</p>
  <p>轻量 • 实时 • 美观 • 易用</p>
</div>

## ✨ 特性

- 📊 **实时监控** - WebSocket实时推送监控数据
- 💻 **全面监控** - CPU、内存、硬盘、网络速度、网络延迟
- 🎨 **多主题** - 4个精美科技感主题可选
- 🚀 **一键部署** - 简单快速的安装流程
- 📱 **响应式设计** - 完美支持移动端
- 🔒 **安全可靠** - Token认证机制

## 🎯 监控项目

- ✅ 服务器基础信息（系统、架构、启动时间）
- ✅ CPU使用率及核心数
- ✅ 内存使用情况
- ✅ 硬盘使用情况
- ✅ 实时网络速度（上传/下载）
- ✅ 网络延迟（Ping）及波动监测
- ✅ 网络流量统计

## 📁 项目结构

```
weiruan-jiankong/
├── server/          # 控制端服务器
├── agent/           # 被控端Agent
├── dashboard/       # 前端监控面板
├── scripts/         # 部署脚本
└── docs/            # 文档
```

## 🚀 快速开始

### 控制端部署

```bash
# 一键安装脚本
curl -fsSL https://your-domain.com/install-server.sh | bash
```

### 被控端部署

在控制面板中生成一键安装命令，例如：
```bash
curl -fsSL https://your-domain.com/install-agent.sh | bash -s YOUR_TOKEN
```

## 📖 详细文档

- [完整部署流程](./docs/DEPLOYMENT.md)
- [Agent安装说明](./docs/AGENT.md)
- [开发文档](./docs/DEVELOPMENT.md)
- [注意事项](./docs/NOTES.md)

## 🎨 主题预览

- 🌌 深空蓝 (Deep Space)
- 🌆 赛博朋克 (Cyberpunk)
- 🌿 矩阵绿 (Matrix)
- 🔥 火焰橙 (Flame)

## 💡 技术栈

- **后端**: Node.js + Express + SQLite
- **前端**: React + Tailwind CSS + Chart.js
- **通信**: WebSocket + HTTP API
- **Agent**: Node.js

## 📄 开源协议

MIT License

## 👨‍💻 作者

**威软探针** - 专业的服务器监控解决方案

---

Made with ❤️ by 威软探针