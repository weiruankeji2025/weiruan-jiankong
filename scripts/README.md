# 威软探针 - 安装脚本说明

## 📁 脚本列表

### 1. install-server.sh
控制端一键安装脚本

**功能**：
- 自动检测操作系统
- 安装Node.js
- 安装项目依赖
- 配置环境变量
- 创建systemd服务
- 可选配置Nginx反向代理

**使用方法**：
```bash
# 方式1：从本地执行
sudo bash install-server.sh

# 方式2：从网络执行
curl -fsSL https://your-domain.com/install-server.sh | sudo bash
```

**支持系统**：
- Ubuntu 18.04+
- Debian 10+
- CentOS 7+
- RHEL 7+

### 2. install-agent.sh
Agent一键安装脚本

**功能**：
- 自动检测操作系统
- 安装Node.js
- 创建Agent程序
- 配置Token和服务器地址
- 创建systemd服务
- 自动启动Agent

**使用方法**：
```bash
# 基本用法
sudo bash install-agent.sh <TOKEN> <SERVER_URL>

# 示例
sudo bash install-agent.sh abc123def456 ws://192.168.1.100:3002

# 从网络执行
curl -fsSL https://your-domain.com/install-agent.sh | sudo bash -s <TOKEN> <SERVER_URL>
```

**参数说明**：
- `<TOKEN>`: 从控制面板获取的服务器Token
- `<SERVER_URL>`: 控制端WebSocket地址，格式：ws://ip:port

---

## 🔧 自定义安装

### 修改安装路径

默认路径：
- 控制端: `/opt/weiruan-probe`
- Agent: `/opt/weiruan-agent`

修改方法：
编辑脚本中的路径变量

### 修改端口

控制端默认端口：
- API: 3001
- WebSocket: 3002

修改方法：
编辑 `server/.env` 文件

### 修改服务名称

默认服务名：
- 控制端: `weiruan-probe`
- Agent: `weiruan-agent`

修改方法：
编辑systemd服务文件名和配置

---

## 📝 安装后验证

### 控制端验证

```bash
# 检查服务状态
sudo systemctl status weiruan-probe

# 检查端口监听
sudo netstat -tlnp | grep -E '3001|3002'

# 测试API
curl http://localhost:3001/health

# 查看日志
sudo journalctl -u weiruan-probe -n 50
```

预期输出：
```json
{
  "status": "ok",
  "message": "威软探针服务运行正常",
  "version": "1.0.0"
}
```

### Agent验证

```bash
# 检查服务状态
sudo systemctl status weiruan-agent

# 查看日志
sudo journalctl -u weiruan-agent -n 50
```

预期日志：
```
✅ 已连接到控制端
📝 注册成功，服务器ID: xxx
📊 CPU: 12.5% | 内存: 45.2% | 磁盘: 32.1% | Ping: 15ms
```

---

## 🐛 故障排查

### 脚本执行失败

**权限问题**：
```bash
# 确保以root权限运行
sudo bash install-server.sh
```

**网络问题**：
```bash
# 检查网络连接
ping -c 4 deb.nodesource.com

# 使用国内镜像（可选）
export NODE_MIRROR=https://npmmirror.com/mirrors/node
```

**系统不支持**：
```bash
# 检查系统版本
cat /etc/os-release

# 手动安装（参考docs/DEPLOYMENT.md）
```

### 服务启动失败

**检查日志**：
```bash
# 控制端
sudo journalctl -u weiruan-probe -n 100

# Agent
sudo journalctl -u weiruan-agent -n 100
```

**常见错误**：

1. **端口被占用**
```bash
# 查找占用进程
sudo lsof -i :3001
sudo lsof -i :3002

# 停止占用进程或修改端口
```

2. **依赖安装失败**
```bash
# 清理并重新安装
cd /opt/weiruan-probe/server
sudo rm -rf node_modules
sudo npm install
```

3. **配置文件错误**
```bash
# 检查配置
cat /opt/weiruan-probe/server/.env
cat /opt/weiruan-agent/config.json

# 验证JSON格式
cat config.json | python3 -m json.tool
```

---

## 🔄 卸载

### 卸载控制端

```bash
# 停止服务
sudo systemctl stop weiruan-probe
sudo systemctl disable weiruan-probe

# 删除服务文件
sudo rm /etc/systemd/system/weiruan-probe.service
sudo systemctl daemon-reload

# 删除程序文件
sudo rm -rf /opt/weiruan-probe

# 删除Nginx配置（如果有）
sudo rm /etc/nginx/sites-enabled/weiruan-probe
sudo rm /etc/nginx/sites-available/weiruan-probe
sudo systemctl reload nginx
```

