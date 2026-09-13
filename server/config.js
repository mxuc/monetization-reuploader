import fs from 'node:fs';
import path from 'node:path';
import { logger } from './logger.js';

const CONFIG_FILE = 'config.json';
const ENV_FILE = '.env';

function parseEnvFile() {
  const envPath = path.resolve(ENV_FILE);
  if (!fs.existsSync(envPath)) return {};

  const vars = {};
  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        vars[key] = value;
      }
    }
  } catch (err) {
    logger.debug(`Failed to read/parse ${ENV_FILE}:`, err.message);
  }
  return vars;
}

function readConfigJson() {
  const configPath = path.resolve(CONFIG_FILE);
  if (!fs.existsSync(configPath)) return {};

  try {
    const content = fs.readFileSync(configPath, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    logger.debug(`Failed to read/parse ${CONFIG_FILE}:`, err.message);
    return {};
  }
}

export function loadConfig() {
  let apiKey = process.env.ROBLOX_API_KEY;

  if (!apiKey) {
    const envVars = parseEnvFile();
    apiKey = envVars.ROBLOX_API_KEY;
  }

  if (!apiKey) {
    const configVars = readConfigJson();
    apiKey = configVars.ROBLOX_API_KEY;
  }

  return {
    apiKey: apiKey || null
  };
}

export function saveConfig(config) {
  const configPath = path.resolve(CONFIG_FILE);
  try {
    const currentConfig = readConfigJson();
    const newConfig = {
      ...currentConfig,
      ROBLOX_API_KEY: config.apiKey
    };
    fs.writeFileSync(configPath, JSON.stringify(newConfig, null, 2), 'utf8');
    logger.debug(`Saved config to ${CONFIG_FILE}`);
  } catch (err) {
    logger.failed('Failed to save configuration locally', err.message);
  }
}
