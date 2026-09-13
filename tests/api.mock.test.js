import test from 'node:test';
import assert from 'node:assert';
import {
  fetchGamePassMetadata,
  fetchDeveloperProductMetadata,
  createGamePass,
  createDeveloperProduct,
  updateGamePass
} from '../server/roblox.js';

test('Roblox API Client Mock Tests', async (t) => {
  const originalFetch = globalThis.fetch;

  t.afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  await t.test('fetchGamePassMetadata success path (with IsManagedPricingEnabled: true)', async () => {
    globalThis.fetch = async (url, options) => {
      assert.strictEqual(url, 'https://apis.roblox.com/game-passes/v1/game-passes/123/product-info');
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          TargetId: 123,
          Name: 'Sword Pass',
          Description: 'Gives a sword',
          PriceInRobux: 250,
          IsForSale: true,
          IconImageAssetId: 456,
          IsManagedPricingEnabled: true
        })
      };
    };

    const metadata = await fetchGamePassMetadata(123);
    assert.strictEqual(metadata.name, 'Sword Pass');
    assert.strictEqual(metadata.price, 250);
    assert.strictEqual(metadata.iconImageAssetId, 456);
    assert.strictEqual(metadata.isManagedPricingEnabled, true);
  });

  await t.test('fetchGamePassMetadata success path (with isManagedPricingEnabled: false)', async () => {
    globalThis.fetch = async (url, options) => {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          TargetId: 123,
          Name: 'Sword Pass',
          Description: 'Gives a sword',
          PriceInRobux: 250,
          IsForSale: true,
          IconImageAssetId: 456,
          isManagedPricingEnabled: false
        })
      };
    };

    const metadata = await fetchGamePassMetadata(123);
    assert.strictEqual(metadata.isManagedPricingEnabled, false);
  });

  await t.test('fetchGamePassMetadata success path (with isManagedPricingEnabled undefined)', async () => {
    globalThis.fetch = async (url, options) => {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          TargetId: 123,
          Name: 'Sword Pass',
          Description: 'Gives a sword',
          PriceInRobux: 250,
          IsForSale: true,
          IconImageAssetId: 456
        })
      };
    };

    const metadata = await fetchGamePassMetadata(123);
    assert.strictEqual(metadata.isManagedPricingEnabled, undefined);
  });

  await t.test('fetchDeveloperProductMetadata success path (v1 details)', async () => {
    globalThis.fetch = async (url, options) => {
      if (url.includes('v1/developer-products')) {
        return {
          ok: true,
          status: 200,
          text: async () => JSON.stringify({
            name: '100 Coins',
            description: 'Gives 100 coins',
            priceInRobux: 50,
            isPurchasable: true
          })
        };
      }
      throw new Error('Unexpected URL ' + url);
    };

    const metadata = await fetchDeveloperProductMetadata(789);
    assert.strictEqual(metadata.name, '100 Coins');
    assert.strictEqual(metadata.price, 50);
    assert.strictEqual(metadata.isForSale, true);
    assert.strictEqual(metadata.isManagedPricingEnabled, undefined);
  });

  await t.test('createGamePass with Form Data (isManagedPricingEnabled undefined)', async () => {
    globalThis.fetch = async (url, options) => {
      assert.strictEqual(url, 'https://apis.roblox.com/game-passes/v1/universes/999/game-passes');
      assert.strictEqual(options.method, 'POST');
      assert.ok(options.body instanceof FormData);
      assert.strictEqual(options.body.get('name'), 'New Pass');
      assert.strictEqual(options.body.get('description'), 'A new game pass');
      assert.ok(options.body.has('imageFile') === false);
      assert.ok(options.body.has('isManagedPricingEnabled') === false);
      
      return {
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ gamePassId: 5555 })
      };
    };

    const newId = await createGamePass(999, 'New Pass', 'A new game pass', null, 'test-api-key', undefined);
    assert.strictEqual(newId, '5555');
  });

  await t.test('createGamePass with Form Data (isManagedPricingEnabled true/false)', async () => {
    let expectedVal = 'true';
    globalThis.fetch = async (url, options) => {
      assert.ok(options.body instanceof FormData);
      assert.strictEqual(options.body.get('isManagedPricingEnabled'), expectedVal);
      return {
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ gamePassId: 5555 })
      };
    };

    await createGamePass(999, 'New Pass', 'A new game pass', null, 'test-api-key', true);
    
    expectedVal = 'false';
    await createGamePass(999, 'New Pass', 'A new game pass', null, 'test-api-key', false);
  });

  await t.test('createDeveloperProduct with Form Data (isManagedPricingEnabled defined & undefined)', async () => {
    let expectedDefined = false;
    globalThis.fetch = async (url, options) => {
      assert.strictEqual(url, 'https://apis.roblox.com/developer-products/v2/universes/999/developer-products');
      assert.strictEqual(options.method, 'POST');
      assert.ok(options.body instanceof FormData);
      assert.strictEqual(options.body.get('name'), 'Gold');
      assert.strictEqual(options.body.get('price'), '100');
      
      if (expectedDefined) {
        assert.strictEqual(options.body.get('isManagedPricingEnabled'), 'true');
      } else {
        assert.ok(options.body.has('isManagedPricingEnabled') === false);
      }

      return {
        ok: true,
        status: 201,
        text: async () => JSON.stringify({ productId: 6666 })
      };
    };

    await createDeveloperProduct(999, 'Gold', 'Get gold', 100, 'test-api-key', undefined);
    
    expectedDefined = true;
    await createDeveloperProduct(999, 'Gold', 'Get gold', 100, 'test-api-key', true);
  });

  await t.test('updateGamePass with Form Data PATCH', async () => {
    let expectedPricing = 'true';
    globalThis.fetch = async (url, options) => {
      assert.strictEqual(url, 'https://apis.roblox.com/game-passes/v1/universes/999/game-passes/111');
      assert.strictEqual(options.method, 'PATCH');
      assert.ok(options.body instanceof FormData);
      assert.strictEqual(options.body.get('price'), '350');
      assert.strictEqual(options.body.get('isForSale'), 'true');
      
      if (expectedPricing !== undefined) {
        assert.strictEqual(options.body.get('isManagedPricingEnabled'), expectedPricing);
      } else {
        assert.ok(options.body.has('isManagedPricingEnabled') === false);
      }

      return {
        ok: true,
        status: 200,
        text: async () => 'OK'
      };
    };

    await updateGamePass(999, 111, 'Updated Name', 'Updated Desc', 350, true, 'test-api-key', true);
    
    expectedPricing = undefined;
    await updateGamePass(999, 111, 'Updated Name', 'Updated Desc', 350, true, 'test-api-key', undefined);
  });
});
