const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

let db;

function init() {
  db = new Database(path.join(__dirname, 'weiruan.db'));

  // 创建服务器表
  db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      last_seen INTEGER DEFAULT 0,
      status TEXT DEFAULT 'offline'
    )
  `);

  // 创建监控数据表
  db.exec(`
    CREATE TABLE IF NOT EXISTS monitoring_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT NOT NULL,
      timestamp INTEGER DEFAULT (strftime('%s', 'now')),
      cpu_usage REAL,
      cpu_cores INTEGER,
      memory_total INTEGER,
      memory_used INTEGER,
      disk_total INTEGER,
      disk_used INTEGER,
      network_upload REAL,
      network_download REAL,
      network_total_upload INTEGER,
      network_total_download INTEGER,
      ping REAL,
      ping_variance REAL,
      FOREIGN KEY (server_id) REFERENCES servers(id)
    )
  `);

  // 创建系统信息表
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_info (
      server_id TEXT PRIMARY KEY,
      hostname TEXT,
      platform TEXT,
      arch TEXT,
      os_version TEXT,
      uptime INTEGER,
      FOREIGN KEY (server_id) REFERENCES servers(id)
    )
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_monitoring_server_time
    ON monitoring_data(server_id, timestamp DESC)
  `);

  console.log('✅ 数据库初始化完成');
}

function createServer(name) {
  const id = uuidv4();
  const token = uuidv4();

  const stmt = db.prepare(`
    INSERT INTO servers (id, name, token)
    VALUES (?, ?, ?)
  `);

  stmt.run(id, name, token);

  return { id, name, token };
}

function getServerByToken(token) {
  const stmt = db.prepare('SELECT * FROM servers WHERE token = ?');
  return stmt.get(token);
}

function getAllServers() {
  const stmt = db.prepare('SELECT * FROM servers ORDER BY created_at DESC');
  return stmt.all();
}

function updateServerStatus(serverId, status) {
  const stmt = db.prepare(`
    UPDATE servers
    SET status = ?, last_seen = strftime('%s', 'now')
    WHERE id = ?
  `);
  stmt.run(status, serverId);
}

function deleteServer(serverId) {
  const stmt = db.prepare('DELETE FROM servers WHERE id = ?');
  stmt.run(serverId);

  // 清理相关数据
  db.prepare('DELETE FROM monitoring_data WHERE server_id = ?').run(serverId);
  db.prepare('DELETE FROM system_info WHERE server_id = ?').run(serverId);
}

function saveMonitoringData(serverId, data) {
  const stmt = db.prepare(`
    INSERT INTO monitoring_data (
      server_id, cpu_usage, cpu_cores, memory_total, memory_used,
      disk_total, disk_used, network_upload, network_download,
      network_total_upload, network_total_download, ping, ping_variance
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    serverId,
    data.cpu?.usage || 0,
    data.cpu?.cores || 0,
    data.memory?.total || 0,
    data.memory?.used || 0,
    data.disk?.total || 0,
    data.disk?.used || 0,
    data.network?.upload || 0,
    data.network?.download || 0,
    data.network?.totalUpload || 0,
    data.network?.totalDownload || 0,
    data.ping?.latency || 0,
    data.ping?.variance || 0
  );
}

function saveSystemInfo(serverId, info) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO system_info
    (server_id, hostname, platform, arch, os_version, uptime)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    serverId,
    info.hostname,
    info.platform,
    info.arch,
    info.osVersion,
    info.uptime
  );
}

function getServerStats(serverId, limit = 100) {
  const stmt = db.prepare(`
    SELECT * FROM monitoring_data
    WHERE server_id = ?
    ORDER BY timestamp DESC
    LIMIT ?
  `);
  return stmt.all(serverId, limit);
}

function getSystemInfo(serverId) {
  const stmt = db.prepare('SELECT * FROM system_info WHERE server_id = ?');
  return stmt.get(serverId);
}

function cleanOldData(daysToKeep = 7) {
  const cutoffTime = Math.floor(Date.now() / 1000) - (daysToKeep * 24 * 60 * 60);
  const stmt = db.prepare('DELETE FROM monitoring_data WHERE timestamp < ?');
  const result = stmt.run(cutoffTime);
  return result.changes;
}

module.exports = {
  init,
  createServer,
  getServerByToken,
  getAllServers,
  updateServerStatus,
  deleteServer,
  saveMonitoringData,
  saveSystemInfo,
  getServerStats,
  getSystemInfo,
  cleanOldData
};
