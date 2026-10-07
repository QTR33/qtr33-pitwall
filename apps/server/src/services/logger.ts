import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/index.js';

export function logSignal(topic: string, data: unknown) {
  const now = new Date();
  const timestamp = now.toISOString();
  const dateStr = timestamp.split('T')[0];
  const safeTopic = topic.replace(/[^a-zA-Z0-9_-]/g, '');

  try {
    const topicDir = path.join(CONFIG.LOGS_DIR, safeTopic);
    if (!fs.existsSync(topicDir)) {
      fs.mkdirSync(topicDir, { recursive: true });
    }

    const logMessage =
      `\n----------------------------------------\n` +
      `⚡ [${timestamp}] [SIGNAL CAUGHT] Topic: ${topic}\n` +
      `Data: ${JSON.stringify(data, null, 2)}\n` +
      `----------------------------------------\n`;

    const logFile = path.join(topicDir, `${dateStr}.log`);
    fs.appendFileSync(logFile, logMessage);
  } catch (err) {
    console.error('Logger error:', err);
  }
}
