import fs from 'node:fs';
import path from 'node:path';
import { logger } from './logger.js';

const CACHE_FILE = 'mappings.json';

class MappingCache {
  constructor() {
    this.cachePath = path.resolve(CACHE_FILE);
    this.mappings = {};
    this.load();
  }

  load() {
    if (!fs.existsSync(this.cachePath)) {
      this.mappings = {};
      return;
    }

    try {
      const content = fs.readFileSync(this.cachePath, 'utf8');
      this.mappings = JSON.parse(content) || {};
      logger.debug(`Loaded ${Object.keys(this.mappings).length} mappings from cache file.`);
    } catch (err) {
      logger.debug(`Failed to read/parse cache file, starting fresh:`, err.message);
      this.mappings = {};
    }
  }

  save() {
    try {
      fs.writeFileSync(this.cachePath, JSON.stringify(this.mappings, null, 2), 'utf8');
      logger.debug('Saved mappings to cache file.');
    } catch (err) {
      logger.debug('Failed to save mappings cache file:', err.message);
    }
  }

  _getKey(sourceId, targetUniverseId) {
    return `${sourceId}:${targetUniverseId}`;
  }

  get(sourceId, targetUniverseId) {
    const key = this._getKey(sourceId, targetUniverseId);
    return this.mappings[key] || null;
  }

  set(sourceId, targetUniverseId, { newId, assetType, name }) {
    const key = this._getKey(sourceId, targetUniverseId);
    this.mappings[key] = {
      newId: String(newId),
      assetType,
      timestamp: new Date().toISOString(),
      name: name || ''
    };
    this.save();
  }
}

export const cache = new MappingCache();
export default cache;
