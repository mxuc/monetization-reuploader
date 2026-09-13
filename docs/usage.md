# Usage Guide

# this was created by FHL, vibe-coded shit lmao, thanks for chatgpt for helping me making ts

## Prerequisites

- **Node.js**: v18+ recommended.
- **Roblox Open Cloud API Key**: Needs permissions to create/update Game Passes and Developer Products on your target universe.
- **Roblox Studio**: `HttpService.HttpEnabled` must be enabled in Game Settings (Home → Game Settings → Security → Allow HTTP Requests).

---

## 1. Install the Plugin

### Windows (Automated)
Run `installplugin.bat`. This builds `reuploader.rbxmx` from source and copies it into `%LOCALAPPDATA%\Roblox\Plugins`.

### Manual
1. Compile the plugin:
   ```bash
   node plugin/build.js
   ```
2. Copy `plugin/reuploader.rbxmx` to your Roblox Studio plugins folder:
   - **Windows**: `%LOCALAPPDATA%\Roblox\Plugins\`
   - **macOS**: `~/Documents/Roblox/Plugins/`

---

## 2. Run the CLI

Start the reuploader server:
```bash
npm start
```
Or with debug logging (prints HTTP requests and payloads):
```bash
node server/index.js --debug
```

### Steps in CLI:
1. **API Key**: If not found in `config.json` or environment variables, you will be prompted to paste it.
2. **Target Universe ID**: Enter the universe ID of the destination game.
3. **Asset IDs**: Enter space- or comma-separated Game Pass / Developer Product IDs.
   ```
   Enter Game Pass / Developer Product IDs: 12345678, 87654321 99887766
   ```
4. The tool fetches metadata, uploads the new assets, and prints the old → new ID mappings.
5. Leave the CLI running so the local server remains available for Studio.

---

## 3. Replace IDs in Roblox Studio

1. Open your target place in Roblox Studio.
2. Open the **Monetization Reuploader** plugin from the Plugins ribbon.
3. Click **Connect/Update** to load mappings from the local server (`http://127.0.0.1:8082/mappings`).
4. Click **Reupload** to scan all scripts and replace old asset IDs with the new ones.
5. Check the plugin console output for a summary of modified scripts and replaced references.