/* global browser */

// ─────────────────────────────────────────────────────────────────────────────
// popup/index.js
// ─────────────────────────────────────────────────────────────────────────────

import { DEFAULT_SETTINGS, SEARCH_ENGINES, RESTRICTED_URL_PREFIXES, RESTRICTED_DOMAINS } from "../shared/constants.js";
import { getSettings, saveSettings, getHistory, clearHistory, removeHistoryItem } from "../shared/settings.js";
import { validateCustomUrl } from "../shared/validators.js";
import { applyI18n, i18n } from "./i18n.js";
import { buildEngineDropdown, buildMultiEngineGrid, buildOperatorPanel, applyOperatorSupport, syncNoaiUdm14State, renderHistory } from "./components.js";

const TIMING = {
  savedMsgDuration: 1_500,
  debounceSave: 500,
  autoDelayMin: 1_000,
  autoDelayMax: 30_000,
  autoDelayUnit: 1_000,
};

const DEFAULTS = {
  shortcutKeys: ["Ctrl", "Shift", "F"],
};

const els = {
  // Header
  headerVersion: document.getElementById("header-version"),
  aboutVersion: document.getElementById("about-version"),
  savedMsg: document.getElementById("saved-msg"),

  // Enable toggle
  enabled: document.getElementById("toggle-enabled"),

  // Tabs
  tabBtns: document.querySelectorAll(".tab-btn"),
  tabContents: document.querySelectorAll(".tab-content"),

  // Search engine
  engineWrap: document.getElementById("search-engine"),

  // Custom engine
  customFields: document.getElementById("custom-fields"),
  customName: document.getElementById("custom-engine-name"),
  customUrl: document.getElementById("custom-engine-url"),
  customUrlError: document.getElementById("custom-url-error"),

  // Multi-engine
  multiToggle: document.getElementById("multi-engine-toggle"),
  multiPanel: document.getElementById("multi-engine-panel"),
  multiGrid: document.getElementById("multi-engine-grid"),

  // Open in
  openIn: document.getElementById("open-in"),
  openInMultiHint: document.getElementById("open-in-multi-hint"),
  privateWarn: document.getElementById("private-warn"),

  // Auto-search
  autoSearch: document.getElementById("auto-search"),
  autoDelayRow: document.getElementById("auto-delay-row"),
  autoDelay: document.getElementById("auto-delay"),

  // Operators
  operatorToggle: document.getElementById("operator-toggle"),
  operatorPanel: document.getElementById("operator-panel"),
  operatorHint: document.getElementById("operator-hint"),

  // Text cleanup
  cleanupToggle: document.getElementById("cleanup-toggle"),
  cleanupPanel: document.getElementById("cleanup-panel"),
  cleanupWhitespace: document.getElementById("cleanup-whitespace"),
  cleanupLocale: document.getElementById("cleanup-locale"),
  cleanupSeparators: document.getElementById("cleanup-separators"),

  // Shortcut
  shortcutDisplay: document.getElementById("shortcut-display"),
  shortcutHint: document.getElementById("shortcut-hint"),

  // History
  historyToggle: document.getElementById("history-enabled"),
  historyContainer: document.getElementById("history-list"),

  // Operator panel children (populated after buildOperatorPanel)
  filetypeSel: null,
};

const ERROR_KEYS = {
  invalidUrl: "customUrlErrInvalid",
  badProtocol: "customUrlErrProtocol",
  noQuerySlot: "customUrlErrNoQuery",
};

function showCustomUrlError(result) {
  const msg = i18n(ERROR_KEYS[result]) || result;
  els.customUrl.classList.add("input-error");
  els.customUrl.classList.remove("input-ok");
  els.customUrlError.textContent = msg;
  els.customUrlError.classList.remove("hidden");
}

function clearCustomUrlError() {
  els.customUrl.classList.remove("input-error", "input-ok");
  els.customUrlError.classList.add("hidden");
}

function handleCustomUrlInput() {
  const result = validateCustomUrl(els.customUrl.value);
  if (result === "empty") {
    clearCustomUrlError();
    return;
  }
  if (result === "ok") {
    els.customUrl.classList.add("input-ok");
    clearCustomUrlError();
    return;
  }
  showCustomUrlError(result);
}

