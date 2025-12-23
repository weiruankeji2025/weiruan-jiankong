# 威软探针 - 注意事项

## ⚠️ 重要提醒

### 安全相关

#### 1. Token安全
- ✅ **务必修改默认Token**: 安装后立即修改 `server/.env` 中的 `ADMIN_TOKEN`
- ✅ **Token保密**: 不要将Token提交到公开仓库
- ✅ **定期更换**: 建议每3个月更换一次Token
- ✅ **强度要求**: Token应至少64位，包含字母、数字和特殊字符

#### 2. 网络安全
- ⚠️ **生产环境必须使用HTTPS**: 配置SSL证书保护数据传输
- ⚠️ **限制访问IP**: 使用防火墙限制只有必要的IP可以访问
- ⚠️ **Nginx配置**: 建议使用Nginx作为反向代理，不要直接暴露Node.js端口
- ⚠️ **WebSocket加密**: 生产环境使用 `wss://` 而不是 `ws://`

#### 3. 服务器权限
- ⚠️ **Agent需要root权限**: Agent需要读取系统信息，必须以root身份运行
- ⚠️ **最小权限原则**: 控制端可以使用非root用户运行（推荐）
- ⚠️ **文件权限**: 确保配置文件只有管理员可读写

```bash
# 设置正确的文件权限
sudo chmod 600 /opt/weiruan-agent/config.json
sudo chmod 600 /opt/weiruan-jiankong/server/.env
```

---

## 🔧 性能优化

### 1. 数据库优化

#### 定期清理旧数据
```bash
# 每周自动清理超过7天的数据
echo "0 2 * * 0 curl -X POST http://localhost:3001/api/cleanup -H 'Content-Type: application/json' -d '{\"days\": 7}'" | sudo crontab -
```

#### 数据库备份
```bash
# 每天备份数据库
echo "0 3 * * * cp /opt/weiruan-jiankong/server/weiruan.db /backup/weiruan-$(date +\%Y\%m\%d).db" | sudo crontab -
```

### 2. 采集频率调整

根据实际需求调整采集频率：

- **高频监控**（1-3秒）: 适用于关键业务服务器
- **标准监控**（3-5秒）: 适用于一般服务器
- **低频监控**（10-30秒）: 适用于监控项较少的场景

修改 `/opt/weiruan-agent/config.json`:
```json
{
  "reportInterval": 3000  // 单位：毫秒
}
```

### 3. 控制端性能

#### 资源限制
对于大量Agent连接（100+），建议：
- CPU: 2核心+
- 内存: 2GB+
- 使用SSD存储

#### Node.js优化
```bash
# 在 systemd 服务文件中添加
Environment="NODE_OPTIONS=--max-old-space-size=2048"
```

---

## 🌐 网络配置

### 1. 防火墙配置

#### Ubuntu/Debian (UFW)
```bash
# 允许控制端端口
sudo ufw allow 3001/tcp comment 'WeiRuan API'
sudo ufw allow 3002/tcp comment 'WeiRuan WebSocket'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'

# 如果使用Nginx，可以关闭直接访问
# sudo ufw deny 3001/tcp
# sudo ufw deny 3002/tcp
```

#### CentOS/RHEL (firewalld)
```bash
sudo firewall-cmd --permanent --add-port=3001/tcp
sudo firewall-cmd --permanent --add-port=3002/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

### 2. 云服务器安全组

如果使用云服务器（阿里云、腾讯云、AWS等），需要在安全组中开放：
- 入站规则：3001、3002、80、443
- 出站规则：允许所有（或至少允许访问Agent）

### 3. NAT穿透

如果Agent在NAT后面无法连接：
1. 使用公网IP部署控制端
2. 配置端口转发
3. 或使用VPN打通网络

---

## 💾 数据备份

### 自动备份脚本

创建备份脚本 `/opt/weiruan-jiankong/backup.sh`:
```bash
#!/bin/bash
BACKUP_DIR="/backup/weiruan"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# 备份数据库
cp /opt/weiruan-jiankong/server/weiruan.db $BACKUP_DIR/weiruan_$DATE.db

# 备份配置文件
cp /opt/weiruan-jiankong/server/.env $BACKUP_DIR/env_$DATE.bak

# 删除30天前的备份
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.bak" -mtime +30 -delete

echo "Backup completed: $DATE"
```

设置定时任务：
```bash
sudo chmod +x /opt/weiruan-jiankong/backup.sh
echo "0 4 * * * /opt/weiruan-jiankong/backup.sh >> /var/log/weiruan-backup.log 2>&1" | sudo crontab -
```

---

## 🚨 监控告警（计划功能）

当前版本不包含告警功能，但可以通过以下方式实现：

### 1. 使用Shell脚本监控

```bash
#!/bin/bash
# 检查服务状态
if ! systemctl is-active --quiet weiruan-probe; then
    echo "威软探针服务已停止！" | mail -s "告警：服务异常" admin@example.com
