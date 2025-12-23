const db = require('./database');

// 存储所有活跃的连接
const connections = new Map();
const dashboardConnections = new Set();

function handleWebSocket(ws, req, wss) {
  console.log('新的WebSocket连接');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'agent_register':
          handleAgentRegister(ws, data, wss);
          break;
        case 'agent_data':
          handleAgentData(ws, data, wss);
          break;
        case 'dashboard_connect':
          handleDashboardConnect(ws);
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        default:
          console.log('未知消息类型:', data.type);
      }
    } catch (error) {
      console.error('处理WebSocket消息错误:', error);
    }
  });

  ws.on('close', () => {
    // 清理连接
    for (const [serverId, conn] of connections.entries()) {
      if (conn === ws) {
        connections.delete(serverId);
        db.updateServerStatus(serverId, 'offline');
        broadcastToDashboards({
          type: 'server_offline',
          serverId
        });
        console.log(`服务器 ${serverId} 断开连接`);
        break;
      }
    }

    dashboardConnections.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error);
  });
}

function handleAgentRegister(ws, data, wss) {
  const { token } = data;
  const server = db.getServerByToken(token);

  if (!server) {
    ws.send(JSON.stringify({
      type: 'error',
      message: 'Invalid token'
    }));
    ws.close();
    return;
  }

  connections.set(server.id, ws);
  db.updateServerStatus(server.id, 'online');

  ws.serverId = server.id;

  ws.send(JSON.stringify({
    type: 'registered',
    serverId: server.id
  }));

  console.log(`Agent注册成功: ${server.name} (${server.id})`);

  // 通知所有仪表板
  broadcastToDashboards({
    type: 'server_online',
    serverId: server.id,
    serverName: server.name
  });
}

function handleAgentData(ws, data, wss) {
  if (!ws.serverId) {
    return;
  }

  const { systemInfo, monitoring } = data;

  // 保存系统信息
  if (systemInfo) {
    db.saveSystemInfo(ws.serverId, systemInfo);
  }

  // 保存监控数据
  if (monitoring) {
    db.saveMonitoringData(ws.serverId, monitoring);
  }

  // 实时推送到仪表板
  broadcastToDashboards({
    type: 'monitoring_update',
    serverId: ws.serverId,
    data: {
      systemInfo,
      monitoring,
      timestamp: Date.now()
    }
  });
}

function handleDashboardConnect(ws) {
  dashboardConnections.add(ws);
  console.log('仪表板连接成功');

  // 发送当前所有服务器状态
  const servers = db.getAllServers();
  const serverData = servers.map(server => {
    const systemInfo = db.getSystemInfo(server.id);
    const stats = db.getServerStats(server.id, 1);

    return {
      ...server,
      systemInfo,
      latestStats: stats[0] || null
    };
  });

  ws.send(JSON.stringify({
    type: 'initial_data',
    servers: serverData
  }));
}

function broadcastToDashboards(message) {
  const data = JSON.stringify(message);
  dashboardConnections.forEach(ws => {
    if (ws.readyState === 1) { // OPEN
      ws.send(data);
    }
  });
}

module.exports = {
  handleWebSocket,
  broadcastToDashboards
};