function cloneSvg(id) {
  return document.getElementById(id).content.cloneNode(true).firstElementChild;
}

function createBanner(svgId, extraClass) {
  const banner = document.createElement("div");
  banner.className = "restricted-banner" + (extraClass ? " " + extraClass : "");
  banner.appendChild(cloneSvg(svgId));
  return banner;
}

function updateCustomVisibility(engineDropdown) {
  els.customFields.classList.toggle("hidden", engineDropdown.getValue() !== "custom");
}

function updateAutoDelayVisibility() {
  els.autoDelayRow.classList.toggle("hidden", !els.autoSearch.checked);
}

function updateMultiVisibility() {
  els.multiPanel.classList.toggle("hidden", !els.multiToggle.checked);
}

function updateSameTabOption() {
  const isMulti = els.multiToggle.checked;
  const sameTabOpt = els.openIn.querySelector('option[value="same-tab"]');
  sameTabOpt.disabled = isMulti;
  if (isMulti && els.openIn.value === "same-tab") els.openIn.value = "new-tab";
  els.openInMultiHint.classList.toggle("hidden", !isMulti);
}

function updateEngineDropdownDisabled(engineDropdown) {
  engineDropdown.setDisabled(els.multiToggle.checked);
}

function updateOperatorSupport(engineDropdown) {
  const engine = SEARCH_ENGINES[engineDropdown.getValue()];
  applyOperatorSupport(els.operatorPanel, els.operatorHint, engine?.operators ?? []);
}

function updateOperatorPanelVisibility() {
  els.operatorPanel.classList.toggle("hidden", !els.operatorToggle.checked);
}

function updateCleanupPanelVisibility() {
  els.cleanupPanel.classList.toggle("hidden", !els.cleanupToggle.checked);
}

function updateAllVisibility(engineDropdown) {
  updateCustomVisibility(engineDropdown);
  updateAutoDelayVisibility();
  updateMultiVisibility();
  updateSameTabOption();
  updateEngineDropdownDisabled(engineDropdown);
  updateOperatorSupport(engineDropdown);
  updateOperatorPanelVisibility();
  updateCleanupPanelVisibility();
}

function collectOperators() {
  return Array.from(els.operatorPanel.querySelectorAll("input[type=checkbox]:checked")).map((cb) => {
    if (cb.value === "filetype") return "filetype:" + (els.filetypeSel?.value || "pdf");
    return cb.value;
  });
}

function collectMultiEngines() {
  if (!els.multiToggle.checked) return [];
  return Array.from(els.multiGrid.querySelectorAll("input[type=checkbox]:checked")).map((cb) => cb.value);
}

function collectSettings(engineDropdown, favorites) {
  const delayRaw = parseInt(els.autoDelay.value, 10);
  const delayMs = isNaN(delayRaw) ? DEFAULT_SETTINGS.autoSearchDelay : Math.min(TIMING.autoDelayMax, Math.max(TIMING.autoDelayMin, delayRaw * TIMING.autoDelayUnit));

  const cleanupRules = [];
  if (els.cleanupWhitespace.checked) cleanupRules.push("whitespace");
  if (els.cleanupLocale.checked) cleanupRules.push("locale");
  if (els.cleanupSeparators.checked) cleanupRules.push("separators");

  return {
    searchEngine: engineDropdown.getValue(),
    multiEngines: collectMultiEngines(),
    enabled: els.enabled.checked,
    openIn: els.openIn.value,
    autoSearch: els.autoSearch.checked,
    autoSearchDelay: delayMs,
    operatorsEnabled: els.operatorToggle.checked,
    searchOperators: collectOperators(),
    cleanupEnabled: els.cleanupToggle.checked,
    cleanupRules,
    customEngineUrl: els.customUrl.value.trim(),
    customEngineName: els.customName.value.trim() || "Custom",
    favoriteEngines: [...favorites],
    historyEnabled: els.historyToggle?.checked ?? true,
  };
}

let saveTimer = null;
let savedMsgTimer = null;

async function saveCurrentSettings(engineDropdown, favorites) {
  if (engineDropdown.getValue() === "custom") {
    const result = validateCustomUrl(els.customUrl.value);
    if (result !== "ok" && result !== "empty") {
      showCustomUrlError(result);
      return;
    }
  }

  const settings = collectSettings(engineDropdown, favorites);
  await saveSettings(settings);

  els.savedMsg.classList.add("visible");
  clearTimeout(savedMsgTimer);
  savedMsgTimer = setTimeout(() => els.savedMsg.classList.remove("visible"), TIMING.savedMsgDuration);
}

