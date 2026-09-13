# Usage Guide

basically, here's how to get this tools running

## Prerequisites

before starting, make sure you have:

* **Node.js**: v18+ recommended
* **Roblox Open Cloud API Key**: needs permission to create/update Game Passes and Developer Products in your target universe
* **Roblox Studio**: `HttpService.HttpEnabled` must be enabled in Game Settings
  `Home → Game Settings → Security → Allow HTTP Requests` (Very Important)
---

## 1. Install the Plugin

### Windows (Automated)

run:

```bat
installplugin.bat
```

this builds `reuploader.rbxmx` from source and copies it into:

```text
%LOCALAPPDATA%\Roblox\Plugins\
```

### Manual

if the automated installer broken/error, do it manually

1. compile the plugin:

   ```bash
   node plugin/build.js
   ```

2. copy `plugin/reuploader.rbxmx` into your Roblox Studio plugins folder:

   * **Windows**: `%LOCALAPPDATA%\Roblox\Plugins\`
   * **macOS**: `~/Documents/Roblox/Plugins/`

---

## 2. Run the CLI

start the reuploader server:

```bash
npm start
```

or, if you want to see the HTTP requests and payloads flying around (xD):

```bash
node server/index.js --debug
```

### CLI Steps

1. **API Key**

   if the API key isn't found in `config.json` or your environment variables, the CLI will ask you to paste it

2. **Target Universe ID**

   enter the universe ID of the destination game

3. **Asset IDs**

   enter Game Pass / Developer Product IDs separated by spaces or commas

   ```text
   Enter Game Pass / Developer Product IDs: 12345678, 87654321 99887766
   ```

4. the tool fetches the asset metadata, uploads the new assets, and prints the old → new ID mappings

5. **leave the CLI running.**

   the local server needs to stay alive so the Roblox Studio plugin can connect to it

---

## 3. Replace IDs in Roblox Studio

1. open your target place in Roblox Studio

2. open the **Monetization Reuploader** plugin from the Plugins tab

3. click **Connect/Update** to load the mappings from the local server:

   ```text
   http://127.0.0.1:8082/mappings
   ```

4. click **Reupload** to scan the scripts and replace the old asset IDs with the new ones

5. check the plugin console output for a summary of:

   * modified scripts
   * replaced references
   * any errors encountered

and that's basically it, your monetization IDs should now be updated automatically without manually searching through every script -FHL