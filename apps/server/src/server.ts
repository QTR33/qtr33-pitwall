import http from 'http';
import express from 'express';
import cors from 'cors';
import { CONFIG } from './config/index.js';
import { REGISTERED_SERIES } from '@livetiming/shared';
import { SeriesProvider } from './providers/base-provider.js';
import { F1SeriesAdapter } from './providers/f1/f1-adapter.js';
import { LiveTimingWebSocketServer } from './services/ws-server.js';

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const server = http.createServer(app);

  // Initialize providers
  const f1Adapter = new F1SeriesAdapter();
  const providers: Record<string, SeriesProvider> = {
    f1: f1Adapter,
  };

  let activeProvider: SeriesProvider = f1Adapter;
  const wsServer = new LiveTimingWebSocketServer(server, activeProvider);

  // REST API Routes
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), series: activeProvider.name });
  });

  app.get('/api/series', (_req, res) => {
    res.json(REGISTERED_SERIES);
  });

  app.get('/api/state', (_req, res) => {
    res.json(activeProvider.getState());
  });

  app.get('/api/drivers', (_req, res) => {
    res.json(activeProvider.getState().drivers);
  });

  app.get('/api/race-control', (_req, res) => {
    res.json(activeProvider.getState().raceControl);
  });

  app.post('/api/series/switch', async (req, res) => {
    const { seriesId } = req.body;
    if (providers[seriesId]) {
      activeProvider = providers[seriesId];
      wsServer.setProvider(activeProvider);
      await activeProvider.start();
      res.json({ success: true, activeSeries: seriesId });
    } else {
      res.status(404).json({ error: `Series ${seriesId} not found or not yet implemented` });
    }
  });

  return {
    app,
    server,
    activeProvider,
    wsServer,
    start: async (port: number = CONFIG.PORT) => {
      await activeProvider.start();
      return new Promise<void>((resolve) => {
        server.listen(port, () => {
          console.log(`\n======================================================`);
          console.log(`🏎️  MOTORSPORT LIVE TIMING SERVER RUNNING ON PORT ${port}`);
          console.log(`📡 WebSocket endpoint: ws://localhost:${port}/ws`);
          console.log(`🌐 HTTP API endpoint:   http://localhost:${port}/api/state`);
          console.log(`======================================================\n`);
          resolve();
        });
      });
    },
  };
}
