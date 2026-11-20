import { createServer } from './server.js';
import { CONFIG } from './config/index.js';
import { pruneOldLogs } from './services/logger.js';

async function main() {
  // Also on start, so a run that never logs (no live session) still clears out old captures
  pruneOldLogs();
  const appInstance = createServer();
  await appInstance.start(CONFIG.PORT);
}

main().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
