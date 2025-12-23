const WebSocket = require('ws');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// 加载配置
let config;
try {
  config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (error) {
  console.error('❌ 无法加载配置文件:', error.message);
  process.exit(1);
}

let ws;
let reconnectInterval;
let lastNetworkStats = null;
let pingHistory = [];

console.log('=================================');
console.log('🚀 威软探针 - Agent启动中');
console.log('=================================');

function connect() {
  ws = new WebSocket(config.serverUrl);

  ws.on('open', () => {
    console.log('✅ 已连接到控制端');

    // 注册
    ws.send(JSON.stringify({
      type: 'agent_register',
      token: config.token
    }));

    // 开始报告数据
    startReporting();
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'registered') {
        console.log(`📝 注册成功，服务器ID: ${message.serverId}`);
      }
    } catch (error) {
      console.error('处理消息错误:', error);
    }
  });

  ws.on('close', () => {
    console.log('❌ 连接断开，5秒后重连...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (error) => {
    console.error('WebSocket错误:', error.message);
  });
}

async function getSystemInfo() {
  const platform = os.platform();
  const hostname = os.hostname();
  const arch = os.arch();
  const uptime = os.uptime();

  let osVersion = os.release();

  // 尝试获取更详细的系统版本
  if (platform === 'linux') {
    try {
      const { stdout } = await execPromise('cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d \'"\'');
      osVersion = stdout.trim();
    } catch (error) {
      // 使用默认值
    }
  }

  return {
    hostname,
    platform,
    arch,
    osVersion,
    uptime
  };
}

