# 威软探针 - 快速开始指南

## 🚀 5分钟快速部署

### 第一步：部署控制端

在一台服务器上执行（需要公网IP）：

```bash
# 克隆项目
git clone https://github.com/weiruankeji2025/weiruan-jiankong.git
cd weiruan-jiankong

# 安装Node.js（如果未安装）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装服务器端依赖
cd server
npm install

# 配置环境变量
cp .env.example .env
nano .env  # 修改 ADMIN_TOKEN 为随机字符串

# 启动服务器
node index.js
```

服务器将运行在：
- API: http://your-ip:3001
- WebSocket: ws://your-ip:3002

### 第二步：构建前端

```bash
# 在项目根目录
cd dashboard
npm install
npm run build

# 前端文件生成在 dashboard/build/
```

### 第三步：部署Agent

在要监控的服务器上执行：

```bash
# 安装Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 创建目录
sudo mkdir -p /opt/weiruan-agent
cd /opt/weiruan-agent

# 复制agent文件
# 将项目的 agent/ 目录下所有文件复制到此处

# 安装依赖
npm install

# 编辑配置
nano config.json
# 修改 serverUrl 和 token

# 启动
node index.js
```

### 第四步：访问面板

1. 打开浏览器访问: `http://your-server:3001`
2. 看到控制面板
3. 点击"添加服务器"创建新服务器
4. 获取Token和安装命令
5. 在目标服务器上执行安装命令

---

## 🎨 主题切换

点击右上角的主题按钮，可以切换4个主题：
- 🌌 深空蓝
- 🌆 赛博朋克
- 🌿 矩阵绿
- 🔥 火焰橙

---

## 📊 监控数据

实时监控以下指标：
- ✅ CPU使用率和核心数
- ✅ 内存使用情况
- ✅ 硬盘使用情况
- ✅ 网络实时速度
- ✅ 网络延迟和波动
- ✅ 系统基础信息

---

## 🔧 常用命令

### 控制端
```bash
# 启动
cd server && node index.js

# 使用PM2管理（推荐生产环境）
npm install -g pm2
pm2 start server/index.js --name weiruan-probe
pm2 save
pm2 startup
```

### Agent
```bash
# 启动
cd /opt/weiruan-agent && node index.js

# 使用systemd管理（推荐）
sudo systemctl start weiruan-agent
sudo systemctl status weiruan-agent
```

---

## 📖 更多文档

- [完整部署流程](./docs/DEPLOYMENT.md) - 详细的部署步骤
- [Agent安装指南](./docs/AGENT.md) - Agent详细配置
- [开发文档](./docs/DEVELOPMENT.md) - 二次开发指南
- [注意事项](./docs/NOTES.md) - 重要提醒和最佳实践

---

## 🆘 遇到问题？

### 控制端无法启动
```bash
# 检查端口占用
sudo netstat -tlnp | grep -E '3001|3002'

# 查看错误日志
cd server && node index.js
```

### Agent连接不上
```bash
# 测试网络连通性
telnet your-server-ip 3002

# 检查Token是否正确
cat /opt/weiruan-agent/config.json
```

### 前端无法访问
```bash
# 检查防火墙
sudo ufw status
sudo ufw allow 3001/tcp
sudo ufw allow 3002/tcp
```

---

## 🎯 生产环境建议

1. **使用Nginx反向代理**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /path/to/dashboard/build;
        try_files $uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
    }

    location /ws {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

2. **配置SSL证书**
```bash
sudo certbot --nginx -d your-domain.com
```

3. **使用systemd管理服务**（参考docs/DEPLOYMENT.md）

4. **定期备份数据库**
```bash
# 每天备份
echo "0 3 * * * cp /opt/weiruan-jiankong/server/weiruan.db /backup/weiruan-\$(date +\%Y\%m\%d).db" | crontab -
```

---

## 🌟 项目特色

### 多主题设计
精心设计的4个科技感主题，适应不同审美需求

### 实时监控
WebSocket实时推送，延迟低至秒级

### 轻量高效
Agent占用资源极少，适合所有服务器

### 简单易用
一键安装，自动配置，开箱即用

### 完整文档
提供详尽的部署和开发文档

---

## 📝 署名

**威软探针** - 专业的VPS监控解决方案

Made with ❤️ by 威软探针

---

## 📄 许可证

MIT License - 可自由使用和修改

---

## 🔗 相关链接

- GitHub: https://github.com/weiruankeji2025/weiruan-jiankong
- 问题反馈: https://github.com/weiruankeji2025/weiruan-jiankong/issues
- Pull Request: https://github.com/weiruankeji2025/weiruan-jiankong/pulls
