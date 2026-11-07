// Converts recorded F1 feed logs into the static JSON the browser replayer fetches.
// Usage:
//   yarn replay:build [path/to/signal.log]  one combined log (default <repo>/data/f1/signal.log)
//   yarn replay:build --logs <YYYY-MM-DD>   the per-topic day logs apps/server records to
//                                           <repo>/logs/<Topic>/<date>.log, merged in time order
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DEFAULT_INPUT = path.join(REPO_ROOT, 'data', 'f1', 'signal.log');
const LOGS_DIR = path.join(REPO_ROOT, 'logs');
const OUTPUT = path.join(REPO_ROOT, 'apps', 'web', 'public', 'replay', 'f1.json');

// Topics the dashboard reads (Heartbeat and the rest stay out to keep the file small). The order
// breaks ties when day logs are merged: who and what the session is lands before the timing
const REPLAY_TOPICS = [
  'DriverList',
  'SessionInfo',
  'SessionStatus',
  'SessionData',
  'TrackStatus',
  'LapCount',
  'ExtrapolatedClock',
  'WeatherData',
  'TimingAppData',
  'TimingData',
  'RaceControlMessages',
];
const SEPARATOR = '----------------------------------------';

const fail = (message) => {
  console.error(`[replay:build] ${message}`);
  process.exit(1);
};

/** Parses one log in the recorder's block format into { time, topic, data } events */
function parseLog(text) {
  const events = [];
  let isInsideBlock = false;
  let topic = '';
  let time = '';
  let jsonLines = [];
  let captureJson = false;

  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    if (line.trim() === SEPARATOR) {
      if (!isInsideBlock) {
        isInsideBlock = true;
        continue;
      }
      if (topic && jsonLines.length > 0 && REPLAY_TOPICS.includes(topic)) {
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
  return events;
}

/** Every topic's log for one day, merged back into the order the messages arrived */
function readDayLogs(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) {
    fail('--logs needs a date, e.g. yarn replay:build --logs 2026-10-11');
  }
  const tagged = [];
  for (const [rank, topic] of REPLAY_TOPICS.entries()) {
    const file = path.join(LOGS_DIR, topic, `${date}.log`);
    if (!fs.existsSync(file)) continue;
    for (const event of parseLog(fs.readFileSync(file, 'utf-8'))) {
      tagged.push({ at: Date.parse(event.time), rank, event });
    }
  }
  if (tagged.length === 0) fail(`no logs for ${date} in ${path.relative(REPO_ROOT, LOGS_DIR)}/`);
  tagged.sort((a, b) => a.at - b.at || a.rank - b.rank);
  return tagged.map((t) => t.event);
}

const args = process.argv.slice(2);
const logsFlag = args.indexOf('--logs');
let events;
let source;

if (logsFlag !== -1) {
  const date = args[logsFlag + 1];
  events = readDayLogs(date);
  source = `logs/*/${date}.log`;
} else {
  const input = path.resolve(args[0] || DEFAULT_INPUT);
  if (!fs.existsSync(input)) fail(`${input} not found`);
  events = parseLog(fs.readFileSync(input, 'utf-8'));
  source = path.relative(REPO_ROOT, input);
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(events));
const sizeKb = Math.round(fs.statSync(OUTPUT).size / 1024);
const span = events.length ? `, ${events[0].time} → ${events.at(-1).time}` : '';
console.log(
  `[replay:build] ${source}: ${events.length} events${span} -> ${path.relative(REPO_ROOT, OUTPUT)} (${sizeKb} KB)`
);
