import { createServer } from './server.js';
import { CONFIG } from './config/index.js';

async function main() {
  const appInstance = createServer();
  await appInstance.start(CONFIG.PORT);
}

main().catch((err) => {
  console.error('Fatal Server Error:', err);
  process.exit(1);
});
