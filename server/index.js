import readline from 'node:readline/promises';
import { loadConfig } from './config.js';
import { promptAndSaveApiKey } from './auth.js';
import { logger } from './logger.js';
import { TaskQueue } from './queue.js';
import { AssetType } from '../shared/types.js';
import cache from './cache.js';
import {
  fetchGamePassMetadata,
  fetchDeveloperProductMetadata,
  downloadGamePassIcon,
  createGamePass,
  updateGamePass,
  createDeveloperProduct
} from './roblox.js';
import { startServer, stopServer, addMapping } from './server.js';

const isDebug = process.argv.includes('--debug');
logger.init(isDebug);

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  try {
    await startServer();

    const config = loadConfig();
    let apiKey = config.apiKey;

    if (!apiKey) {
      logger.log('No API key found in configuration.');
      apiKey = await promptAndSaveApiKey(rl);
    } else {
      logger.log('✔ Open Cloud API Key loaded from configuration.');
    }

    let targetUniverseId = '';
    while (!targetUniverseId) {
      targetUniverseId = await rl.question('Enter the target Universe ID: ');
      targetUniverseId = targetUniverseId.trim();
      if (!targetUniverseId) {
        logger.log('Universe ID cannot be empty.');
      }
    }
    logger.debug(`Target Universe ID set to: ${targetUniverseId}`);

    while (true) {
      const sourceIdsInput = await rl.question('\nEnter Game Pass / Developer Product IDs (or type "exit"): ');
      const trimmedInput = sourceIdsInput.trim();

      if (trimmedInput.toLowerCase() === 'exit') {
        logger.log('Goodbye.');
        break;
      }

      if (!trimmedInput) {
        logger.log('Asset IDs cannot be empty.');
        continue;
      }

      const rawIds = trimmedInput.split(/[\s,]+/);
      const parsedIds = rawIds
        .map(id => id.trim())
        .filter(id => id.length > 0);
      const uniqueIds = Array.from(new Set(parsedIds));

      if (uniqueIds.length === 0) {
        logger.log('No valid asset IDs entered.');
        continue;
      }

      logger.log(`\nQueueing ${uniqueIds.length} assets for reupload...\n`);

      const queue = new TaskQueue(2);
      const successMappings = [];
      const failedList = [];
      let missingManagedPricingCount = 0;

      const processAsset = async (sourceId) => {
        const cached = cache.get(sourceId, targetUniverseId);
        if (cached) {
          addMapping(sourceId, cached.newId, cached.assetType);
          successMappings.push({ sourceId, newId: cached.newId });
          logger.success(`(Cached) ${cached.assetType} ${sourceId} -> ${cached.newId} [${cached.name}]`);
          return;
        }

        let assetDetails = null;
        let detectedType = null;
        let gamePassError = null;
        let devProductError = null;

        try {
          assetDetails = await fetchGamePassMetadata(sourceId, apiKey);
          detectedType = AssetType.GAME_PASS;
        } catch (err) {
          gamePassError = err;
          logger.debug(`Game Pass lookup failed for ${sourceId}: ${err.message}`);
        }

        if (!detectedType) {
          try {
            assetDetails = await fetchDeveloperProductMetadata(sourceId, apiKey);
            detectedType = AssetType.DEVELOPER_PRODUCT;
          } catch (err) {
            devProductError = err;
            logger.debug(`Developer Product lookup failed for ${sourceId}: ${err.message}`);
          }
        }

        if (!detectedType) {
          const gpMsg = gamePassError ? gamePassError.message : 'Unknown error';
          const dpMsg = devProductError ? devProductError.message : 'Unknown error';
          throw new Error(`Unable to determine asset type.\n  - Game Pass check: ${gpMsg}\n  - Developer Product check: ${dpMsg}`);
        }

        if (assetDetails.isManagedPricingEnabled === undefined) {
          missingManagedPricingCount++;
        }
        logger.debug(`Managed Pricing for ${sourceId}: ${assetDetails.isManagedPricingEnabled}`);

        let newId;
        if (detectedType === AssetType.GAME_PASS) {
          const iconBlob = await downloadGamePassIcon(sourceId);
          newId = await createGamePass(targetUniverseId, assetDetails.name, assetDetails.description, iconBlob, apiKey, assetDetails.isManagedPricingEnabled);
          await updateGamePass(targetUniverseId, newId, assetDetails.name, assetDetails.description, assetDetails.price, assetDetails.isForSale, apiKey, assetDetails.isManagedPricingEnabled);
        } else {
          newId = await createDeveloperProduct(targetUniverseId, assetDetails.name, assetDetails.description, assetDetails.price, apiKey, assetDetails.isManagedPricingEnabled);
        }

        cache.set(sourceId, targetUniverseId, {
          newId,
          assetType: detectedType,
          name: assetDetails.name
        });

        addMapping(sourceId, newId, detectedType);
        successMappings.push({ sourceId, newId });
        logger.success(`(Created) ${detectedType} ${sourceId} -> ${newId} [${assetDetails.name}]`);
      };

      const promises = uniqueIds.map(sourceId => {
        return queue.add(() => processAsset(sourceId))
          .catch(err => {
            failedList.push({ sourceId, reason: err.message });
            logger.failed(`Asset ${sourceId}`, err.message);
          });
      });

      await Promise.all(promises);

      if (missingManagedPricingCount > 0) {
        logger.log(`\nManaged Pricing metadata unavailable for ${missingManagedPricingCount} assets.\nUsing Roblox default behavior.`);
      }

      logger.log('\n=================================');
      logger.log(`Success : ${successMappings.length}`);
      logger.log(`Failed  : ${failedList.length}`);
      if (successMappings.length > 0) {
        logger.log('\nMappings');
        for (const mapping of successMappings) {
          logger.log(`${mapping.sourceId} -> ${mapping.newId}`);
        }
      }
      logger.log('=================================');
    }

  } catch (err) {
    logger.failed('Unexpected error occurred during execution', err.message);
  } finally {
    rl.close();
    await stopServer();
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
