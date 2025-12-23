import React, { useState } from 'react';
import './ServerCard.css';

function ServerCard({ server, theme, onDelete, apiUrl }) {
  const [showToken, setShowToken] = useState(false);
  const [showInstallScript, setShowInstallScript] = useState(false);

  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond) => {
    if (!bytesPerSecond) return '0 B/s';
    return formatBytes(bytesPerSecond) + '/s';
  };

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}天 ${hours}小时`;
  };

  const getStatusColor = () => {
    return server.status === 'online' ? theme.success : theme.danger;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('已复制到剪贴板！');
  };

  const getInstallCommand = () => {
    const host = window.location.hostname;
    return `curl -fsSL http://${host}:3001/api/servers/${server.id}/install-script | bash`;
  };

  const stats = server.latestStats || {};
  const info = server.systemInfo || {};

  return (
    <div
      className="server-card"
      style={{
        background: theme.cardBg,
        borderColor: theme.cardBorder,
        boxShadow: theme.shadow,
        backdropFilter: 'blur(10px)'
      }}
    >
      <div className="card-header">
        <div className="server-info">
          <h3 className="server-name" style={{ color: theme.text }}>
            {server.name}
          </h3>
          <div className="server-status">
            <span
              className="status-indicator"
              style={{ background: getStatusColor() }}
            />
            <span style={{ color: theme.textSecondary }}>
              {server.status === 'online' ? '在线' : '离线'}
            </span>
          </div>
        </div>

        <button
          className="delete-btn"
          onClick={() => {
            if (window.confirm(`确定删除服务器 "${server.name}" 吗？`)) {
              onDelete(server.id);
            }
          }}
          style={{ color: theme.danger }}
        >
          ×
        </button>
      </div>

      {server.status === 'online' && (
        <>
          <div className="card-section">
            <h4 className="section-title" style={{ color: theme.textSecondary }}>
              系统信息
            </h4>
            <div className="info-grid">
              <div className="info-item">
                <span style={{ color: theme.textSecondary }}>主机名:</span>
                <span style={{ color: theme.text }}>{info.hostname || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span style={{ color: theme.textSecondary }}>系统:</span>
                <span style={{ color: theme.text }}>{info.platform || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span style={{ color: theme.textSecondary }}>架构:</span>
                <span style={{ color: theme.text }}>{info.arch || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span style={{ color: theme.textSecondary }}>运行时间:</span>
                <span style={{ color: theme.text }}>{formatUptime(info.uptime)}</span>
              </div>
            </div>
          </div>

          <div className="card-section">
            <h4 className="section-title" style={{ color: theme.textSecondary }}>
              资源使用
            </h4>

            <div className="metric">
              <div className="metric-header">
                <span style={{ color: theme.text }}>CPU</span>
                <span style={{ color: theme.primary }}>
                  {stats.cpu_usage?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${stats.cpu_usage || 0}%`,
                    background: theme.primary
                  }}
                />
              </div>
              <span className="metric-detail" style={{ color: theme.textSecondary }}>
                {stats.cpu_cores || 0} 核心
              </span>
            </div>

            <div className="metric">
              <div className="metric-header">
                <span style={{ color: theme.text }}>内存</span>
                <span style={{ color: theme.secondary }}>
                  {((stats.memory_used / stats.memory_total) * 100)?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${(stats.memory_used / stats.memory_total) * 100 || 0}%`,
                    background: theme.secondary
                  }}
                />
              </div>
              <span className="metric-detail" style={{ color: theme.textSecondary }}>
                {formatBytes(stats.memory_used)} / {formatBytes(stats.memory_total)}
              </span>
            </div>

            <div className="metric">
              <div className="metric-header">
                <span style={{ color: theme.text }}>硬盘</span>
                <span style={{ color: theme.accent }}>
                  {((stats.disk_used / stats.disk_total) * 100)?.toFixed(1) || 0}%
                </span>
              </div>
              <div className="progress-bar" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div
                  className="progress-fill"
                  style={{
                    width: `${(stats.disk_used / stats.disk_total) * 100 || 0}%`,
                    background: theme.accent
                  }}
                />
              </div>
              <span className="metric-detail" style={{ color: theme.textSecondary }}>
                {formatBytes(stats.disk_used)} / {formatBytes(stats.disk_total)}
              </span>
            </div>
          </div>

          <div className="card-section">
            <h4 className="section-title" style={{ color: theme.textSecondary }}>
              网络状态
            </h4>

            <div className="network-grid">
              <div className="network-item">
                <span style={{ color: theme.textSecondary }}>上传:</span>
                <span style={{ color: theme.success }}>
                  {formatSpeed(stats.network_upload)}
                </span>
              </div>
              <div className="network-item">
                <span style={{ color: theme.textSecondary }}>下载:</span>
                <span style={{ color: theme.primary }}>
                  {formatSpeed(stats.network_download)}
                </span>
              </div>
              <div className="network-item">
                <span style={{ color: theme.textSecondary }}>延迟:</span>
                <span style={{ color: theme.warning }}>
                  {stats.ping?.toFixed(1) || 0} ms
                </span>
              </div>
              <div className="network-item">
                <span style={{ color: theme.textSecondary }}>波动:</span>
                <span style={{ color: theme.textSecondary }}>
                  ±{stats.ping_variance?.toFixed(1) || 0} ms
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="card-actions">
        <button
          className="action-btn"
          onClick={() => setShowToken(!showToken)}
          style={{ background: theme.primary, color: 'white' }}
        >
          {showToken ? '隐藏' : '显示'} Token
        </button>
        <button
          className="action-btn"
          onClick={() => setShowInstallScript(!showInstallScript)}
          style={{ background: theme.secondary, color: 'white' }}
        >
          安装命令
        </button>
      </div>

      {showToken && (
        <div
          className="token-display"
          style={{ background: 'rgba(0,0,0,0.3)', color: theme.text }}
        >
          <code>{server.token}</code>
          <button
            className="copy-btn"
            onClick={() => copyToClipboard(server.token)}
            style={{ color: theme.primary }}
          >
            复制
          </button>
        </div>
      )}

      {showInstallScript && (
        <div
          className="install-display"
          style={{ background: 'rgba(0,0,0,0.3)', color: theme.text }}
        >
          <code>{getInstallCommand()}</code>
          <button
            className="copy-btn"
            onClick={() => copyToClipboard(getInstallCommand())}
            style={{ color: theme.primary }}
          >
            复制
          </button>
        </div>
      )}
    </div>
  );
}

export default ServerCard;
