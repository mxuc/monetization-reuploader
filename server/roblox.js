import { logger } from './logger.js';
import { HttpError } from './queue.js';
import { AssetType } from '../shared/types.js';

async function robloxRequest(url, options = {}, apiKey = null, attempt = 1) {
  const method = options.method || 'GET';
  const headers = { ...options.headers };

  if (apiKey && url.includes('apis.roblox.com')) {
    headers['x-api-key'] = apiKey;
  }

  const reqOptions = { ...options, headers };

  let responseBodyText = '';
  let status = 0;
  let statusText = '';

  try {
    const res = await fetch(url, reqOptions);
    status = res.status;
    statusText = res.statusText;
    responseBodyText = await res.text();

    logger.debugHttp({
      method,
      url,
      headers,
      payload: options.body,
      status,
      responseBody: responseBodyText,
      attempt
    });

    if (!res.ok) {
      if (!(res.status === 404 && options.silentOn404)) {
        console.error(`\n✖ [API FAILURE] Request failed:`);
        console.error(`  Endpoint: ${url}`);
        console.error(`  Method: ${method}`);
        console.error(`  Content-Type: ${headers['Content-Type'] || 'multipart/form-data (auto)'}`);
        console.error(`  Payload: ${options.body ? (options.body instanceof FormData ? '[FormData]' : options.body) : 'none'}`);
        console.error(`  Response Status: ${status}`);
        console.error(`  Raw Response Body:\n${responseBodyText}\n`);
      }

      throw new HttpError(status, statusText, responseBodyText);
    }

    try {
      return JSON.parse(responseBodyText);
    } catch {
      return responseBodyText;
    }
  } catch (err) {
    if (err instanceof HttpError) {
      throw err;
    }
    logger.debugHttp({
      method,
      url,
      headers,
      payload: options.body,
      status: 0,
      responseBody: err.message,
      attempt
    });
    throw err;
  }
}

export function normalizeManagedPricing(res) {
  if (!res) return undefined;
  if (res.isManagedPricingEnabled !== undefined) {
    return !!res.isManagedPricingEnabled;
  }
  if (res.IsManagedPricingEnabled !== undefined) {
    return !!res.IsManagedPricingEnabled;
  }
  return undefined;
}

export async function fetchGamePassMetadata(gamePassId, apiKey = null) {
  const url = `https://apis.roblox.com/game-passes/v1/game-passes/${gamePassId}/product-info`;
  const res = await robloxRequest(url, { silentOn404: true }, apiKey);
  return {
    id: gamePassId,
    name: res.Name || res.name || res.displayName || '',
    description: res.Description || res.description || res.displayDescription || '',
    price: res.PriceInRobux !== undefined ? res.PriceInRobux : (res.price !== undefined ? res.price : 0),
    isForSale: res.IsForSale !== undefined ? res.IsForSale : (res.isForSale !== undefined ? res.isForSale : false),
    iconImageAssetId: res.IconImageAssetId || res.iconImageAssetId || 0,
    isManagedPricingEnabled: normalizeManagedPricing(res)
  };
}

export async function fetchDeveloperProductMetadata(productId, apiKey = null) {
  try {
    const url = `https://apis.roblox.com/developer-products/v1/developer-products/${productId}/details`;
    const res = await robloxRequest(url, { silentOn404: true }, apiKey);
    return {
      id: productId,
      name: res.name || res.Name || '',
      description: res.description || res.Description || '',
      price: res.priceInRobux !== undefined ? res.priceInRobux : (res.PriceInRobux !== undefined ? res.PriceInRobux : 0),
      isForSale: res.isPurchasable !== undefined ? res.isPurchasable : true,
      isManagedPricingEnabled: normalizeManagedPricing(res)
    };
  } catch (err) {
    logger.debug(`V1 Developer Product details failed (${err.message}). Trying economy.roblox.com details...`);
  }

  const url = `https://economy.roblox.com/v2/developer-products/${productId}/details`;
  const res = await robloxRequest(url, { silentOn404: true });
  return {
    id: productId,
    name: res.Name || res.name || '',
    description: res.Description || res.description || '',
    price: res.PriceInRobux !== undefined ? res.PriceInRobux : (res.priceInRobux !== undefined ? res.priceInRobux : 0),
    isForSale: res.IsForSale !== undefined ? res.IsForSale : true,
    isManagedPricingEnabled: normalizeManagedPricing(res)
  };
}

export async function downloadGamePassIcon(gamePassId) {
  try {
    const thumbUrl = `https://thumbnails.roblox.com/v1/game-passes?gamePassIds=${gamePassId}&size=150x150&format=Png&isCircular=false`;
    const thumbRes = await robloxRequest(thumbUrl, {});
    
    if (thumbRes && thumbRes.data && thumbRes.data.length > 0 && thumbRes.data[0].imageUrl) {
      const imageUrl = thumbRes.data[0].imageUrl;
      const imageRes = await fetch(imageUrl);
      if (imageRes.ok) {
        const arrayBuffer = await imageRes.arrayBuffer();
        return new Blob([arrayBuffer], { type: 'image/png' });
      }
    }
  } catch (err) {
    logger.debug(`Failed to download icon for Game Pass ${gamePassId}: ${err.message}`);
  }
  return null;
}

export async function createGamePass(universeId, name, description, iconBlob, apiKey, isManagedPricingEnabled = undefined) {
  const url = `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes`;

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description || '');
  if (iconBlob) {
    formData.append('imageFile', iconBlob, 'icon.png');
  }
  if (isManagedPricingEnabled !== undefined) {
    formData.append('isManagedPricingEnabled', String(isManagedPricingEnabled));
  }

  const res = await robloxRequest(url, {
    method: 'POST',
    body: formData
  }, apiKey);

  if (!res || !res.gamePassId) {
    throw new Error('Create Game Pass response did not contain gamePassId');
  }
  return String(res.gamePassId);
}

export async function updateGamePass(universeId, gamePassId, name, description, price, isForSale, apiKey, isManagedPricingEnabled = undefined) {
  const url = `https://apis.roblox.com/game-passes/v1/universes/${universeId}/game-passes/${gamePassId}`;

  const formData = new FormData();
  if (name !== undefined) formData.append('name', name);
  if (description !== undefined) formData.append('description', description);
  if (price !== undefined) formData.append('price', String(price));
  if (isForSale !== undefined) formData.append('isForSale', String(isForSale));
  if (isManagedPricingEnabled !== undefined) {
    formData.append('isManagedPricingEnabled', String(isManagedPricingEnabled));
  }

  await robloxRequest(url, {
    method: 'PATCH',
    body: formData
  }, apiKey);
}

export async function createDeveloperProduct(universeId, name, description, priceInRobux, apiKey, isManagedPricingEnabled = undefined) {
  const url = `https://apis.roblox.com/developer-products/v2/universes/${universeId}/developer-products`;

  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description || '');
  formData.append('price', String(priceInRobux));
  formData.append('isForSale', 'true');
  if (isManagedPricingEnabled !== undefined) {
    formData.append('isManagedPricingEnabled', String(isManagedPricingEnabled));
  }

  const res = await robloxRequest(url, {
    method: 'POST',
    body: formData
  }, apiKey);

  if (!res || !res.productId) {
    throw new Error('Create Developer Product response did not contain productId');
  }
  return String(res.productId);
}