function debouncedSave(engineDropdown, favorites) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveCurrentSettings(engineDropdown, favorites), TIMING.debounceSave);
}

function syncUI(s, engineDropdown, favorites) {
  els.enabled.checked = s.enabled;

  favorites.length = 0;
  const loadedFavs = Array.isArray(s.favoriteEngines) ? s.favoriteEngines : [];
  loadedFavs.forEach((f) => favorites.push(f));

  engineDropdown.rebuild(favorites);
  engineDropdown.setValue(s.searchEngine);

  const multiEngines = Array.isArray(s.multiEngines) ? s.multiEngines : [];
  els.multiToggle.checked = multiEngines.length > 0;
  buildMultiEngineGrid(els.multiGrid, multiEngines, favorites, (newFavs) => {
    favorites.length = 0;
    newFavs.forEach((f) => favorites.push(f));
    engineDropdown.rebuild(favorites);
    debouncedSave(engineDropdown, favorites);
  });

  els.openIn.value = s.openIn;
  els.autoSearch.checked = s.autoSearch;
  els.autoDelay.value = Math.max(1, Math.round(s.autoSearchDelay / 1000));

  els.operatorToggle.checked = s.operatorsEnabled;
  const savedOps = Array.isArray(s.searchOperators) ? s.searchOperators : [];
  els.operatorPanel.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.checked = savedOps.includes(cb.value);
  });

  const filetypeOp = savedOps.find((op) => op.startsWith("filetype:"));
  if (els.filetypeSel) {
    if (filetypeOp) {
      els.filetypeSel.value = filetypeOp.slice("filetype:".length);
      els.filetypeSel.classList.remove("hidden");
      const ftCb = els.operatorPanel.querySelector('input[value="filetype"]');
      if (ftCb) ftCb.checked = true;
    } else {
      els.filetypeSel.classList.add("hidden");
    }
  }

  els.cleanupToggle.checked = s.cleanupEnabled;
  const rules = Array.isArray(s.cleanupRules) ? s.cleanupRules : [];
  els.cleanupWhitespace.checked = rules.includes("whitespace");
  els.cleanupLocale.checked = rules.includes("locale");
  els.cleanupSeparators.checked = rules.includes("separators");

  els.customName.value = s.customEngineName;
  els.customUrl.value = s.customEngineUrl;

  if (els.historyToggle) els.historyToggle.checked = s.historyEnabled;

  updateAllVisibility(engineDropdown);
}

async function updatePrivateWarn() {
  if (els.openIn.value !== "private-window") {
    els.privateWarn.classList.add("hidden");
    return;
  }
  try {
    const isGecko = navigator.userAgent.includes("Firefox");
    let hasPermission = false;

    if (isGecko && browser.extension?.isAllowedIncognitoAccess) {
      hasPermission = await browser.extension.isAllowedIncognitoAccess();
    } else if (isGecko) {
      const ext = await browser.management.getSelf();
      hasPermission = ext.permissions?.includes("privateBrowsingAllowed") ?? false;
    } else {
      hasPermission = await browser.extension.isAllowedIncognitoAccess();
    }

    if (hasPermission) {
      els.privateWarn.classList.add("hidden");
    } else {
      els.privateWarn.textContent = i18n(isGecko ? "privateWarnFirefox" : "privateWarnChrome") || "";
      els.privateWarn.classList.remove("hidden");
    }
  } catch (err) {
    console.warn("[Mark & Find] updatePrivateWarn error:", err.message);
    els.privateWarn.classList.add("hidden");
  }
}

