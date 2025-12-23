import React, { useState } from 'react';
import './AddServerModal.css';

function AddServerModal({ theme, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入服务器名称');
      return;
    }

    setLoading(true);
    await onAdd(name);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: theme.cardBg,
          borderColor: theme.cardBorder,
          backdropFilter: 'blur(20px)'
        }}
      >
        <div className="modal-header">
          <h2 style={{ color: theme.text }}>添加服务器</h2>
          <button
            className="modal-close"
            onClick={onClose}
            style={{ color: theme.text }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label style={{ color: theme.textSecondary }}>服务器名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 生产服务器 1"
              autoFocus
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderColor: theme.cardBorder,
                color: theme.text
              }}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: theme.text
              }}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-submit"
              disabled={loading}
              style={{
                background: theme.primary,
                color: 'white'
              }}
            >
              {loading ? '创建中...' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddServerModal;