fi
```

### 2. 集成第三方告警

可以通过Webhook集成：
- 钉钉机器人
- 企业微信
- Slack
- Telegram

---

## 🔄 升级注意事项

### 升级前

1. ✅ **备份数据库**
```bash
cp /opt/weiruan-jiankong/server/weiruan.db /backup/weiruan-before-upgrade.db
```

2. ✅ **备份配置文件**
```bash
cp /opt/weiruan-jiankong/server/.env /backup/env-before-upgrade.bak
```

3. ✅ **记录当前版本**
```bash
cd /opt/weiruan-jiankong
git log -1
```

### 升级后

1. ✅ **检查服务状态**
```bash
sudo systemctl status weiruan-probe
```

2. ✅ **查看日志**
```bash
sudo journalctl -u weiruan-probe -n 50
```

3. ✅ **验证功能**
- 访问控制面板
- 检查Agent连接状态
- 验证数据更新

### 回滚方案

如果升级失败：
```bash
cd /opt/weiruan-jiankong
git reset --hard <previous-commit-hash>
npm install
sudo systemctl restart weiruan-probe
```

---

## 🐛 常见问题

### 1. Agent显示离线但实际在运行

**原因**: 网络波动、WebSocket连接断开

**解决**:
```bash
# 重启Agent
sudo systemctl restart weiruan-agent

# 检查网络连接
ping your-control-server
telnet your-control-server 3002
```

### 2. CPU/内存数据不准确

**原因**: 系统命令权限不足或不兼容

**解决**:
```bash
# 确保Agent以root运行
sudo systemctl edit weiruan-agent
# 添加 User=root

# 检查系统命令
free -h
df -h
top -bn1
```

### 3. 磁盘空间占用过大

**原因**: 监控数据积累过多

**解决**:
```bash
# 清理旧数据
curl -X POST http://localhost:3001/api/cleanup \
  -H "Content-Type: application/json" \
  -d '{"days": 3}'

# 检查数据库大小
du -h /opt/weiruan-jiankong/server/weiruan.db
```

### 4. WebSocket连接频繁断开

**原因**: Nginx超时配置、网络不稳定

**解决**:
在Nginx配置中添加：
```nginx
location /ws {
    proxy_pass http://localhost:3002;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    # 增加超时时间
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    # 心跳保持
    proxy_connect_timeout 60s;
}
```

---

## 📊 资源消耗参考

### 控制端

| Agent数量 | CPU使用 | 内存使用 | 磁盘增长 |
|----------|---------|---------|----------|
| 1-10     | ~5%     | ~200MB  | ~10MB/天 |
| 10-50    | ~10%    | ~500MB  | ~50MB/天 |
| 50-100   | ~20%    | ~1GB    | ~100MB/天|
| 100+     | ~30%+   | ~2GB+   | ~200MB/天|

### Agent

- CPU: <1%
- 内存: ~50MB
- 网络: ~1KB/s (3秒采集间隔)

---

## 🔐 生产环境清单

部署到生产环境前，请确认：

- [ ] 已修改默认Token
- [ ] 已配置HTTPS/WSS
- [ ] 已设置防火墙规则
- [ ] 已配置自动备份
- [ ] 已设置数据自动清理
- [ ] 已配置Nginx反向代理
- [ ] 已测试Agent连接
- [ ] 已验证监控数据准确性
- [ ] 已准备回滚方案
- [ ] 已配置日志轮转

---

## 📞 技术支持

如遇到问题，请：

1. 查看日志：`journalctl -u weiruan-probe -n 100`
2. 检查文档：查阅 `docs/` 目录
3. 搜索Issue：检查是否有类似问题
4. 提交Issue：提供详细的错误信息和环境描述

---

## 📝 最佳实践

### 1. 命名规范

服务器命名建议：
- 生产服务器: `prod-web-01`, `prod-db-01`
- 测试服务器: `test-api-01`
- 开发服务器: `dev-server-01`

### 2. 监控策略

- **关键业务**: 3秒采集间隔，保留30天数据
- **一般服务**: 5秒采集间隔，保留7天数据
- **测试环境**: 10秒采集间隔，保留3天数据

### 3. 维护计划

- 每周检查服务状态
- 每月检查磁盘空间
- 每季度更新系统和依赖
- 每半年进行安全审计

---

Made with ❤️ by 威软探针
