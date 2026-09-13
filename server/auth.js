import readline from 'node:readline/promises';
import { saveConfig } from './config.js';

export async function promptAndSaveApiKey(rl) {
  let apiKey = '';
  while (!apiKey) {
    apiKey = await rl.question('Enter your Roblox Open Cloud API Key: ');
    apiKey = apiKey.trim();
    if (!apiKey) {
      console.log('API Key cannot be empty. Please try again.');
    }
  }

  saveConfig({ apiKey });
  console.log('✔ API key saved locally in config.json.');
  return apiKey;
}
