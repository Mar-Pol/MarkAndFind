/* global browser */

// ─────────────────────────────────────────────────────────────────────────────
// shared/settings.js
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_SETTINGS, HISTORY_MAX } from "./constants.js";

/**
 * Read settings from storage, merged with DEFAULT_SETTINGS.
 * Always returns a complete object — missing keys fall back to defaults.
 *
 * @returns {Promise<typeof DEFAULT_SETTINGS>}
 */
export async function getSettings() {
  try {
    const data = await browser.storage.local.get("settings");
    return { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  } catch (err) {
    console.warn("[Mark & Find] getSettings error:", err.message);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Persist a partial or full settings object.
 * Merges with existing stored settings so callers can pass only changed keys.
 *
 * @param {Partial<typeof DEFAULT_SETTINGS>} partial
 * @returns {Promise<void>}
 */
export async function patchSettings(partial) {
  try {
    const current = await getSettings();
    await browser.storage.local.set({ settings: { ...current, ...partial } });
  } catch (err) {
    console.warn("[Mark & Find] patchSettings error:", err.message);
  }
}

/**
 * Overwrite the full settings object.
 * Use this when you have collected the complete settings state (e.g. popup save).
 *
 * @param {typeof DEFAULT_SETTINGS} settings
 * @returns {Promise<void>}
 */
export async function saveSettings(settings) {
  try {
    await browser.storage.local.set({ settings });
  } catch (err) {
    console.warn("[Mark & Find] saveSettings error:", err.message);
  }
}

/**
 * Append a search entry to history if historyEnabled.
 * Trims to HISTORY_MAX entries automatically.
 *
 * @param {string} engine  — engine key (e.g. "google")
 */
export async function addToHistory(query, engine) {
  const settings = await getSettings();
  if (!settings.historyEnabled) return;

  try {
    const data = await browser.storage.local.get("searchHistory");
    const history = Array.isArray(data.searchHistory) ? data.searchHistory : [];

    history.unshift({ query, engine, ts: Date.now() });

    await browser.storage.local.set({
      searchHistory: history.slice(0, HISTORY_MAX),
    });
  } catch (err) {
    console.warn("[Mark & Find] addToHistory error:", err.message);
  }
}

/**
 * Return the full history array, newest first.
 *
 * @returns {Promise<Array<{query: string, engine: string, ts: number}>>}
 */
export async function getHistory() {
  try {
    const data = await browser.storage.local.get("searchHistory");
    return Array.isArray(data.searchHistory) ? data.searchHistory : [];
  } catch (err) {
    console.warn("[Mark & Find] getHistory error:", err.message);
    return [];
  }
}

export async function clearHistory() {
  try {
    await browser.storage.local.set({ searchHistory: [] });
  } catch (err) {
    console.warn("[Mark & Find] clearHistory error:", err.message);
  }
}

export async function removeHistoryItem(index) {
  try {
    const data = await browser.storage.local.get("searchHistory");
    const history = Array.isArray(data.searchHistory) ? data.searchHistory : [];
    history.splice(index, 1);
    await browser.storage.local.set({ searchHistory: history });
  } catch (err) {
    console.warn("[Mark & Find] removeHistoryItem error:", err.message);
  }
}

/**
 * Ensure storage is initialised on first install.
 * Skips writing if settings already exist.
 *
 * @returns {Promise<void>}
 */
export async function initStorage() {
  try {
    const data = await browser.storage.local.get("settings");
    if (!data.settings) {
      await browser.storage.local.set({ settings: { ...DEFAULT_SETTINGS } });
    }
  } catch (err) {
    console.warn("[Mark & Find] initStorage error:", err.message);
  }
}
