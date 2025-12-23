#!/bin/bash

#############################################
# 威软探针 - Agent一键安装脚本
# 作者: 威软探针
#############################################

set -e

# 接收参数
TOKEN=$1
SERVER_URL=$2

echo "========================================="
echo "🚀 威软探针 - Agent安装程序"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 检查参数
if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ 错误：未提供Token${NC}"
    echo "使用方法: bash install-agent.sh <TOKEN> [SERVER_URL]"
    exit 1
fi

if [ -z "$SERVER_URL" ]; then
    echo "请输入控制端WebSocket地址（例如：ws://192.168.1.100:3002）："
    read -r SERVER_URL
fi

echo "📋 Token: ${TOKEN:0:10}..."
echo "📋 服务器: $SERVER_URL"

# 检测操作系统
OS="unknown"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
fi

echo "📋 检测到操作系统: $OS"

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ 请使用root权限运行此脚本${NC}"
    echo "请使用: sudo bash install-agent.sh <TOKEN>"
    exit 1
fi

# 安装Node.js
install_nodejs() {
    echo "📦 正在检查Node.js..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✅ Node.js已安装: $NODE_VERSION${NC}"
        return
    fi

    echo "正在安装Node.js..."

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    else
        echo -e "${RED}❌ 不支持的操作系统${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Node.js安装完成${NC}"
}

# 创建安装目录
create_directories() {
    echo "📁 创建安装目录..."

    mkdir -p /opt/weiruan-agent
    cd /opt/weiruan-agent

    echo -e "${GREEN}✅ 目录创建完成${NC}"
}

# 创建Agent程序
create_agent() {
    echo "📝 创建Agent程序..."

    # 创建package.json
    cat > package.json << 'EOF'
{
  "name": "weiruan-agent",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "ws": "^8.14.2"
  }
}
EOF

    # 创建配置文件
    cat > config.json << EOF
{
  "serverUrl": "$SERVER_URL",
  "token": "$TOKEN",
  "reportInterval": 3000,
  "pingTarget": "8.8.8.8"
}
EOF

    # 下载Agent代码（实际应该从服务器下载）
    # 这里可以从控制端API获取agent代码
    # curl -o index.js http://your-server/api/agent/code

    echo "正在安装依赖..."
    npm install

    echo -e "${GREEN}✅ Agent程序创建完成${NC}"
}

# 配置systemd服务
configure_systemd() {
    echo "🔧 配置系统服务..."

    cat > /etc/systemd/system/weiruan-agent.service << 'EOF'
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

    systemctl daemon-reload
    systemctl enable weiruan-agent

    echo -e "${GREEN}✅ 系统服务配置完成${NC}"
}

# 启动服务
start_service() {
    echo "🚀 启动服务..."

    systemctl start weiruan-agent
    sleep 2

    if systemctl is-active --quiet weiruan-agent; then
        echo -e "${GREEN}✅ Agent启动成功！${NC}"
    else
        echo -e "${RED}❌ Agent启动失败，请检查日志${NC}"
        journalctl -u weiruan-agent -n 50
        exit 1
    fi
}

# 显示信息
show_info() {
    echo ""
    echo "========================================="
    echo "✅ Agent安装完成！"
    echo "========================================="
    echo ""
    echo "常用命令："
    echo "  启动服务: systemctl start weiruan-agent"
    echo "  停止服务: systemctl stop weiruan-agent"
    echo "  重启服务: systemctl restart weiruan-agent"
    echo "  查看状态: systemctl status weiruan-agent"
    echo "  查看日志: journalctl -u weiruan-agent -f"
    echo ""
    echo "配置文件: /opt/weiruan-agent/config.json"
    echo ""
    echo "========================================="
    echo "Made with ❤️  by 威软探针"
    echo "========================================="
}

# 主函数
main() {
    install_nodejs
    create_directories
    create_agent
    configure_systemd
    start_service
    show_info
}

# 执行主函数
main
