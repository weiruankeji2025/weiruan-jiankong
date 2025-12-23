# 威软探针 - Agent安装说明

## 📱 Agent介绍

威软探针Agent是部署在被监控服务器上的轻量级监控客户端，负责收集服务器的实时监控数据并发送到控制端。

### 特点

- 🪶 **轻量级**: 仅占用~50MB内存，<1% CPU
- 🔄 **自动重连**: 网络断开后自动重连
- 📊 **全面监控**: CPU、内存、硬盘、网络、延迟
- 🔒 **安全认证**: Token认证机制
- 🚀 **开机自启**: systemd服务管理

---

## 🎯 安装方式

### 方式一：通过控制面板（推荐）

这是最简单的方式：

1. 登录威软探针控制面板
2. 点击"添加服务器"按钮
3. 输入服务器名称（如：生产服务器1）
4. 点击"创建"
5. 点击新建服务器卡片上的"安装命令"按钮
6. 复制生成的一键安装命令
7. 在目标服务器上以root权限执行该命令

示例命令：
```bash
curl -fsSL http://your-server:3001/api/servers/xxx/install-script | bash
```

### 方式二：使用安装脚本

```bash
# 下载安装脚本
curl -fsSL https://your-domain.com/install-agent.sh -o install-agent.sh

# 执行安装
sudo bash install-agent.sh <YOUR_TOKEN> ws://your-server:3002
```

参数说明：
- `<YOUR_TOKEN>`: 从控制面板获取的服务器Token
- `ws://your-server:3002`: 控制端的WebSocket地址

### 方式三：手动安装

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

#### 2. 创建目录

```bash
sudo mkdir -p /opt/weiruan-agent
cd /opt/weiruan-agent
```

#### 3. 创建package.json

```bash
sudo tee package.json > /dev/null <<EOF
{
  "name": "weiruan-agent",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "ws": "^8.14.2"
  }
}
EOF
```

#### 4. 安装依赖

```bash
sudo npm install
```

#### 5. 下载Agent程序

从项目仓库复制 `agent/index.js` 到 `/opt/weiruan-agent/index.js`

或从控制端下载：
```bash
# 假设控制端提供了下载接口
sudo curl -o index.js http://your-server:3001/api/agent/download
```

#### 6. 创建配置文件

```bash
sudo tee config.json > /dev/null <<EOF
{
  "serverUrl": "ws://your-control-server:3002",
  "token": "your-server-token-here",
  "reportInterval": 3000,
  "pingTarget": "8.8.8.8"
}
EOF
```

配置说明：
- `serverUrl`: 控制端WebSocket地址
- `token`: 从控制面板获取的Token
- `reportInterval`: 数据采集间隔（毫秒）
- `pingTarget`: Ping测试目标（默认8.8.8.8）

#### 7. 创建systemd服务

```bash
sudo tee /etc/systemd/system/weiruan-agent.service > /dev/null <<EOF
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
EOF
```

#### 8. 启动服务

```bash
sudo systemctl daemon-reload
sudo systemctl enable weiruan-agent
sudo systemctl start weiruan-agent
```

#### 9. 验证安装

```bash
# 查看服务状态
sudo systemctl status weiruan-agent

# 查看实时日志
sudo journalctl -u weiruan-agent -f
```

如果看到类似输出，说明安装成功：
```
✅ 已连接到控制端
📝 注册成功，服务器ID: xxx
📊 CPU: 12.5% | 内存: 45.2% | 磁盘: 32.1% | Ping: 15ms
```

---

## ⚙️ 配置选项

### config.json 配置说明

```json
{
  "serverUrl": "ws://192.168.1.100:3002",
  "token": "your-server-token",
  "reportInterval": 3000,
  "pingTarget": "8.8.8.8"
}
```

| 参数 | 说明 | 默认值 | 建议值 |
|------|------|--------|--------|
| serverUrl | 控制端WebSocket地址 | - | ws://your-server:3002 |
| token | 服务器认证Token | - | 从控制面板获取 |
| reportInterval | 数据采集间隔（毫秒） | 3000 | 3000-10000 |
| pingTarget | Ping测试目标IP | 8.8.8.8 | 8.8.8.8, 114.114.114.114 |

### 采集间隔建议

- **关键服务器**: 1000-3000ms（高频监控）
- **一般服务器**: 3000-5000ms（标准监控）
- **非关键服务器**: 5000-10000ms（低频监控）

---

## 🔧 管理命令

### 服务管理

```bash
# 启动服务
sudo systemctl start weiruan-agent

# 停止服务
sudo systemctl stop weiruan-agent

# 重启服务
sudo systemctl restart weiruan-agent

# 查看状态
sudo systemctl status weiruan-agent

# 开机自启
sudo systemctl enable weiruan-agent

# 禁用开机自启
sudo systemctl disable weiruan-agent
```

### 日志查看

```bash
# 查看实时日志
sudo journalctl -u weiruan-agent -f

# 查看最近100行日志
sudo journalctl -u weiruan-agent -n 100

# 查看今天的日志
sudo journalctl -u weiruan-agent --since today

# 查看指定时间段的日志
sudo journalctl -u weiruan-agent --since "2024-01-01 00:00:00" --until "2024-01-02 00:00:00"
```

