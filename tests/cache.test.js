import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import cache from '../server/cache.js';

test('Cache system lookup and persistence', async (t) => {
  await t.test('should set and get values correctly', () => {
    const sourceId = 'source_test_1';
    const targetUniverseId = 'target_test_1';
    const mappingDetails = {
      newId: 'new_test_1',
      assetType: 'GamePass',
      name: 'VIP Badge'
    };

    cache.set(sourceId, targetUniverseId, mappingDetails);
    
    const retrieved = cache.get(sourceId, targetUniverseId);
    assert.ok(retrieved, 'Should retrieve mapping');
    assert.strictEqual(retrieved.newId, 'new_test_1');
    assert.strictEqual(retrieved.assetType, 'GamePass');
    assert.strictEqual(retrieved.name, 'VIP Badge');
    assert.ok(retrieved.timestamp);
  });

  await t.test('should return null for non-existent mappings', () => {
    const retrieved = cache.get('nonexistent', 'universe');
    assert.strictEqual(retrieved, null);
  });

  await t.test('should write to mappings.json on set', () => {
    const cachePath = path.resolve('mappings.json');
    assert.ok(fs.existsSync(cachePath), 'mappings.json should exist');

    const content = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    assert.ok(content['source_test_1:target_test_1'], 'Should contain cache key');
    assert.strictEqual(content['source_test_1:target_test_1'].newId, 'new_test_1');
  });
});
