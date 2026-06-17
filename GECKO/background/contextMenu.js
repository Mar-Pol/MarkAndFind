/* global browser */

// ─────────────────────────────────────────────────────────────────────────────
// background/contextMenu.js
// ─────────────────────────────────────────────────────────────────────────────

import { getSettings } from "../shared/settings.js";
import { sanitizeText } from "../shared/validators.js";

let lastSyncedState = null;

export async function syncContextMenu() {
  const settings = await getSettings();
  const next = {
    enabled: settings.enabled,
  };

  const unchanged = lastSyncedState !== null && lastSyncedState.enabled === next.enabled;

  if (unchanged) return;

  lastSyncedState = next;

  await browser.contextMenus.removeAll();

  await browser.contextMenus.create({
    id: "search-selected",
    title: browser.i18n.getMessage("contextMenuSearch"),
    contexts: ["selection"],
    enabled: next.enabled,
  });

  await browser.action
    .setIcon({
      path: {
        48: next.enabled ? "/icons/icon.png" : "/icons/icon-disabled.png",
      },
    })
    .catch((err) => console.warn("[Mark & Find] setIcon error:", err));

  await browser.action.setBadgeText({ text: "" }).catch(() => {});
}

export async function updateContextMenuTitle(rawText, pageLang) {
  const settings = await getSettings();
  if (!settings.enabled) return;

  let cleanText = rawText.trim();
  let newTitle;

  if (cleanText) {
    if (settings.cleanupEnabled) {
      cleanText = sanitizeText(rawText, settings.cleanupRules ?? [], pageLang);
    }

    const maxLen = 30;
    const truncated = cleanText.length > maxLen ? cleanText.slice(0, maxLen) + "..." : cleanText;

    newTitle = browser.i18n.getMessage("contextMenuSearchSelected", [truncated]);
  } else {
    newTitle = browser.i18n.getMessage("contextMenuSearch");
  }

  await browser.contextMenus
    .update("search-selected", {
      title: newTitle,
    })
    .catch((err) => console.warn("[Mark & Find] contextMenus.update error:", err.message));
}