async function renderShortcut() {
  let keys = DEFAULTS.shortcutKeys;
  try {
    const commands = await browser.commands.getAll();
    const cmd = commands.find((c) => c.name === "search-selected");
    if (cmd?.shortcut) keys = cmd.shortcut.split("+").map((k) => k.trim());
    else if (cmd) keys = [];
  } catch (err) {
    console.warn("[Mark & Find] commands API unavailable (fall back to default display)", err.message);
  }

  els.shortcutDisplay.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "shortcut-btn";
  btn.title = i18n("btnChangeShortcut") || "Change shortcut";

  if (keys.length === 0) {
    const placeholder = document.createElement("span");
    placeholder.className = "shortcut-none";
    placeholder.textContent = i18n("shortcutClearedBtn") || "No shortcut set. Click to configure.";
    btn.appendChild(placeholder);
    els.shortcutHint.classList.add("warn");
  } else {
    els.shortcutHint.classList.remove("warn");
    keys.forEach((k, i) => {
      const kbd = document.createElement("kbd");
      kbd.textContent = k;
      btn.appendChild(kbd);
      if (i < keys.length - 1) {
        const sep = document.createElement("span");
        sep.className = "kbd-plus";
        sep.textContent = "+";
        btn.appendChild(sep);
      }
    });
  }

  els.shortcutHint.textContent = i18n("shortcutDefault") || "Default: Ctrl+Shift+F";

  btn.addEventListener("click", async () => {
    if (navigator.userAgent.includes("Firefox")) {
      if (typeof browser.commands.openShortcutSettings === "function") {
        try {
          await browser.commands.openShortcutSettings();
        } catch (err) {
          console.warn("[Mark & Find] openShortcutSettings failed, falling back to about:addons:", err.message);
          await browser.tabs.create({ url: "about:addons" });
        }
      } else {
        els.shortcutHint.classList.add("warn");
        els.shortcutHint.textContent = i18n("shortcutSettingsNotSupported");
      }
    } else {
      await browser.tabs.create({ url: "chrome://extensions/shortcuts" });
    }
    if (typeof browser.commands.openShortcutSettings === "function" || !navigator.userAgent.includes("Firefox")) {
      window.close();
    }
  });

  els.shortcutDisplay.appendChild(btn);
}

async function loadAndRenderHistory() {
  if (!els.historyContainer) return;
  const history = await getHistory();
  renderHistory(
    els.historyContainer,
    history,
    async () => {
      await clearHistory();
      await loadAndRenderHistory();
    },
    (item) => {
      browser.runtime.sendMessage({ type: "reSearch", query: item.query, engine: item.engine });
      window.close();
    },
    async (index) => {
      await removeHistoryItem(index);
      await loadAndRenderHistory();
    }
  );
}

async function checkRestrictedPage() {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;
    const isRestricted = RESTRICTED_URL_PREFIXES.some((p) => tab.url.startsWith(p));
    if (!isRestricted) {
      try {
        const { hostname, pathname } = new URL(tab.url);
        const domainMatch =
          /^(addons|extensions?)\..+/.test(hostname) ||
          RESTRICTED_DOMAINS.some((domain) => (hostname + pathname).startsWith(domain));
        if (!domainMatch) return;
      } catch {
        return;
      }
    }
    const banner = createBanner("svg-info");
    const span = document.createElement("span");
    span.className = "restricted-banner__text";
    span.textContent = i18n("restrictedPageNotice") || "Keyboard shortcut and auto-search are not available on this page.";
    banner.appendChild(span);
    const nav = document.querySelector("nav.tabs");
    nav ? nav.before(banner) : document.body.prepend(banner);
  } catch (err) {
    console.warn("[Mark & Find] checkRestrictedPage error:", err.message);
  }
}

async function checkOperaSearchPermission() {
  try {
    const data = await browser.storage.local.get("operaSearchPermissionNeeded");
    if (!data.operaSearchPermissionNeeded) return;

    const banner = createBanner("svg-warn", "restricted-banner--error");
    const wrap = document.createElement("span");
    wrap.className = "restricted-banner__text";

    const fullText =
      i18n("operaSearchPermissionNotice") ||
      'Keyboard shortcut may not work without permission. In Opera, open opera://extensions and enable "Allow access to search page results" for this extension.';

    const parts = fullText.split("opera://extensions");
    const link = document.createElement("a");
    link.textContent = "opera://extensions";
    link.className = "restricted-banner__link";
    link.addEventListener("click", async (e) => {
      e.preventDefault();
      await browser.tabs.create({ url: "opera://extensions" });
      window.close();
    });

    wrap.appendChild(document.createTextNode(parts[0]));
    wrap.appendChild(link);
    if (parts[1]) wrap.appendChild(document.createTextNode(parts[1]));

    const dismiss = document.createElement("button");
    dismiss.className = "restricted-banner__dismiss";
    dismiss.textContent = "×";
    dismiss.addEventListener("click", async () => {
      await browser.storage.local.remove("operaSearchPermissionNeeded");
      banner.remove();
    });

    banner.append(wrap, dismiss);

    const nav = document.querySelector("nav.tabs");
    nav ? nav.before(banner) : document.body.prepend(banner);
  } catch (err) {
    console.warn("[Mark & Find] checkOperaSearchPermission error:", err.message);
  }
}