### 配置修改

修改配置后需要重启服务：

```bash
sudo nano /opt/weiruan-agent/config.json
sudo systemctl restart weiruan-agent
```

---

## 🐛 故障排查

### 1. Agent无法启动

**检查日志**:
```bash
sudo journalctl -u weiruan-agent -n 50
```

**常见原因**:
- Node.js未安装或版本过低
- 配置文件格式错误
- 端口被占用

**解决方法**:
```bash
# 检查Node.js版本
node -v  # 应该 >= v18.0.0

# 验证配置文件
cat /opt/weiruan-agent/config.json | python3 -m json.tool

# 检查文件权限
ls -la /opt/weiruan-agent/
```

### 2. 无法连接到控制端

**症状**: 日志显示连接错误

**检查网络**:
```bash
# Ping控制端
ping your-control-server

# 测试端口连通性
telnet your-control-server 3002
# 或
nc -zv your-control-server 3002
```

**检查配置**:
```bash
# 确认URL格式正确
cat /opt/weiruan-agent/config.json | grep serverUrl
# 应该是: ws://ip:port 或 wss://domain:port
```

### 3. Token认证失败

**症状**: 日志显示 "Invalid token"

**解决方法**:
```bash
# 从控制面板重新获取Token
# 编辑配置文件
sudo nano /opt/weiruan-agent/config.json

# 重启服务
sudo systemctl restart weiruan-agent
```

### 4. 数据不准确

**CPU/内存数据异常**:
```bash
# 确保以root权限运行
sudo systemctl edit weiruan-agent
# 添加: User=root

# 测试系统命令
free -h
df -h
top -bn1
```

**网络数据异常**:
```bash
# 检查网络接口
ip link show
ifconfig

# 测试Ping
ping -c 4 8.8.8.8
```

### 5. 频繁掉线重连

**检查网络稳定性**:
```bash
# 长时间Ping测试
ping -c 100 your-control-server

# 检查网络延迟和丢包
mtr your-control-server
```

**增加重连间隔**（如果需要）:
修改 `/etc/systemd/system/weiruan-agent.service`:
```ini
[Service]
RestartSec=30  # 增加到30秒
```

---

## 🔄 更新升级

### 更新Agent

```bash
# 停止服务
sudo systemctl stop weiruan-agent

# 备份配置
sudo cp /opt/weiruan-agent/config.json /tmp/config.json.bak

# 下载新版本
cd /opt/weiruan-agent
sudo curl -o index.js http://your-server:3001/api/agent/download

# 更新依赖（如果需要）
sudo npm install

# 恢复配置
sudo cp /tmp/config.json.bak /opt/weiruan-agent/config.json

# 启动服务
sudo systemctl start weiruan-agent

# 检查状态
sudo systemctl status weiruan-agent
```

---

## 🗑️ 卸载Agent

```bash
# 停止并禁用服务
sudo systemctl stop weiruan-agent
sudo systemctl disable weiruan-agent

# 删除服务文件
sudo rm /etc/systemd/system/weiruan-agent.service
sudo systemctl daemon-reload

# 删除程序文件
sudo rm -rf /opt/weiruan-agent

# 从控制面板删除服务器
# 访问控制面板，点击服务器卡片上的删除按钮
```

---

## 📊 监控数据说明

Agent收集的监控数据包括：

### 系统信息
- 主机名
- 操作系统类型和版本
- CPU架构
- 系统运行时间

### CPU监控
- 使用率（%）
- 核心数

### 内存监控
- 总内存
- 已用内存
- 可用内存
- 使用率（%）

### 硬盘监控
- 总容量
- 已用容量
- 可用容量
- 使用率（%）

### 网络监控
- 实时上传速度
- 实时下载速度
- 累计上传流量
- 累计下载流量

### 网络延迟
- Ping延迟（ms）
- 延迟波动（方差）

---

## 🔐 安全建议

1. **保护Token**: 不要泄露服务器Token
2. **使用SSL**: 生产环境使用 wss:// 协议
3. **限制访问**: 使用防火墙限制只能访问控制端
4. **定期更新**: 及时更新Agent版本
5. **日志监控**: 定期检查Agent日志

---

## 💡 最佳实践

### 1. 服务器命名

使用有意义的名称：
```
prod-web-01    # 生产Web服务器1
prod-db-01     # 生产数据库服务器1
test-api-01    # 测试API服务器1
```

### 2. 批量部署

创建批量安装脚本：
```bash
#!/bin/bash
SERVERS=(
  "192.168.1.101"
  "192.168.1.102"
  "192.168.1.103"
)

for server in "${SERVERS[@]}"; do
  echo "部署到 $server..."
  ssh root@$server 'bash -s' < install-agent.sh TOKEN ws://control-server:3002
done
```

### 3. 监控分组

根据重要性调整采集间隔：
- 关键业务: 3000ms
- 一般业务: 5000ms
- 测试环境: 10000ms

---

## 📞 获取帮助

遇到问题？

1. 查看日志: `sudo journalctl -u weiruan-agent -n 100`
2. 查阅文档: `/docs` 目录
3. 检查网络: `ping your-control-server`
4. 验证配置: `cat /opt/weiruan-agent/config.json`

---

Made with ❤️ by 威软探针
