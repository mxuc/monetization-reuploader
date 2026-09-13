# Architecture

# this was created by FHL, vibe-coded shit lmao, thanks for chatgpt for helping me making ts

The tool consists of two components:
1. **Node.js CLI & Mapping Server** (`server/`): Handles Open Cloud API interaction, asset fetching, reuploading, and caching.
2. **Roblox Studio Plugin** (`plugin/`): Connects to the local mapping server and updates script references in the place file.

---

## 1. Node.js Server & CLI

```
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

### Modules

- **`index.js`**: CLI entry point. Prompts for target Universe ID and asset IDs, coordinates the pipeline, and reports results.
- **`roblox.js`**: Roblox API client.
  - Probes endpoints to detect whether an ID is a Game Pass or Developer Product.
  - Fetches metadata (name, description, price, sale status, managed pricing flags).
  - Downloads Game Pass icons into memory.
  - Re-creates assets in the target universe via Open Cloud API.
- **`queue.js`**: Task runner with concurrency limiting (default 2) and exponential backoff retries for transient errors (429, 5xx, network drops).
- **`cache.js`**: Persistent cache (`mappings.json`) keyed by `sourceId:targetUniverseId` to prevent duplicate re-uploads.
- **`server.js`**: Lightweight HTTP server listening on `127.0.0.1:8082` with CORS headers enabled so Roblox Studio can fetch resolved mappings.
- **`config.js`**: Loads API key priority: `process.env` → `.env` → `config.json`.
- **`auth.js`**: Interactive prompt fallback to save the API key to `config.json` if missing.
- **`logger.js`**: Console output with optional `--debug` flag for full HTTP request/response payloads.

---

## 2. Roblox Studio Plugin

- **Source**: `plugin/reuploader.lua` (compiled to `reuploader.rbxmx` via `plugin/build.js`).
- **Communication**: Queries `http://127.0.0.1:8082/mappings` via `HttpService:GetAsync`.
- **Script Traversal**: Scans all standard container services (`Workspace`, `ReplicatedStorage`, `ServerScriptService`, `ServerStorage`, `StarterGui`, `StarterPack`, `StarterPlayer`, `ReplicatedFirst`).
- **ID Replacement**: Uses `ScriptEditorService:UpdateSourceAsync` with Lua frontier patterns (`%f[%d]<id>%f[%D]`) to match exact digit boundaries, preventing accidental partial replacements.