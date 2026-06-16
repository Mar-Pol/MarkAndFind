/* global browser */

// ─────────────────────────────────────────────────────────────────────────────
// background/index.js  (service worker Gecko + Chromium)
// ─────────────────────────────────────────────────────────────────────────────

import "../shared/browser-compat.js";
import { getSettings, initStorage, addToHistory } from "../shared/settings.js";
import { RESTRICTED_URL_PREFIXES, RESTRICTED_DOMAINS } from "../shared/constants.js";
import { buildSearchText, buildUrl, sanitizeText } from "../shared/validators.js";
import { syncContextMenu, updateContextMenuTitle } from "./contextMenu.js";

const BADGE_CLEAR_DELAY_MS = 1_500;

// Chromium terminates service workers after ~30 s of inactivity; alarm keeps it alive
browser.alarms.create("keep-alive", { periodInMinutes: 0.2 });

browser.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== "keep-alive") return;
  browser.storage.local.get("_ping").catch(() => {});
});

async function getActiveTab() {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  return tab || null;
}

function isRestrictedUrl(url) {
  if (!url) return true;
  if (RESTRICTED_URL_PREFIXES.some((prefix) => url.startsWith(prefix))) return true;
  try {
    const { hostname, pathname } = new URL(url);
    if (/^(addons|extensions?)\..+/.test(hostname)) return true;
    return RESTRICTED_DOMAINS.some((domain) => (hostname + pathname).startsWith(domain));
  } catch {
    return false;
  }
}

async function getSelectedTextFromTab(tabId) {
  try {
    const result = await browser.tabs.sendMessage(tabId, { type: "getSelection" });
    if (result && typeof result === "object" && result.text?.trim()) {
      return { text: result.text.trim(), pageLang: result.pageLang ?? null };
    }
    if (typeof result === "string" && result.trim()) {
      return { text: result.trim(), pageLang: null };
    }
    return null;
  } catch {
    return null;
  }
}

async function openUrl(url, settings, isFirst = true) {
  try {
    switch (settings.openIn) {
      case "background-tab":
        await browser.tabs.create({ url, active: false });
        break;

      case "same-tab":
        if (isFirst) {
          const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
          await browser.tabs.update(tab.id, { url });
        } else {
          await browser.tabs.create({ url, active: false });
        }
        break;

      case "private-window":
        if (isFirst) {
          await browser.windows.create({ url, incognito: true });
        } else {
          await browser.tabs.create({ url, active: false });
        }
        break;

      case "new-tab":
      default:
        await browser.tabs.create({ url, active: isFirst });
        break;
    }
  } catch (err) {
    console.warn("[Mark & Find] openUrl fallback:", err.message);
    await browser.tabs.create({ url, active: isFirst });
  }
}

async function performSearch(rawText, sourceTabUrl, settings = null, pageLang = null) {
  if (!settings) settings = await getSettings();
  if (!settings.enabled) return;

  const cleanText = settings.cleanupEnabled ? sanitizeText(rawText, settings.cleanupRules ?? [], pageLang) : rawText.trim();

  if (!cleanText) return;

  const engines = settings.multiEngines?.length > 0 ? [...new Set(settings.multiEngines)] : [settings.searchEngine];

  for (let i = 0; i < engines.length; i++) {
    const text = buildSearchText(settings, cleanText, sourceTabUrl, engines[i]);
    if (!text) continue;
    const url = buildUrl(settings, text, engines[i]);
    if (!url) continue;
    await openUrl(url, settings, i === 0);
  }

  await addToHistory(cleanText, engines[0]);
}

function showBadgeNoText() {
  browser.action.setBadgeText({ text: "?" }).catch(() => {});
  browser.action.setBadgeBackgroundColor({ color: "#f59e0b" }).catch(() => {});
  setTimeout(() => browser.action.setBadgeText({ text: "" }).catch(() => {}), BADGE_CLEAR_DELAY_MS);
}

browser.commands.onCommand.addListener(async (command) => {
  if (command !== "search-selected") return;

  const settings = await getSettings();
  if (!settings.enabled) return;

  const tab = await getActiveTab();
  if (!tab || isRestrictedUrl(tab.url)) return;

  const result = await getSelectedTextFromTab(tab.id);
  if (!result) {
    // "Allow access to search page results" permission not granted in Opera Browser
    const isOpera = navigator.userAgent.includes("OPR/");
    const isWebPage = tab.url?.startsWith("http://") || tab.url?.startsWith("https://");
    if (isOpera && isWebPage) {
      await browser.storage.local.set({ operaSearchPermissionNeeded: true });
    }
    showBadgeNoText();
    return;
  }

  await browser.storage.local.remove("operaSearchPermissionNeeded");
  await performSearch(result.text, tab.url, settings, result.pageLang);
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const settings = await getSettings();

  if (info.menuItemId !== "search-selected") return;
  if (!info.selectionText?.trim() || !settings.enabled) return;

  let pageLang = null;
  if (tab?.id && settings.cleanupEnabled && settings.cleanupRules?.includes("locale")) {
    try {
      const result = await browser.tabs.sendMessage(tab.id, { type: "getSelection" });
      pageLang = result && typeof result === "object" ? result.pageLang ?? null : null;
    } catch {
      console.info("[Mark & Find] content script unavailable; proceed without pageLang");
    }
  }

  const activeTab = tab ?? (await getActiveTab());
  await performSearch(info.selectionText, activeTab?.url, settings, pageLang);
});

browser.runtime.onMessage.addListener((message, sender) => {
  switch (message.type) {
    case "selection-changed":
      updateContextMenuTitle(message.text || "", message.pageLang ?? null).catch((err) => console.warn("[Mark & Find] selection-changed error:", err));
      return false;

    case "auto-search":
      if (!message.text) return false;
      performSearch(message.text, sender.tab?.url, null, message.pageLang ?? null).catch((err) => console.warn("[Mark & Find] auto-search error:", err));
      return false;

    case "reSearch":
      if (!message.query) return false;
      getSettings()
        .then((settings) => {
          const engineKey = message.engine || settings.searchEngine;
          const url = buildUrl(settings, message.query, engineKey);
          if (url) return openUrl(url, settings, true);
        })
        .catch((err) => console.warn("[Mark & Find] reSearch error:", err));
      return false;

    default:
      return false;
  }
});

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === "install") await initStorage();
  await syncContextMenu();
});

browser.runtime.onStartup.addListener(async () => {
  await syncContextMenu();
});

browser.storage.onChanged.addListener((changes) => {
  if (changes.settings?.newValue) syncContextMenu().catch((err) => console.warn("[Mark & Find] syncContextMenu error:", err));
});
