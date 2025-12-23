const express = require('express');
const router = express.Router();
const db = require('../database');

// 创建新服务器
router.post('/servers', (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: '服务器名称不能为空' });
    }

    const server = db.createServer(name);
    res.json(server);
  } catch (error) {
    console.error('创建服务器失败:', error);
    res.status(500).json({ error: '创建服务器失败' });
  }
});

// 获取所有服务器
router.get('/servers', (req, res) => {
  try {
    const servers = db.getAllServers();
    const serversWithInfo = servers.map(server => {
      const systemInfo = db.getSystemInfo(server.id);
      const stats = db.getServerStats(server.id, 1);

      return {
        ...server,
        systemInfo,
        latestStats: stats[0] || null
      };
    });

    res.json(serversWithInfo);
  } catch (error) {
    console.error('获取服务器列表失败:', error);
    res.status(500).json({ error: '获取服务器列表失败' });
  }
});

// 获取单个服务器详情
router.get('/servers/:id', (req, res) => {
  try {
    const { id } = req.params;
    const servers = db.getAllServers();
    const server = servers.find(s => s.id === id);

    if (!server) {
      return res.status(404).json({ error: '服务器不存在' });
    }

    const systemInfo = db.getSystemInfo(id);
    const stats = db.getServerStats(id, 100);

    res.json({
      ...server,
      systemInfo,
      stats
    });
  } catch (error) {
    console.error('获取服务器详情失败:', error);
    res.status(500).json({ error: '获取服务器详情失败' });
  }
});

// 删除服务器
router.delete('/servers/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.deleteServer(id);
    res.json({ success: true });
  } catch (error) {
    console.error('删除服务器失败:', error);
    res.status(500).json({ error: '删除服务器失败' });
  }
});

// 生成Agent安装脚本
router.get('/servers/:id/install-script', (req, res) => {
  try {
    const { id } = req.params;
    const servers = db.getAllServers();
    const server = servers.find(s => s.id === id);

    if (!server) {
      return res.status(404).json({ error: '服务器不存在' });
    }

    const serverHost = req.get('host').split(':')[0];
    const wsPort = process.env.WS_PORT || 3002;

    const script = `#!/bin/bash
# 威软探针 - Agent一键安装脚本
# 服务器: ${server.name}

echo "================================="
echo "🚀 威软探针 - Agent安装程序"
echo "================================="

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到Node.js，正在安装..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 创建目录
mkdir -p /opt/weiruan-agent
cd /opt/weiruan-agent

# 下载Agent
echo "📥 正在下载Agent..."
cat > package.json << 'PACKAGE_EOF'
{
  "name": "weiruan-agent",
  "version": "1.0.0",
  "main": "index.js",
  "dependencies": {
    "ws": "^8.14.2"
  }
}
PACKAGE_EOF

# 安装依赖
npm install

# 创建配置文件
cat > config.json << 'CONFIG_EOF'
{
  "serverUrl": "ws://${serverHost}:${wsPort}",
  "token": "${server.token}",
  "reportInterval": 3000,
  "pingTarget": "8.8.8.8"
}
CONFIG_EOF

# 下载Agent代码 (需要将agent代码放在这里)
echo "📝 创建Agent程序..."
# Agent代码将在后续步骤中生成

# 创建systemd服务
cat > /etc/systemd/system/weiruan-agent.service << 'SERVICE_EOF'
[Unit]
Description=威软探针 Agent
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/weiruan-agent
ExecStart=/usr/bin/node /opt/weiruan-agent/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE_EOF

# 启动服务
systemctl daemon-reload
systemctl enable weiruan-agent
systemctl start weiruan-agent

echo "================================="
echo "✅ 安装完成！"
echo "================================="
echo "查看状态: systemctl status weiruan-agent"
echo "查看日志: journalctl -u weiruan-agent -f"
`;

    res.type('text/plain').send(script);
  } catch (error) {
    console.error('生成安装脚本失败:', error);
    res.status(500).json({ error: '生成安装脚本失败' });
  }
});

// 数据清理
router.post('/cleanup', (req, res) => {
  try {
    const { days = 7 } = req.body;
    const deleted = db.cleanOldData(days);
    res.json({
      success: true,
      deletedRecords: deleted
    });
  } catch (error) {
    console.error('数据清理失败:', error);
    res.status(500).json({ error: '数据清理失败' });
  }
});

module.exports = router;
