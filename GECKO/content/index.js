/* global browser */

// ─────────────────────────────────────────────────────────────────────────────
// content/index.js
// This file is intentionally self-contained.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  if (window.__markAndFindLoaded) return;
  window.__markAndFindLoaded = true;

  const CONTENT_DEFAULTS = {
    enabled: true,
    autoSearch: false,
    autoSearchDelay: 2000,
    // Note: these are intentionally duplicated from shared/constants.js
    // because content scripts must be self-contained.
  };

  const SELECTION_DEBOUNCE_MS = 250;

  let cachedSettings = null;

  async function getSettings() {
    if (cachedSettings) return cachedSettings;
    try {
      const data = await browser.storage.local.get("settings");
      cachedSettings = { ...CONTENT_DEFAULTS, ...(data.settings || {}) };
      return cachedSettings;
    } catch (err) {
      console.warn("[Mark & Find] content getSettings error:", err.message);
      return { ...CONTENT_DEFAULTS };
    }
  }

  browser.storage.onChanged.addListener((changes) => {
    if (changes.settings) cachedSettings = null;
  });

  browser.runtime.onMessage.addListener((message) => {
    if (message.type === "getSelection") {
      const text = window.getSelection().toString().trim();
      const pageLang = document.documentElement.lang || null;
      return Promise.resolve({ text, pageLang });
    }
  });

  let autoSearchTimer = null;

  document.addEventListener("mouseup", async () => {
    clearTimeout(autoSearchTimer);

    const settings = await getSettings();
    if (!settings.enabled || !settings.autoSearch) return;

    autoSearchTimer = setTimeout(() => {
      const text = window.getSelection().toString().trim();
      if (text) {
        browser.runtime.sendMessage({ type: "auto-search", text });
      }
    }, settings.autoSearchDelay);
  });

  document.addEventListener("keydown", () => clearTimeout(autoSearchTimer));
  document.addEventListener("mousedown", () => clearTimeout(autoSearchTimer));

  let selectionTimeout = null;
  let previousText = "";

  document.addEventListener("selectionchange", () => {
    clearTimeout(selectionTimeout);

    selectionTimeout = setTimeout(() => {
      const text = window.getSelection().toString().trim();
      const pageLang = document.documentElement.lang || null;

      if (!text && !previousText) return;
      previousText = text;

      browser.runtime
        .sendMessage({
          type: "selection-changed",
          text: text,
          pageLang: pageLang,
        })
        .catch(() => {
          // background can restart, intentionally silent
        });
    }, SELECTION_DEBOUNCE_MS);
  });
})();
