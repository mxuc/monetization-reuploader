# Architecture

this project is basically two things that works together:

1. **Node.js CLI & Mapping Server** (`server/`): does the roblox api stuff, uploads assets, and keeps track of mappings
2. **Roblox Studio Plugin** (`plugin/`): talks to the local server and replaces the old asset ids in your game

---

## 1. Node.js Server & CLI

```text
CLI / User Input
       │
       ▼
┌──────────────────┐      ┌─────────────────────────┐
│ TaskQueue        │ ───► │ Roblox Open Cloud APIs  │
│ (Concurrency: 2) │      │ (Fetch, Upload, Update) │
└──────────────────┘      └─────────────────────────┘
       │
       ▼
┌──────────────────┐
│ MappingCache     │ ───► mappings.json (disk)
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ HTTP Server      │ ───► http://127.0.0.1:8082/mappings
│ (node:http)      │
└──────────────────┘
```

### modules

* **`index.js`**: starts the cli, asks for the target universe and asset ids, and runs the whole thing
* **`roblox.js`**: talks to roblox apis
  * checks whether an id is a game pass or developer product
  * gets asset info like name, description, price, etc
  * downloads game pass icons
  * creates the assets in the target universe
* **`queue.js`**: handles tasks with a concurrency limit of 2. also retries failed requests
* **`cache.js`**: saves mappings to `mappings.json` so the same assets don't get uploaded again for no reason
* **`server.js`**: runs a small local http server on `127.0.0.1:8082` so the studio plugin can fetch the mappings
* **`config.js`**: loads the api key from environment variables, `.env`, or `config.json`
* **`auth.js`**: asks for the api key if it's missing and saves it to `config.json`
* **`logger.js`**: handles console logs. `--debug` makes it yap about http requests and responses

---

## 2. Roblox Studio Plugin

* **source**: `plugin/reuploader.lua`
* **compiled plugin**: `plugin/reuploader.rbxmx`
* **build script**: `plugin/build.js`

### how it talks to the cli

the plugin sends a request to:

```text
http://127.0.0.1:8082/mappings
```

using `HttpService:GetAsync`.

the cli needs to be running so the plugin can get the mappings

### script scanning

the plugin scans these services:

* `Workspace`
* `ReplicatedStorage`
* `ServerScriptService`
* `ServerStorage`
* `StarterGui`
* `StarterPack`
* `StarterPlayer`
* `ReplicatedFirst`

### id replacement

uses:

```lua
%f[%d]<id>%f[%D]
```

this makes sure it matches the full asset id instead of accidentally replacing part of another number

for example:

```text
123456
```

won't accidentally replace the `123456` inside:

```text
91234567
```

this was somehow a bug before i fixed it, now hopefully it doesnt do it again

---

## final note

it's a cli, a local http server, and a roblox studio plugin working together to save you from manually replacing asset ids

if something breaks, check the logs. if that doesn't help, good luck lmao
