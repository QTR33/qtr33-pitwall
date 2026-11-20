import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/index.js';

// Captures are one file per topic and UTC day (logs/<Topic>/<YYYY-MM-DD>.log); only the most recent
// months are kept, so a season of TimingData doesn't pile up on disk
const RETENTION_MONTHS = 2;
const DAY_FILE = /^(\d{4}-\d{2}-\d{2})\.log$/;

// The day the last prune ran for, so it runs once per day rather than on every signal
let prunedForDate = '';

/** The oldest day still kept, as YYYY-MM-DD: the same date RETENTION_MONTHS calendar months ago */
function retentionCutoff(now: Date): string {
  const cutoff = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - RETENTION_MONTHS, now.getUTCDate())
  );
  return cutoff.toISOString().split('T')[0];
}

/** Deletes day files older than the retention window, and topic folders left empty by it */
export function pruneOldLogs(now: Date = new Date()): void {
  prunedForDate = now.toISOString().split('T')[0];
  const cutoff = retentionCutoff(now);

  let topics: fs.Dirent[];
  try {
    topics = fs.readdirSync(CONFIG.LOGS_DIR, { withFileTypes: true });
  } catch {
    return; // Nothing logged yet
  }

  for (const topic of topics) {
    if (!topic.isDirectory()) continue;
    const topicDir = path.join(CONFIG.LOGS_DIR, topic.name);
    try {
      const files = fs.readdirSync(topicDir);
      let kept = 0;
      for (const file of files) {
        const day = DAY_FILE.exec(file)?.[1];
        // Dates in YYYY-MM-DD compare correctly as strings. Anything that isn't a day file is left alone
        if (day && day < cutoff) {
          fs.unlinkSync(path.join(topicDir, file));
        } else {
          kept++;
        }
      }
      if (kept === 0) fs.rmdirSync(topicDir);
    } catch (err) {
      console.error(`Logger: could not prune ${topicDir}:`, err);
    }
  }
}

export function logSignal(topic: string, data: unknown) {
  const now = new Date();
  const timestamp = now.toISOString();
  const dateStr = timestamp.split('T')[0];
  const safeTopic = topic.replace(/[^a-zA-Z0-9_-]/g, '');

  // First signal of a new day: drop the day that just fell out of the window
  if (dateStr !== prunedForDate) pruneOldLogs(now);

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
