# DIY Stream Deck

Local web-based tablet control panel for LSPDFR / Marlin-CLI. No app install needed on the tablet — just open a browser over local WiFi.

## Setup

```
npm install
node server.js
```

Then open the URL printed in the console on your tablet.

## How It Works

- Express server runs on the GTA PC
- Tablet opens the panel page in its browser
- Buttons send POST requests to the server
- Server uses `@nut-tree/nut-js` to simulate keypresses

## Button Methods

**`key`** — sends an F-key directly (fast, no camera shift)
```json
{ "label": "Cross Arms", "method": "key", "key": "f13" }
```

**`text`** — opens Marlin-CLI (F5), types a command, presses Enter (causes brief camera shift)
```json
{ "label": "Thin Traffic", "method": "text", "command": "tf thintraffic" }
```

## Customizing Buttons

Edit `buttons.json`. Each page is an object with a `page` name and `buttons` array. Changes take effect on browser refresh.

## Port

Default port is `3000`. Override with:
```
set DIYSTREAMDECK_PORT=8080
node server.js
```
