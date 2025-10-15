# Chromock

Lightweight mock of the Chrome Extension API for browsers and tests.  
Perfect for popup/content/background script development outside the real Chrome Extension environment.

## Install

```bash
npm install chromock
```

or via CDN:
```html
<script src="https://unpkg.com/chromock/dist/chromock.js"></script>
```

## Usage

```js
import "chromock"; // attaches globalThis.chrome

chrome.runtime.sendMessage({ type: "PING" }, res => console.log(res));
chrome.storage.local.set({ score: 42 });
chrome.storage.local.get("score", v => console.log(v.score));
```

✅ Supports:
- `runtime.sendMessage`, `onMessage`
- `storage.local`
- `tabs.query`, `sendMessage`
- `alarms.create`, `onAlarm`
- `contextMenus.create`, `onClicked`
