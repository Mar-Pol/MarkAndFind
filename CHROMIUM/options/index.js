/* global browser */

// ─────────────────────────────────────────────────────────────────────────────
// options/index.js
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_SETTINGS } from "../shared/constants.js";
import { saveSettings } from "../shared/settings.js";
import { applyI18n, i18n } from "../popup/i18n.js";

const TIMING = {
  statusMsgDuration: 4_000,
  resetConfirmWindow: 3_000,
  revokeUrlDelay: 3_000,
};

const LIMITS = {
  importMaxBytes: 100_000,
};

function showStatus(msgKey, success = true) {
  const el = document.getElementById("import-status");
  el.textContent = i18n(msgKey) || msgKey;
  el.classList.toggle("success", success);
  el.classList.toggle("warn", !success);
  el.classList.remove("hidden");
  setTimeout(() => {
    el.classList.add("hidden");
    el.classList.remove("success", "warn");
  }, TIMING.statusMsgDuration);
}

async function exportSettings() {
  const s = await browser.storage.local.get("settings").then((d) => d.settings || {});
  const commands = await browser.commands.getAll();
  const cmd = commands.find((c) => c.name === "search-selected");

  const ordered = {
    enabled: s.enabled,
    searchEngine: s.searchEngine,
    multiEngines: s.multiEngines,
    favoriteEngines: s.favoriteEngines,
    openIn: s.openIn,
    autoSearch: s.autoSearch,
    autoSearchDelay: s.autoSearchDelay,
    operatorsEnabled: s.operatorsEnabled,
    searchOperators: s.searchOperators,
    cleanupEnabled: s.cleanupEnabled,
    cleanupRules: s.cleanupRules,
    customEngineName: s.customEngineName,
    customEngineUrl: s.customEngineUrl,
    historyEnabled: s.historyEnabled,
    shortcut: cmd?.shortcut || null,
  };

  const blob = new Blob([JSON.stringify(ordered, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  try {
    await browser.downloads.download({ url, filename: "mark-and-find-settings.json", saveAs: false });
  } catch (err) {
    console.warn("[Mark & Find] exportSettings error:", err.message);
  }
  setTimeout(() => URL.revokeObjectURL(url), TIMING.revokeUrlDelay);
}

async function importSettings(file) {
  if (file.size > LIMITS.importMaxBytes) {
    showStatus("importError", false);
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (typeof parsed !== "object" || Array.isArray(parsed) || parsed === null) {
      throw new Error("not an object");
    }

    const hasKnownKey = Object.keys(DEFAULT_SETTINGS).some((k) => k in parsed);
    if (!hasKnownKey) throw new Error("no known keys");

    const merged = { ...DEFAULT_SETTINGS, ...parsed };
    await saveSettings(merged);
    showStatus("importSuccess", true);

    if (merged.shortcut) await renderShortcut(merged.shortcut);
  } catch (err) {
    console.error("[Mark & Find] importSettings failed:", err.message);
    showStatus("importError", false);
  }
}

async function renderShortcut(importedShortcut) {
  if (!importedShortcut) return;

  const shortcutRow = document.getElementById("shortcut-row");
  const shortcutEl = document.getElementById("options-shortcut");
  const shortcutNote = document.getElementById("shortcut-note");

  let currentShortcut = null;
  try {
    const commands = await browser.commands.getAll();
    const cmd = commands.find((c) => c.name === "search-selected");
    currentShortcut = cmd?.shortcut || null;
  } catch (err) {
    console.warn("[Mark & Find] renderShortcut: browser.commands unavailable:", err.message);
  }

  shortcutEl.textContent = importedShortcut;
  shortcutRow.classList.remove("hidden");

  const match = !!currentShortcut && importedShortcut === currentShortcut;
  shortcutNote.textContent = i18n(match ? "optionsShortcutMatch" : "optionsShortcutImported");
}

function initResetButton() {
  const btn = document.getElementById("btn-reset");
  let resetPending = false;
  let resetTimer = null;

  btn.addEventListener("click", async () => {
    if (!resetPending) {
      resetPending = true;
      btn.textContent = i18n("resetConfirm") || "Are you sure?";
      resetTimer = setTimeout(() => {
        resetPending = false;
        btn.textContent = i18n("btnResetSettings") || "Reset to defaults";
      }, TIMING.resetConfirmWindow);
      return;
    }

    clearTimeout(resetTimer);
    resetPending = false;
    btn.textContent = i18n("btnResetSettings") || "Reset to defaults";

    await saveSettings({ ...DEFAULT_SETTINGS });
    showStatus("resetSuccess", true);
  });
}

function initListeners() {
  document.getElementById("btn-export").addEventListener("click", exportSettings);

  document.getElementById("btn-import").addEventListener("click", () => {
    document.getElementById("import-file").click();
  });

  document.getElementById("import-file").addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importSettings(file);
    e.target.value = "";
  });

  initResetButton();
}

async function init() {
  applyI18n();

  const { version } = browser.runtime.getManifest();
  const verEl = document.getElementById("about-version");
  if (verEl) verEl.textContent = `${i18n("aboutVersion") || "Version"} ${version}`;

  initListeners();
}

document.addEventListener("DOMContentLoaded", init);
