import test from 'node:test';
import assert from 'node:assert';
import { startServer, stopServer, addMapping, getMappings, clearMappings } from '../server/server.js';

test('Local Mapping Server Tests', async (t) => {
  t.beforeEach(async () => {
    clearMappings();
    await startServer();
  });

  t.afterEach(async () => {
    await stopServer();
    clearMappings();
  });

  await t.test('should start server and respond to /mappings GET request', async () => {
    const res = await fetch('http://127.0.0.1:8082/mappings');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/json');
    assert.strictEqual(res.headers.get('access-control-allow-origin'), '*');

    const data = await res.json();
    assert.ok(data.mappings);
    assert.strictEqual(data.mappings.length, 0);
  });

  await t.test('should dynamically serve registered mappings', async () => {
    addMapping('12345', '67890', 'GamePass');
    addMapping('11111', '22222', 'DeveloperProduct');

    const res = await fetch('http://127.0.0.1:8082/mappings');
    assert.strictEqual(res.status, 200);
    
    const data = await res.json();
    assert.strictEqual(data.mappings.length, 2);
    
    assert.deepStrictEqual(data.mappings[0], {
      oldId: '12345',
      newId: '67890',
      assetType: 'GamePass'
    });
    
    assert.deepStrictEqual(data.mappings[1], {
      oldId: '11111',
      newId: '22222',
      assetType: 'DeveloperProduct'
    });
  });

  await t.test('should not register duplicate old IDs', async () => {
    addMapping('55555', '66666', 'GamePass');
    addMapping('55555', '77777', 'GamePass');

    const mappings = getMappings();
    assert.strictEqual(mappings.length, 1);
    assert.strictEqual(mappings[0].newId, '66666');
  });

  await t.test('should clear mappings when POST /clear is requested', async () => {
    addMapping('12345', '67890', 'GamePass');
    
    const clearRes = await fetch('http://127.0.0.1:8082/clear', { method: 'POST' });
    assert.strictEqual(clearRes.status, 200);
    const clearData = await clearRes.json();
    assert.strictEqual(clearData.success, true);

    const getRes = await fetch('http://127.0.0.1:8082/mappings');
    const getData = await getRes.json();
    assert.strictEqual(getData.mappings.length, 0);
  });

  await t.test('should return 404 for other endpoints', async () => {
    const res = await fetch('http://127.0.0.1:8082/invalid-path');
    assert.strictEqual(res.status, 404);
  });
});