### 卸载Agent

```bash
# 停止服务
sudo systemctl stop weiruan-agent
sudo systemctl disable weiruan-agent

# 删除服务文件
sudo rm /etc/systemd/system/weiruan-agent.service
sudo systemctl daemon-reload

# 删除程序文件
sudo rm -rf /opt/weiruan-agent
```

---

## 📦 离线安装

### 准备离线包

在有网络的机器上：

```bash
# 下载Node.js安装包
wget https://nodejs.org/dist/v18.19.0/node-v18.19.0-linux-x64.tar.xz

# 打包项目
tar -czf weiruan-jiankong.tar.gz weiruan-jiankong/

# 下载依赖
cd weiruan-jiankong/server && npm install
cd ../agent && npm install
cd ../dashboard && npm install && npm run build
cd ../..

# 重新打包（包含依赖）
tar -czf weiruan-jiankong-full.tar.gz weiruan-jiankong/
```

### 离线安装

在目标机器上：

```bash
# 安装Node.js
tar -xf node-v18.19.0-linux-x64.tar.xz
sudo mv node-v18.19.0-linux-x64 /opt/nodejs
export PATH=/opt/nodejs/bin:$PATH

# 解压项目
tar -xzf weiruan-jiankong-full.tar.gz
cd weiruan-jiankong

# 按照手动安装步骤继续...
```

---

## 🚀 批量部署

### 使用Ansible

创建 `playbook.yml`:

```yaml
---
- hosts: agents
  become: yes
  vars:
    control_server: "192.168.1.100"
    ws_port: 3002
  tasks:
    - name: Download install script
      get_url:
        url: "http://{{ control_server }}/install-agent.sh"
        dest: /tmp/install-agent.sh
        mode: '0755'

    - name: Install agent
      shell: bash /tmp/install-agent.sh {{ server_token }} ws://{{ control_server }}:{{ ws_port }}
      args:
        creates: /opt/weiruan-agent/index.js
```

执行：
```bash
ansible-playbook -i inventory playbook.yml
```

### 使用Shell循环

```bash
#!/bin/bash

SERVERS=(
  "192.168.1.101"
  "192.168.1.102"
  "192.168.1.103"
)

TOKEN="your-token-here"
CONTROL_SERVER="192.168.1.100:3002"

for server in "${SERVERS[@]}"; do
  echo "部署到 $server..."
  ssh root@$server "curl -fsSL http://$CONTROL_SERVER/install-agent.sh | bash -s $TOKEN ws://$CONTROL_SERVER"
  echo "完成: $server"
done
```

---

## 📊 脚本执行流程

### install-server.sh 流程

```
开始
  ├─ 检查root权限
  ├─ 检测操作系统
  ├─ 安装Node.js
  │   ├─ Ubuntu/Debian: apt
  │   └─ CentOS/RHEL: yum
  ├─ 创建目录 /opt/weiruan-probe
  ├─ 下载/复制项目文件
  ├─ 安装依赖
  │   ├─ server: npm install
  │   └─ dashboard: npm install && build
  ├─ 配置环境变量
  │   └─ 生成随机Token
  ├─ 配置systemd服务
  ├─ 配置Nginx（可选）
  │   ├─ 安装Nginx
  │   ├─ 创建配置文件
  │   └─ 重载Nginx
  ├─ 启动服务
  └─ 显示安装信息
结束
```

### install-agent.sh 流程

```
开始
  ├─ 检查参数（Token, ServerURL）
  ├─ 检查root权限
  ├─ 检测操作系统
  ├─ 安装Node.js
  ├─ 创建目录 /opt/weiruan-agent
  ├─ 创建Agent程序
  │   ├─ package.json
  │   ├─ config.json
  │   └─ index.js
  ├─ 安装依赖
  ├─ 配置systemd服务
  ├─ 启动服务
  └─ 显示安装信息
结束
```

---

## 💡 最佳实践

1. **测试环境先行**
   - 在测试服务器上先执行脚本
   - 验证功能正常后再部署到生产环境

2. **备份重要数据**
   - 安装前备份现有配置
   - 定期备份数据库

3. **查看日志**
   - 安装后检查服务日志
   - 确认没有错误信息

4. **防火墙配置**
   - 确保必要端口开放
   - 限制不必要的访问

5. **安全加固**
   - 修改默认Token
   - 使用HTTPS/WSS
   - 定期更新系统

---

Made with ❤️ by 威软探针
