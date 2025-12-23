# 威软探针 - 完整部署流程

## 📋 目录

1. [系统要求](#系统要求)
2. [控制端部署](#控制端部署)
3. [被控端部署](#被控端部署)
4. [高级配置](#高级配置)
5. [故障排查](#故障排查)

---

## 系统要求

### 控制端（服务器）

- **操作系统**: Ubuntu 18.04+, Debian 10+, CentOS 7+, RHEL 7+
- **硬件配置**:
  - CPU: 1核心或以上
  - 内存: 1GB或以上
  - 磁盘: 10GB可用空间
- **软件要求**:
  - Node.js 18.x 或更高版本
  - npm 或 yarn
- **网络要求**:
  - 开放端口 3001 (HTTP API)
  - 开放端口 3002 (WebSocket)
  - 开放端口 80/443 (可选，用于Nginx反向代理)

### 被控端（Agent）

- **操作系统**: Ubuntu 18.04+, Debian 10+, CentOS 7+, RHEL 7+
- **硬件配置**:
  - CPU: 最低配置即可
  - 内存: 128MB或以上
  - 磁盘: 100MB可用空间
- **软件要求**:
  - Node.js 18.x 或更高版本
- **网络要求**:
  - 能够访问控制端的WebSocket端口

---

## 控制端部署

### 方法一：一键安装（推荐）

```bash
# 下载并执行安装脚本
curl -fsSL https://raw.githubusercontent.com/your-repo/weiruan-jiankong/main/scripts/install-server.sh -o install-server.sh
chmod +x install-server.sh
sudo ./install-server.sh
```

### 方法二：手动安装

#### 1. 安装Node.js

**Ubuntu/Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**CentOS/RHEL:**
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs
```

#### 2. 克隆项目

```bash
cd /opt
sudo git clone https://github.com/your-repo/weiruan-jiankong.git
cd weiruan-jiankong
```

#### 3. 安装依赖

```bash
# 安装服务器端依赖
cd server
npm install
cd ..

# 安装前端依赖并构建
cd dashboard
npm install
npm run build
cd ..
```

#### 4. 配置环境变量

```bash
cd server
cp .env.example .env
nano .env
```

编辑 `.env` 文件：
```env
PORT=3001
WS_PORT=3002
NODE_ENV=production
ADMIN_TOKEN=your-random-secure-token-here
```

#### 5. 配置systemd服务

创建服务文件：
```bash
sudo nano /etc/systemd/system/weiruan-probe.service
```

内容：
```ini
[Unit]
Description=威软探针 - 控制端服务
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/weiruan-jiankong/server
ExecStart=/usr/bin/node /opt/weiruan-jiankong/server/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=weiruan-probe

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable weiruan-probe
sudo systemctl start weiruan-probe
```

#### 6. 配置Nginx反向代理（可选但推荐）

安装Nginx：
```bash
# Ubuntu/Debian
sudo apt-get install -y nginx

# CentOS/RHEL
sudo yum install -y nginx
```

创建配置文件：
```bash
sudo nano /etc/nginx/sites-available/weiruan-probe
```

内容：
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /opt/weiruan-jiankong/dashboard/build;
        try_files $uri /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket代理
    location /ws {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：
```bash
sudo ln -s /etc/nginx/sites-available/weiruan-probe /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. 配置SSL证书（可选但推荐）

使用Let's Encrypt：
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 被控端部署

### 方法一：通过控制面板生成一键命令（推荐）

1. 访问控制面板
2. 点击"添加服务器"
3. 输入服务器名称
4. 点击"安装命令"按钮
5. 复制生成的命令
6. 在被监控服务器上执行该命令

### 方法二：手动安装

#### 1. 安装Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. 创建Agent目录

```bash
sudo mkdir -p /opt/weiruan-agent
cd /opt/weiruan-agent
```

#### 3. 复制Agent文件

从项目的 `agent` 目录复制所有文件到 `/opt/weiruan-agent/`

```bash
# 在控制端服务器上
scp -r /opt/weiruan-jiankong/agent/* user@target-server:/opt/weiruan-agent/
```

#### 4. 安装依赖

```bash
cd /opt/weiruan-agent
sudo npm install
```

#### 5. 配置Agent

编辑 `config.json`：
```bash
sudo nano config.json
```

内容：
```json
{
  "serverUrl": "ws://your-control-server:3002",
  "token": "your-server-token-from-control-panel",
  "reportInterval": 3000,
  "pingTarget": "8.8.8.8"
}
```

#### 6. 配置systemd服务

```bash
sudo nano /etc/systemd/system/weiruan-agent.service
```

内容：
```ini
[Unit]
Description=威软探针 - Agent服务
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/weiruan-agent
ExecStart=/usr/bin/node /opt/weiruan-agent/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=weiruan-agent

[Install]
WantedBy=multi-user.target
```

启动服务：
```bash
sudo systemctl daemon-reload
sudo systemctl enable weiruan-agent
sudo systemctl start weiruan-agent
```

---

## 高级配置

### 修改数据保留时间

默认保留7天的监控数据，可以通过API清理旧数据：

```bash
curl -X POST http://your-server:3001/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

### 修改采集频率

编辑Agent的 `config.json`：
```json
{
  "reportInterval": 5000  // 5秒采集一次
}
```

### 配置防火墙

**Ubuntu/Debian (UFW):**
```bash
sudo ufw allow 3001/tcp
sudo ufw allow 3002/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

**CentOS/RHEL (firewalld):**
```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### 配置开机自启

服务已配置为开机自启，无需额外操作。

---

## 故障排查

### 控制端无法启动

1. 检查日志：
```bash
sudo journalctl -u weiruan-probe -n 100 --no-pager
```

2. 检查端口占用：
```bash
sudo netstat -tlnp | grep -E '3001|3002'
```

3. 检查Node.js版本：
```bash
node -v  # 应该是 v18.x 或更高
```

### Agent无法连接控制端

1. 检查Agent日志：
```bash
sudo journalctl -u weiruan-agent -n 100 --no-pager
```

2. 测试网络连接：
```bash
telnet your-control-server 3002
```

3. 检查Token是否正确：
```bash
cat /opt/weiruan-agent/config.json
```

### 前端无法加载数据

1. 检查浏览器控制台错误
2. 确认API地址配置正确
3. 检查CORS设置
4. 检查Nginx配置（如果使用）

### 监控数据不准确

1. 确认系统命令可用：
```bash
# Linux
df -h
free -h
ping -c 4 8.8.8.8
```

2. 检查Agent权限（建议以root运行）

### 数据库过大

清理旧数据：
```bash
# 保留最近30天的数据
curl -X POST http://localhost:3001/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"days": 30}'
```

---

## 常用命令

### 控制端

```bash
# 启动服务
sudo systemctl start weiruan-probe

# 停止服务
sudo systemctl stop weiruan-probe

# 重启服务
sudo systemctl restart weiruan-probe

# 查看状态
sudo systemctl status weiruan-probe

# 查看实时日志
sudo journalctl -u weiruan-probe -f

# 查看最近100行日志
sudo journalctl -u weiruan-probe -n 100
```

### Agent

```bash
# 启动服务
sudo systemctl start weiruan-agent

# 停止服务
sudo systemctl stop weiruan-agent

# 重启服务
sudo systemctl restart weiruan-agent

# 查看状态
sudo systemctl status weiruan-agent

# 查看实时日志
sudo journalctl -u weiruan-agent -f
```

---

## 更新升级

### 控制端更新

```bash
cd /opt/weiruan-jiankong
sudo git pull
cd server && sudo npm install && cd ..
cd dashboard && sudo npm install && sudo npm run build && cd ..
sudo systemctl restart weiruan-probe
```

### Agent更新

```bash
cd /opt/weiruan-agent
# 备份配置
sudo cp config.json config.json.bak
# 更新文件
sudo git pull
sudo npm install
# 恢复配置
sudo cp config.json.bak config.json
sudo systemctl restart weiruan-agent
```

---

Made with ❤️ by 威软探针
