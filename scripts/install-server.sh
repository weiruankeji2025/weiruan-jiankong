#!/bin/bash

#############################################
# 威软探针 - 控制端一键安装脚本
# 作者: 威软探针
#############################################

set -e

echo "========================================="
echo "🚀 威软探针 - 控制端安装程序"
echo "========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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
    echo "请使用: sudo bash install-server.sh"
    exit 1
fi

# 安装Node.js
install_nodejs() {
    echo "📦 正在安装Node.js..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✅ Node.js已安装: $NODE_VERSION${NC}"
        return
    fi

    if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
        yum install -y nodejs
    else
        echo -e "${RED}❌ 不支持的操作系统，请手动安装Node.js 18+${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Node.js安装完成${NC}"
}

# 创建安装目录
create_directories() {
    echo "📁 创建安装目录..."

    mkdir -p /opt/weiruan-probe
    cd /opt/weiruan-probe

    echo -e "${GREEN}✅ 目录创建完成${NC}"
}

# 下载项目
download_project() {
    echo "📥 正在下载项目文件..."

    # 这里应该从实际的仓库下载，示例使用git clone
    # git clone https://github.com/your-repo/weiruan-jiankong.git .

    # 临时方案：提示用户手动上传
    echo -e "${YELLOW}⚠️  请将项目文件上传到 /opt/weiruan-probe 目录${NC}"
    echo "或者使用: git clone <your-repo-url> /opt/weiruan-probe"

    # 如果已经有文件，继续
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ 未找到项目文件${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ 项目文件准备完成${NC}"
}

# 安装依赖
install_dependencies() {
    echo "📦 正在安装依赖..."

    # 安装根目录依赖（如果有）
    if [ -f "package.json" ]; then
        npm install
    fi

    # 安装服务器依赖
    if [ -d "server" ]; then
        cd server
        npm install
        cd ..
    fi

    # 安装前端依赖并构建
    if [ -d "dashboard" ]; then
        cd dashboard
        npm install
        npm run build
        cd ..
    fi

    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 配置环境变量
configure_env() {
    echo "⚙️  配置环境变量..."

    if [ -f "server/.env.example" ]; then
        cp server/.env.example server/.env

        # 生成随机Token
        RANDOM_TOKEN=$(openssl rand -hex 32)
        sed -i "s/change-this-to-random-string/$RANDOM_TOKEN/g" server/.env

        echo -e "${GREEN}✅ 环境变量配置完成${NC}"
        echo -e "${YELLOW}管理员Token: $RANDOM_TOKEN${NC}"
        echo "请妥善保管此Token！"
    fi
}

# 配置systemd服务
configure_systemd() {
    echo "🔧 配置系统服务..."

    cat > /etc/systemd/system/weiruan-probe.service << 'EOF'
[Unit]
Description=威软探针 - 控制端服务
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/weiruan-probe/server
ExecStart=/usr/bin/node /opt/weiruan-probe/server/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=weiruan-probe

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable weiruan-probe

    echo -e "${GREEN}✅ 系统服务配置完成${NC}"
}

# 配置Nginx（可选）
configure_nginx() {
    echo "🌐 是否配置Nginx反向代理？(y/n)"
    read -r INSTALL_NGINX

    if [ "$INSTALL_NGINX" != "y" ]; then
        echo "跳过Nginx配置"
        return
    fi

    # 安装Nginx
    if ! command -v nginx &> /dev/null; then
        echo "正在安装Nginx..."
        if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
            apt-get install -y nginx
        elif [ "$OS" = "centos" ] || [ "$OS" = "rhel" ]; then
            yum install -y nginx
        fi
    fi

    echo "请输入域名（例如：probe.example.com）："
    read -r DOMAIN

    cat > /etc/nginx/sites-available/weiruan-probe << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 前端
    location / {
        root /opt/weiruan-probe/dashboard/build;
        try_files \$uri /index.html;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/weiruan-probe /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx

    echo -e "${GREEN}✅ Nginx配置完成${NC}"
    echo "访问地址: http://$DOMAIN"
}

# 启动服务
start_service() {
    echo "🚀 启动服务..."

    systemctl start weiruan-probe
    sleep 2

    if systemctl is-active --quiet weiruan-probe; then
        echo -e "${GREEN}✅ 服务启动成功！${NC}"
    else
        echo -e "${RED}❌ 服务启动失败，请检查日志${NC}"
        journalctl -u weiruan-probe -n 50
        exit 1
    fi
}

# 显示信息
show_info() {
    echo ""
    echo "========================================="
    echo "✅ 安装完成！"
    echo "========================================="
    echo ""
    echo "📡 API服务: http://$(hostname -I | awk '{print $1}'):3001"
    echo "🔌 WebSocket: ws://$(hostname -I | awk '{print $1}'):3002"
    echo ""
    echo "常用命令："
    echo "  启动服务: systemctl start weiruan-probe"
    echo "  停止服务: systemctl stop weiruan-probe"
    echo "  重启服务: systemctl restart weiruan-probe"
    echo "  查看状态: systemctl status weiruan-probe"
    echo "  查看日志: journalctl -u weiruan-probe -f"
    echo ""
    echo "========================================="
    echo "Made with ❤️  by 威软探针"
    echo "========================================="
}

# 主函数
main() {
    install_nodejs
    create_directories
    download_project
    install_dependencies
    configure_env
    configure_systemd
    configure_nginx
    start_service
    show_info
}

# 执行主函数
main
