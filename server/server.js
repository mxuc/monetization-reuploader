import http from 'node:http';
import { logger } from './logger.js';

let server = null;
const resolvedMappings = [];

export function addMapping(oldId, newId, assetType) {
  const oldStr = String(oldId);
  const newStr = String(newId);
  const exists = resolvedMappings.some(m => m.oldId === oldStr);
  if (!exists) {
    resolvedMappings.push({
      oldId: oldStr,
      newId: newStr,
      assetType
    });
    logger.debug(`Mapped asset ID: ${oldStr} -> ${newStr} (${assetType})`);
  }
}

export function getMappings() {
  return resolvedMappings;
}

export function clearMappings() {
  resolvedMappings.length = 0;
}

export function startServer() {
  return new Promise((resolve, reject) => {
    if (server) {
      resolve();
      return;
    }

    server = http.createServer((req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (req.method === 'GET' && req.url === '/mappings') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ mappings: resolvedMappings }));
      } else if (req.method === 'POST' && req.url === '/clear') {
        clearMappings();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    server.on('error', (err) => {
      logger.failed('Local mapping server failed to start', err.message);
      reject(err);
    });

    server.listen(8082, '127.0.0.1', () => {
      logger.debug('Local mapping server running at http://127.0.0.1:8082');
      resolve();
    });
  });
}

export function stopServer() {
  return new Promise((resolve) => {
    if (!server) {
      resolve();
      return;
    }

    server.close(() => {
      server = null;
      logger.debug('Local mapping server stopped');
      resolve();
    });
  });
}
