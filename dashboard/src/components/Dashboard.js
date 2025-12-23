import React, { useState } from 'react';
import './Dashboard.css';
import ServerCard from './ServerCard';
import AddServerModal from './AddServerModal';

function Dashboard({ servers, theme, onAddServer, onDeleteServer, apiUrl }) {
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddServer = async (name) => {
    const newServer = await onAddServer(name);
    if (newServer) {
      setShowAddModal(false);
    }
  };

  const onlineServers = servers.filter(s => s.status === 'online').length;
  const totalServers = servers.length;

  return (
    <div className="dashboard">
      <header className="dashboard-header" style={{ color: theme.text }}>
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo" style={{ color: theme.primary }}>
              威软探针
            </h1>
            <p className="subtitle" style={{ color: theme.textSecondary }}>
              VPS监控系统
            </p>
          </div>

          <div className="stats-section">
            <div className="stat-item">
              <span className="stat-label" style={{ color: theme.textSecondary }}>
                总服务器
              </span>
              <span className="stat-value" style={{ color: theme.text }}>
                {totalServers}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label" style={{ color: theme.textSecondary }}>
                在线
              </span>
              <span className="stat-value" style={{ color: theme.success }}>
                {onlineServers}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label" style={{ color: theme.textSecondary }}>
                离线
              </span>
              <span className="stat-value" style={{ color: theme.danger }}>
                {totalServers - onlineServers}
              </span>
            </div>
          </div>

          <button
            className="add-server-btn"
            style={{
              background: theme.primary,
              boxShadow: theme.glow
            }}
            onClick={() => setShowAddModal(true)}
          >
            + 添加服务器
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="servers-grid">
          {servers.map(server => (
            <ServerCard
              key={server.id}
              server={server}
              theme={theme}
              onDelete={onDeleteServer}
              apiUrl={apiUrl}
            />
          ))}

          {servers.length === 0 && (
            <div className="empty-state" style={{ color: theme.textSecondary }}>
              <div className="empty-icon" style={{ color: theme.primary }}>📊</div>
              <h3>暂无服务器</h3>
              <p>点击右上角"添加服务器"开始监控</p>
            </div>
          )}
        </div>
      </main>

      <footer className="dashboard-footer" style={{ color: theme.textSecondary }}>
        <p>Made with ❤️ by 威软探针</p>
      </footer>

      {showAddModal && (
        <AddServerModal
          theme={theme}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddServer}
        />
      )}
    </div>
  );
}

export default Dashboard;
