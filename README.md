# Roblox Monetization Reuploader

reupload your game passes & developer products across your own roblox games, faster than doing it manually

a command-line tool + roblox studio plugin that copies monetization assets and updates their ids in the game automatically

made for those people who don't want to manually replace 500 monetization ids

## what does it do?

* reupload game passes & developer products
* copy names, descriptions, prices, icons, and sale status
* automatically figure out what type of asset you're dealing with
* replace old asset ids in your roblox scripts
* cache mappings so you don't accidentally reupload everything again
* includes a local bridge between the cli and roblox studio
* retries failed requests

## how it works

1. give it the target universe id
2. paste your asset ids
3. let the cli do its thing
4. open roblox studio
5. click the plugin
6. boom!

## requirements

* node.js 18+
* roblox studio
* a roblox open cloud api key with the required permissions (dev products : read & write, gamepasses : read & write)
* a functioning brain to read the usage (somehow it IS very important)

## getting started

### 1. install

```bash
git clone https://github.com/your-username/roblox-monetization-reuploader.git

cd roblox-monetization-reuploader

npm install
```

### 2. build the plugin

```bash
node plugin/build.js
```

or use the windows one-click installer:

```text
installplugin.bat
```

### 3. configure your api key

you can either:

* let the cli ask you for it
* set `ROBLOX_API_KEY` as an environment variable
* create a `config.json` from the example config

please don't commit your api key

### 4. run

```bash
npm start
```

or with debug logging:

```bash
node server/index.js --debug
```

### 5. reupload stuff

* enter your target universe id
* paste your game pass / developer product ids
* wait for the cli to finish
* keep the cli running
* open the reuploader plugin in roblox studio
* connect and update
* click reupload

that's all!

## project structure

```text
├── server/             # the part that does the actual work
│   ├── auth.js         # api key handling
│   ├── cache.js        # stops duplicate uploads
│   ├── config.js       # config loading
│   ├── index.js        # cli entry point
│   ├── logger.js       # logs go brrr
│   ├── queue.js        # request queue + retries
│   ├── roblox.js       # roblox api client
│   └── server.js       # local bridge server
├── plugin/             # roblox studio plugin
│   ├── build.js        # plugin builder
│   ├── reuploader.lua  # plugin source
│   └── reuploader.rbxmx # compiled plugin
├── shared/             # shared types & constants
├── tests/              # tests
├── docs/               # extra documentation
├── installplugin.bat   # windows installer
└── package.json
```

## testing

```bash
npm test
```

## documentation

* [architecture](docs/architecture.md)
* [usage guide](docs/usage.md)

## contributing

pull requests, forks, suggestions, bug reports, etc. all welcome

if you find a bug, feel free to open an issue

if you rewrited or "improved" this, i'd love to see it

## license

[MIT](LICENSE)

---

Made with love by FHL, also this was vibe coded, expect bugs, currently there's no planned major updates in the future (except minor/bug fixes)