async function init() {
  applyI18n();

  const { version } = browser.runtime.getManifest();
  if (els.headerVersion) els.headerVersion.textContent = `v${version}`;
  if (els.aboutVersion) els.aboutVersion.textContent = `${i18n("aboutVersion")} ${version}`;

  const settings = await getSettings();

  const favorites = Array.isArray(settings.favoriteEngines) ? [...settings.favoriteEngines] : [];

  const dropdownWrap = document.createElement("div");
  dropdownWrap.className = "cs-wrap";
  els.engineWrap.replaceWith(dropdownWrap);

  const engineDropdown = buildEngineDropdown(dropdownWrap, settings.searchEngine, favorites, () => {
    updateCustomVisibility(engineDropdown);
    updateOperatorSupport(engineDropdown);
    debouncedSave(engineDropdown, favorites);
  });

  buildOperatorPanel(els.operatorPanel);
  els.filetypeSel = document.getElementById("filetype-value");

  els.enabled.addEventListener("change", () => saveCurrentSettings(engineDropdown, favorites));

  els.tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      els.tabBtns.forEach((b) => b.classList.remove("active"));
      els.tabContents.forEach((t) => t.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
      if (btn.dataset.tab === "history") loadAndRenderHistory();
    });
  });

  els.customName.addEventListener("input", () => debouncedSave(engineDropdown, favorites));
  els.customUrl.addEventListener("input", () => {
    handleCustomUrlInput();
    debouncedSave(engineDropdown, favorites);
  });

  els.multiToggle.addEventListener("change", () => {
    // Uncheck all in a Multi-engine, when is toggle off
    /* if (!els.multiToggle.checked) {
      els.multiGrid.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = false));
    } */

    updateMultiVisibility();
    updateSameTabOption();
    updateEngineDropdownDisabled(engineDropdown);
    saveCurrentSettings(engineDropdown, favorites);
  });
  els.multiGrid.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") saveCurrentSettings(engineDropdown, favorites);
  });

  els.openIn.addEventListener("change", async () => {
    await updatePrivateWarn();
    saveCurrentSettings(engineDropdown, favorites);
  });

  els.autoSearch.addEventListener("change", () => {
    updateAutoDelayVisibility();
    saveCurrentSettings(engineDropdown, favorites);
  });
  els.autoDelay.addEventListener("input", () => debouncedSave(engineDropdown, favorites));

  els.operatorToggle.addEventListener("change", () => {
    updateOperatorPanelVisibility();
    updateOperatorSupport(engineDropdown);
    saveCurrentSettings(engineDropdown, favorites);
  });
  els.operatorPanel.addEventListener("change", (e) => {
    if (e.target.type === "checkbox" || e.target.tagName === "SELECT") {
      if (e.target.value === "noai" || e.target.value === "udm14") {
        syncNoaiUdm14State(els.operatorPanel, e.target.value);
      }
      saveCurrentSettings(engineDropdown, favorites);
    }
  });

  els.cleanupToggle.addEventListener("change", () => {
    updateCleanupPanelVisibility();
    saveCurrentSettings(engineDropdown, favorites);
  });
  els.cleanupPanel.addEventListener("change", (e) => {
    if (e.target.type === "checkbox") saveCurrentSettings(engineDropdown, favorites);
  });

  if (els.historyToggle) {
    els.historyToggle.addEventListener("change", () => saveCurrentSettings(engineDropdown, favorites));
  }

  document.getElementById("btn-options").addEventListener("click", () => {
    browser.runtime.openOptionsPage();
  });

  syncUI(settings, engineDropdown, favorites);
  await updatePrivateWarn();
  await renderShortcut();
  await checkRestrictedPage();
  await checkOperaSearchPermission();
}

document.addEventListener("DOMContentLoaded", init);
