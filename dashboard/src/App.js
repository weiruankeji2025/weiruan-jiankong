import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ThemeSelector from './components/ThemeSelector';
import { themes } from './themes';

function App() {
  const [theme, setTheme] = useState('deepSpace');
  const [servers, setServers] = useState([]);
  const [ws, setWs] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:3002';

  useEffect(() => {
    // 连接WebSocket
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('✅ WebSocket已连接');
      websocket.send(JSON.stringify({ type: 'dashboard_connect' }));
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      } catch (error) {
        console.error('处理WebSocket消息错误:', error);
      }
    };

    websocket.onclose = () => {
      console.log('❌ WebSocket断开，5秒后重连...');
      setTimeout(() => window.location.reload(), 5000);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket错误:', error);
    };

    setWs(websocket);

    return () => {
      if (websocket) {
        websocket.close();
      }
    };
  }, [WS_URL]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'initial_data':
        setServers(data.servers);
        break;

      case 'monitoring_update':
        setServers(prevServers =>
          prevServers.map(server =>
            server.id === data.serverId
              ? {
                  ...server,
                  systemInfo: data.data.systemInfo || server.systemInfo,
                  latestStats: data.data.monitoring
                }
              : server
          )
        );
        break;

      case 'server_online':
        fetchServers();
        break;

      case 'server_offline':
        setServers(prevServers =>
          prevServers.map(server =>
            server.id === data.serverId
              ? { ...server, status: 'offline' }
              : server
          )
        );
        break;

      default:
        break;
    }
  };

  const fetchServers = async () => {
    try {
      const response = await fetch(`${API_URL}/api/servers`);
      const data = await response.json();
      setServers(data);
    } catch (error) {
      console.error('获取服务器列表失败:', error);
    }
  };

  const addServer = async (name) => {
    try {
      const response = await fetch(`${API_URL}/api/servers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
      });

      if (response.ok) {
        const newServer = await response.json();
        fetchServers();
        return newServer;
      }
    } catch (error) {
      console.error('添加服务器失败:', error);
    }
  };

  const deleteServer = async (serverId) => {
    try {
      const response = await fetch(`${API_URL}/api/servers/${serverId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setServers(prevServers =>
          prevServers.filter(server => server.id !== serverId)
        );
      }
    } catch (error) {
      console.error('删除服务器失败:', error);
    }
  };

  const currentTheme = themes[theme];

  return (
    <div className="app" style={{ background: currentTheme.background }}>
      <ThemeSelector currentTheme={theme} onThemeChange={setTheme} />
      <Dashboard
        servers={servers}
        theme={currentTheme}
        onAddServer={addServer}
        onDeleteServer={deleteServer}
        apiUrl={API_URL}
      />
    </div>
  );
}

export default App;
