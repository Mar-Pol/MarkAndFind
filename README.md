<p align="center">
  <img width="128" alt="Mark & Find icon" src="docs/icon.png" />
</p>

<h1 align="center">Mark & Find</h1>

<p align="center">Select text on any webpage and search it instantly via keyboard shortcut or right-click menu.</p>

<p align="center">
  <a href="https://addons.mozilla.org/firefox/addon/mark-and-find/"><img alt="Firefox" src="https://img.shields.io/badge/Firefox-141e24.svg?&style=for-the-badge&logo=firefox-browser&logoColor=white"></a>&nbsp;
  <a href="https://chromewebstore.google.com/detail/markandfind/fienkdchnfljpljfnmojbodlaopjicme"><img alt="Chrome" src="https://img.shields.io/badge/Chrome-141e24.svg?&style=for-the-badge&logo=google-chrome&logoColor=white"></a>
</p>

<p align="center">
  <a href="https://github.com/Mar-Pol/MarkAndFind/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg" alt="License: GPL-3.0">
  </a>
</p>

---

## Installation

<table>
  <tr>
    <th>Browser family</th>
    <th align="center">Version</th>
    <th>Download</th>
  </tr>
  <tr>
    <td>Gecko-based (Firefox, Zen Browser, LibreWolf, …)</td>
    <td align="center">1.1.1</td>
    <td><a href="https://addons.mozilla.org/firefox/addon/mark-and-find/">Firefox Add-ons</a></td>
  </tr>
  <tr>
    <td>Chromium-based (Chrome, Edge, Opera, Brave, Vivaldi, …)</td>
    <td align="center">1.1.0</td>
    <td><a href="https://chromewebstore.google.com/detail/markandfind/fienkdchnfljpljfnmojbodlaopjicme">Chrome Web Store</a></td>
  </tr>
</table>

> <code>Gecko v1.1.1</code> and <code>Chromium v1.1.0</code> are the same extension build.

## FAQ

Before opening an issue, check the [FAQ](https://github.com/Mar-Pol/MarkAndFind/blob/main/faq.md).

## Features

- Keyboard shortcut (customizable) and context menu search
- Multi-engine search — open results in multiple engines at once
- Custom search engines
- Favorites (pinned engines)
- Auto-search on selection (optional)
- Search history (last 20 queries)
- Local text cleanup before searching
- Open results in new tab, background tab, same tab, or private window

## Permissions

| Permission | What it does |
|---|---|
| `storage` | Stores your settings and search history locally |
| `activeTab` | Reads the current tab URL when you trigger a search |
| `tabs` | Opens results in a new tab, background tab, or same tab |
| `contextMenus` | Adds the right-click search item |
| `alarms` | Keeps the background script alive in Chromium-based browsers |
| `scripting` | Injects the content script to read selected text and page language |
| `downloads` | Downloads a JSON file when exporting settings |

> **Note:** Page language is used for the optional text cleanup feature. When enabled, it can remove language prefixes/suffixes from selected text (e.g. `en`, `sk`) that some sites append.

## Privacy

No tracking, no ads, no analytics, no external servers.
All data is stored locally in the browser and only sent to selected search engines.

You can read more here: [Privacy Policy](https://github.com/Mar-Pol/MarkAndFind/wiki/Privacy-Policy)

## Compatibility

Tested on: Firefox, Zen Browser, LibreWolf, Chrome, Edge, Opera, Vivaldi, Brave

> **Note:** Safari is not supported and support is not planned.

## Contributing

Found a bug or want to add a language? [Open an issue](https://github.com/Mar-Pol/MarkAndFind/issues/new/choose)

## License

GPL-3.0 © 2025-2026 MarPol
