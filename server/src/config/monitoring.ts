import os from 'os';
import process from 'process';

export const getRuntimeMetrics = () => ({
  uptimeSeconds: Math.floor(process.uptime()),
  memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
  cpuLoad: os.loadavg()[0].toFixed(2),
  timestamp: new Date().toISOString()
});
