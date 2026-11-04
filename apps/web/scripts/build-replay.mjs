// Converts a recorded F1 signal log into the static JSON the browser replayer fetches.
// Usage: yarn replay:build [path/to/signal.log]   (defaults to <repo>/data/f1/signal.log)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const INPUT = path.resolve(process.argv[2] || path.join(REPO_ROOT, 'data', 'f1', 'signal.log'));
const OUTPUT = path.join(REPO_ROOT, 'apps', 'web', 'public', 'replay', 'f1.json');

const REPLAY_TOPICS = new Set([
  'TimingData',
  'TimingAppData',
  'DriverList',
  'RaceControlMessages',
  'SessionData',
  'SessionStatus',
  'TrackStatus',
]);
const SEPARATOR = '----------------------------------------';

if (!fs.existsSync(INPUT)) {
  console.error(`[replay:build] ${INPUT} not found`);
  process.exit(1);
}

const lines = fs.readFileSync(INPUT, 'utf-8').replace(/\r\n/g, '\n').split('\n');
const events = [];

let isInsideBlock = false;
let topic = '';
let time = '';
let jsonLines = [];
let captureJson = false;

for (const line of lines) {
  if (line.trim() === SEPARATOR) {
    if (!isInsideBlock) {
      isInsideBlock = true;
      continue;
    }
    if (topic && jsonLines.length > 0 && REPLAY_TOPICS.has(topic)) {
      try {
        events.push({ time, topic, data: JSON.parse(jsonLines.join('\n')) });
      } catch {
        // Ignore malformed JSON chunks in raw log
      }
    }
    isInsideBlock = false;
    topic = '';
    time = '';
    jsonLines = [];
    captureJson = false;
  } else if (isInsideBlock) {
    if (line.includes('Topic:')) {
      topic = line.match(/Topic:\s*([a-zA-Z0-9_-]+)/)?.[1] ?? topic;
      time = line.match(/\[(20\d{2}-\d{2}-\d{2}T[^\]]+)\]/)?.[1] ?? time;
    }
    if (line.startsWith('Data: {')) {
      captureJson = true;
      jsonLines.push('{');
    } else if (captureJson) {
      jsonLines.push(line);
    }
  }
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(events));
const sizeKb = Math.round(fs.statSync(OUTPUT).size / 1024);
console.log(
  `[replay:build] ${events.length} events -> ${path.relative(REPO_ROOT, OUTPUT)} (${sizeKb} KB)`
);