async function getCpuUsage() {
  const cpus = os.cpus();
  const cores = cpus.length;

  // 计算CPU使用率
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach(cpu => {
    for (let type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cores;
  const total = totalTick / cores;
  const usage = 100 - (100 * idle / total);

  return {
    usage: Math.round(usage * 100) / 100,
    cores
  };
}

function getMemoryInfo() {
  const total = os.totalmem();
  const free = os.freemem();
  const used = total - free;

  return {
    total,
    used,
    free,
    usagePercent: Math.round((used / total) * 100 * 100) / 100
  };
}

async function getDiskInfo() {
  try {
    const platform = os.platform();
    let command;

    if (platform === 'linux' || platform === 'darwin') {
      command = 'df -B1 / | tail -1';
    } else if (platform === 'win32') {
      command = 'wmic logicaldisk get size,freespace,caption';
    } else {
      throw new Error('Unsupported platform');
    }

    const { stdout } = await execPromise(command);

    if (platform === 'linux' || platform === 'darwin') {
      const parts = stdout.trim().split(/\s+/);
      const total = parseInt(parts[1]);
      const used = parseInt(parts[2]);

      return {
        total,
        used,
        free: total - used,
        usagePercent: Math.round((used / total) * 100 * 100) / 100
      };
    } else {
      // Windows 处理
      const lines = stdout.trim().split('\n');
      if (lines.length < 2) throw new Error('Invalid output');

      const data = lines[1].trim().split(/\s+/);
      const free = parseInt(data[1]);
      const total = parseInt(data[2]);
      const used = total - free;

      return {
        total,
        used,
        free,
        usagePercent: Math.round((used / total) * 100 * 100) / 100
      };
    }
  } catch (error) {
    console.error('获取磁盘信息失败:', error.message);
    return {
      total: 0,
      used: 0,
      free: 0,
      usagePercent: 0
    };
  }
}

async function getNetworkStats() {
  const interfaces = os.networkInterfaces();
  let totalRx = 0;
  let totalTx = 0;

  try {
    const platform = os.platform();

    if (platform === 'linux') {
      const { stdout } = await execPromise('cat /proc/net/dev');
      const lines = stdout.split('\n');

      for (let line of lines) {
        if (line.includes(':')) {
          const parts = line.trim().split(/\s+/);
          if (parts[0] && !parts[0].startsWith('lo')) {
            totalRx += parseInt(parts[1]) || 0;
            totalTx += parseInt(parts[9]) || 0;
          }
        }
      }
    } else if (platform === 'darwin') {
      const { stdout } = await execPromise('netstat -ib | grep -v lo0');
      const lines = stdout.split('\n');

      for (let line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 7) {
          totalRx += parseInt(parts[6]) || 0;
          totalTx += parseInt(parts[9]) || 0;
        }
      }
    }
  } catch (error) {
    console.error('获取网络统计失败:', error.message);
  }

  // 计算速度
  let upload = 0;
  let download = 0;

  if (lastNetworkStats) {
    const timeDiff = (Date.now() - lastNetworkStats.timestamp) / 1000;
    upload = (totalTx - lastNetworkStats.tx) / timeDiff;
    download = (totalRx - lastNetworkStats.rx) / timeDiff;
  }

  lastNetworkStats = {
    rx: totalRx,
    tx: totalTx,
    timestamp: Date.now()
  };

  return {
    upload,
    download,
    totalUpload: totalTx,
    totalDownload: totalRx
  };
}

async function getPingStats() {
  try {
    const platform = os.platform();
    const target = config.pingTarget || '8.8.8.8';
    let command;

    if (platform === 'win32') {
      command = `ping -n 4 ${target}`;
    } else {
      command = `ping -c 4 ${target}`;
    }

    const { stdout } = await execPromise(command);

    // 解析ping结果
    let latencies = [];
    const lines = stdout.split('\n');

    for (let line of lines) {
      const match = line.match(/time[=<](\d+\.?\d*)/);
      if (match) {
        latencies.push(parseFloat(match[1]));
      }
    }

    if (latencies.length === 0) {
      return { latency: 0, variance: 0 };
    }

    // 计算平均延迟
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;

    // 计算方差（波动）
    const variance = Math.sqrt(
      latencies.reduce((sum, val) => sum + Math.pow(val - avgLatency, 2), 0) / latencies.length
    );

    // 保存历史
    pingHistory.push(avgLatency);
    if (pingHistory.length > 20) {
      pingHistory.shift();
    }

    return {
      latency: Math.round(avgLatency * 100) / 100,
      variance: Math.round(variance * 100) / 100
    };
  } catch (error) {
    console.error('Ping测试失败:', error.message);
    return {
      latency: 0,
      variance: 0
    };
  }
}

async function collectData() {
  try {
    const systemInfo = await getSystemInfo();
    const cpu = await getCpuUsage();
    const memory = getMemoryInfo();
    const disk = await getDiskInfo();
    const network = await getNetworkStats();
    const ping = await getPingStats();

    return {
      systemInfo,
      monitoring: {
        cpu,
        memory,
        disk,
        network,
        ping
      }
    };
  } catch (error) {
    console.error('数据收集错误:', error);
    return null;
  }
}

function startReporting() {
  if (reconnectInterval) {
    clearInterval(reconnectInterval);
  }

  reconnectInterval = setInterval(async () => {
    if (ws.readyState === WebSocket.OPEN) {
      const data = await collectData();

      if (data) {
        ws.send(JSON.stringify({
          type: 'agent_data',
          ...data
        }));

        // 显示简要状态
        const { monitoring } = data;
        console.log(`📊 CPU: ${monitoring.cpu.usage.toFixed(1)}% | 内存: ${monitoring.memory.usagePercent.toFixed(1)}% | 磁盘: ${monitoring.disk.usagePercent.toFixed(1)}% | Ping: ${monitoring.ping.latency}ms`);
      }
    }
  }, config.reportInterval || 3000);
}

// 优雅退出
process.on('SIGINT', () => {
  console.log('\n正在关闭Agent...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n正在关闭Agent...');
  if (ws) {
    ws.close();
  }
  process.exit(0);
});

// 启动连接
connect();
