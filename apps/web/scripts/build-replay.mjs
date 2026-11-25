// Converts recorded F1 feed logs into the static JSON the browser replayer fetches.
// Usage:
//   yarn replay:build [path/to/signal.log]  one combined log (default <repo>/data/f1/signal.log)
//   yarn replay:build --logs <YYYY-MM-DD>   the per-topic day logs apps/server records to
//                                           <repo>/logs/<Topic>/<date>.log, merged in time order
// Options:
//   --from <ISO time>  --to <ISO time>      keep only the events recorded in this window, e.g. one
//                                           session out of a day's logs. Start it on a keyframe
//                                           (the full state the feed sends on connect) so the
//                                           recording plays on its own
//   --out <name>                            write public/replay/<name>.json instead of f1.json;
//                                           development plays it with ?replay=<name> or VITE_REPLAY
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const DEFAULT_INPUT = path.join(REPO_ROOT, 'data', 'f1', 'signal.log');
const LOGS_DIR = path.join(REPO_ROOT, 'logs');
const REPLAY_DIR = path.join(REPO_ROOT, 'apps', 'web', 'public', 'replay');

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
/** The value after a flag (removed from args, so what is left is the input path), or null */
const takeOption = (flag) => {
  const at = args.indexOf(flag);
  if (at === -1) return null;
  const value = args[at + 1];
  if (!value || value.startsWith('--')) fail(`${flag} needs a value`);
  args.splice(at, 2);
  return value;
};
/** An ISO time option as ms, or null */
const takeTime = (flag) => {
  const value = takeOption(flag);
  if (value === null) return null;
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) fail(`${flag} needs an ISO time, e.g. 2026-11-07T15:05:23Z (got ${value})`);
  return ms;
};

const logsDate = takeOption('--logs');
const from = takeTime('--from');
const to = takeTime('--to');
const outName = takeOption('--out') ?? 'f1';
// The name becomes a URL path segment in the browser: keep it to plain characters
if (!/^[a-z0-9-]+$/.test(outName)) fail('--out takes lowercase letters, digits and dashes');
const OUTPUT = path.join(REPLAY_DIR, `${outName}.json`);

let events;
let source;

if (logsDate !== null) {
  events = readDayLogs(logsDate);
  source = `logs/*/${logsDate}.log`;
} else {
  const input = path.resolve(args[0] || DEFAULT_INPUT);
  if (!fs.existsSync(input)) fail(`${input} not found`);
  events = parseLog(fs.readFileSync(input, 'utf-8'));
  source = path.relative(REPO_ROOT, input);
}

if (from !== null || to !== null) {
  events = events.filter((e) => {
    const at = Date.parse(e.time);
    return (from === null || at >= from) && (to === null || at <= to);
  });
  if (events.length === 0) fail('no events recorded between --from and --to');
}

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, JSON.stringify(events));
const sizeKb = Math.round(fs.statSync(OUTPUT).size / 1024);
const span = events.length ? `, ${events[0].time} → ${events.at(-1).time}` : '';
console.log(
  `[replay:build] ${source}: ${events.length} events${span} -> ${path.relative(REPO_ROOT, OUTPUT)} (${sizeKb} KB)`
);
