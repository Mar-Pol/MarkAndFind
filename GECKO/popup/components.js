// ─────────────────────────────────────────────────────────────────────────────
// popup/components.js
// ─────────────────────────────────────────────────────────────────────────────

import { SEARCH_ENGINES, GROUPS, OPERATORS, FILETYPE_OPTIONS } from "../shared/constants.js";
import { i18n } from "./i18n.js";

function getEngineName(key) {
  const e = SEARCH_ENGINES[key];
  if (!e) return key;
  if (e.i18nKey) return i18n(e.i18nKey) || e.name;
  return e.fullName ?? e.name ?? key;
}

function engineIconUrl(key) {
  return key === "custom" || !SEARCH_ENGINES[key] ? null : `icons/engines/${key}.ico`;
}

function applyIcon(imgEl, key) {
  const url = engineIconUrl(key);
  if (url) {
    imgEl.src = url;
    imgEl.classList.remove("cs-icon--hidden");
    if (key === "github") imgEl.classList.add("cs-icon--github");
    imgEl.addEventListener("error", () => imgEl.classList.add("cs-icon--hidden"), { once: true });
  } else {
    imgEl.classList.add("cs-icon--hidden");
  }
}

function formatRelativeTime(ts, now) {
  if (!ts) return "";
  const diff = now - ts;
  if (diff < 60_000) return i18n("historyTimeNow") || "now";
  if (diff < 3_600_000) return i18n("historyTimeMinutes", [String(Math.floor(diff / 60_000))]) || Math.floor(diff / 60_000) + "m";
  if (diff < 86_400_000) return i18n("historyTimeHours", [String(Math.floor(diff / 3_600_000))]) || Math.floor(diff / 3_600_000) + "h";
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const _dropdownCloseCallbacks = new Set();

document.addEventListener("click", (e) => {
  _dropdownCloseCallbacks.forEach((cb) => cb(e));
});

/**
 * Build a custom engine selector into `container`.
 * @returns {{ getValue(): string, setValue(key: string): void, rebuild(favs: string[]): void, setDisabled(disabled: boolean): void }}
 */
export function buildEngineDropdown(container, initialKey, favorites, onChange) {
  let currentKey = initialKey || "google";
  let isOpen = false;

  const trigger = document.createElement("div");
  trigger.className = "cs-trigger";
  trigger.setAttribute("tabindex", "0");
  trigger.setAttribute("role", "combobox");
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const triggerIcon = document.createElement("img");
  triggerIcon.className = "cs-icon";
  triggerIcon.width = 14;
  triggerIcon.height = 14;
  triggerIcon.alt = "";

  const triggerLabel = document.createElement("span");
  triggerLabel.className = "cs-label";

  const triggerArrow = document.createElement("span");
  triggerArrow.className = "cs-arrow";
  triggerArrow.innerHTML = `<svg viewBox="0 0 10 6" width="10" height="6" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l4 4 4-4"/></svg>`;

  trigger.append(triggerIcon, triggerLabel, triggerArrow);

  const panel = document.createElement("div");
  panel.className = "cs-panel hidden";
  panel.setAttribute("role", "listbox");

  container.append(trigger, panel);

  function makeOption(key) {
    const item = document.createElement("div");
    item.className = "cs-option";
    item.dataset.value = key;
    item.setAttribute("role", "option");

    const ico = document.createElement("img");
    ico.className = "cs-icon";
    ico.width = 14;
    ico.height = 14;
    ico.alt = "";
    applyIcon(ico, key);

    const lbl = document.createElement("span");
    lbl.textContent = getEngineName(key);

    item.append(ico, lbl);
    item.addEventListener("mousedown", (e) => {
      e.preventDefault();
      selectKey(key);
      close();
      onChange(key);
    });
    return item;
  }

  function buildPanel(favs = []) {
    panel.innerHTML = "";

    const validFavs = favs.filter((k) => SEARCH_ENGINES[k] && k !== "custom");
    if (validFavs.length > 0) {
      const groupEl = document.createElement("div");
      groupEl.className = "cs-group";
      const groupLabel = document.createElement("span");
      groupLabel.className = "cs-group-label";
      groupLabel.textContent = i18n("groupFavorites") || "Favorites";
      groupEl.appendChild(groupLabel);
      validFavs.forEach((k) => groupEl.appendChild(makeOption(k)));
      panel.appendChild(groupEl);
    }

    GROUPS.forEach(({ key: groupKey, i18n: i18nKey, label }) => {
      const engines = Object.entries(SEARCH_ENGINES)
        .filter(([, e]) => e.group === groupKey)
        .sort(([, a], [, b]) => a.name.localeCompare(b.name));
      if (engines.length === 0) return;

      const groupEl = document.createElement("div");
      groupEl.className = "cs-group";
      const groupLabel = document.createElement("span");
      groupLabel.className = "cs-group-label";
      groupLabel.textContent = i18n(i18nKey) || label;
      groupEl.appendChild(groupLabel);
      engines.forEach(([k]) => groupEl.appendChild(makeOption(k)));
      panel.appendChild(groupEl);
    });
  }

  function updateTrigger(key) {
    applyIcon(triggerIcon, key);
    triggerLabel.textContent = getEngineName(key);
  }

  function selectKey(key) {
    currentKey = key;
    updateTrigger(key);
    panel.querySelectorAll(".cs-option").forEach((el) => {
      el.classList.toggle("cs-selected", el.dataset.value === key);
    });
  }

  function open() {
    isOpen = true;
    panel.classList.remove("hidden");
    trigger.setAttribute("aria-expanded", "true");
    panel.querySelector(".cs-selected")?.scrollIntoView({ block: "nearest" });
  }

  function close() {
    isOpen = false;
    panel.classList.add("hidden");
    trigger.setAttribute("aria-expanded", "false");
  }

  function outsideClickHandler(e) {
    if (!container.contains(e.target)) close();
  }
  _dropdownCloseCallbacks.add(outsideClickHandler);

  trigger.addEventListener("click", () => (isOpen ? close() : open()));

  trigger.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      isOpen ? close() : open();
      return;
    }
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) open();
      const opts = [...panel.querySelectorAll(".cs-option")];
      const idx = opts.findIndex((o) => o.dataset.value === currentKey);
      const next = e.key === "ArrowDown" ? opts[Math.min(idx + 1, opts.length - 1)] : opts[Math.max(idx - 1, 0)];
      if (next) {
        selectKey(next.dataset.value);
        onChange(next.dataset.value);
      }
    }
  });

  buildPanel(favorites);
  selectKey(currentKey);

  return {
    getValue: () => currentKey,
    setValue: (key) => selectKey(key),
    rebuild: (favs) => {
      buildPanel(favs);
      selectKey(currentKey);
    },
    setDisabled(disabled) {
      if (disabled) {
        trigger.setAttribute("disabled", "true");
        trigger.setAttribute("tabindex", "-1");
        container.classList.add("cs-wrap--disabled");
        close();
      } else {
        trigger.removeAttribute("disabled");
        trigger.setAttribute("tabindex", "0");
        container.classList.remove("cs-wrap--disabled");
      }
    },
    destroy() {
      _dropdownCloseCallbacks.delete(outsideClickHandler);
    },
  };
}

export function buildMultiEngineGrid(container, checkedEngines, favorites, onFavoriteToggle) {
  const SKIP_GROUPS = new Set(["custom"]);
  container.innerHTML = "";

  GROUPS.filter((g) => !SKIP_GROUPS.has(g.key)).forEach(({ key: groupKey, i18n: i18nKey, label }) => {
    const engines = Object.entries(SEARCH_ENGINES)
      .filter(([, e]) => e.group === groupKey)
      .sort(([, a], [, b]) => a.name.localeCompare(b.name));
    if (engines.length === 0) return;

    const groupLabel = document.createElement("span");
    groupLabel.className = "grid-group-label";
    groupLabel.textContent = i18n(i18nKey) || label;
    container.appendChild(groupLabel);

    engines.forEach(([key]) => {
      const lbl = document.createElement("label");
      lbl.className = "check-item";
      lbl.dataset.engineKey = key;

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = key;
      cb.checked = checkedEngines.includes(key);

      const ico = document.createElement("img");
      ico.className = "cs-icon check-icon";
      ico.width = 13;
      ico.height = 13;
      ico.alt = "";
      applyIcon(ico, key);

      const name = document.createElement("span");
      name.className = "check-name";
      name.textContent = getEngineName(key);
      name.title = SEARCH_ENGINES[key].fullName ?? "";

      const star = document.createElement("button");
      star.className = "fav-star" + (favorites.includes(key) ? " fav-star--active" : "");
      star.type = "button";
      star.dataset.starKey = key;
      star.innerHTML = `<svg viewBox="0 0 16 16" width="11" height="11" fill="currentColor"><path d="M8 1l1.85 3.75L14 5.5l-3 2.92.71 4.13L8 10.4l-3.71 2.15L5 8.42 2 5.5l4.15-.75z"/></svg>`;

      lbl.append(cb, ico, name, star);
      container.appendChild(lbl);
    });
  });

  container.addEventListener("click", (e) => {
    const star = e.target.closest("[data-star-key]");
    if (!star) return;
    e.preventDefault();
    const key = star.dataset.starKey;
    const isFav = favorites.includes(key);
    if (isFav) favorites.splice(favorites.indexOf(key), 1);
    else favorites.push(key);
    star.classList.toggle("fav-star--active", !isFav);
    onFavoriteToggle([...favorites]);
  });
}

function buildGoogleOperatorRow(op) {
  const row = document.createElement("div");
  row.className = "check-item check-item--toggle";
  row.dataset.operatorKey = op.key;

  const toggleLabel = document.createElement("label");
  toggleLabel.className = "toggle-switch";

  const cb = document.createElement("input");
  cb.type = "checkbox";
  cb.value = op.key;
  cb.className = "toggle-input";

  const slider = document.createElement("span");
  slider.className = "toggle-slider";

  toggleLabel.append(cb, slider);

  const nameWrap = document.createElement("div");
  nameWrap.className = "check-name-wrap";

  const span = document.createElement("span");
  span.className = "check-name";
  span.textContent = i18n(op.label) || op.key;

  const hint = document.createElement("span");
  hint.className = "check-hint";
  hint.textContent = i18n(op.hint) || "";

  nameWrap.append(span, hint);
  row.append(toggleLabel, nameWrap);
  return row;
}

export function buildOperatorPanel(container) {
  container.innerHTML = "";

  const standardOps = OPERATORS.filter((op) => !op.googleSpecial);
  standardOps.forEach(({ key, label, hint }) => {
    const lbl = document.createElement("label");
    lbl.className = "check-item";
    lbl.dataset.operatorKey = key;
    lbl.title = i18n(hint) || key;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = key;

    const span = document.createElement("span");
    span.className = "check-name";
    span.textContent = i18n(label) || key;

    lbl.append(cb, span);

    if (key === "filetype") {
      lbl.classList.add("check-item--wrap");

      const sel = document.createElement("select");
      sel.className = "filetype-select hidden";
      sel.id = "filetype-value";

      FILETYPE_OPTIONS.forEach(({ value, label: ftLabel }) => {
        const opt = document.createElement("option");
        opt.value = value;
        opt.textContent = ftLabel;
        sel.appendChild(opt);
      });

      cb.addEventListener("change", () => {
        sel.classList.toggle("hidden", !cb.checked);
      });

      lbl.appendChild(sel);
    }

    container.appendChild(lbl);
  });

  const dividerSection = document.createElement("div");
  dividerSection.className = "operator-google-section";
  dividerSection.dataset.googleSection = "true";

  const divider = document.createElement("div");
  divider.className = "operator-divider";

  const sectionLabel = document.createElement("span");
  sectionLabel.className = "operator-section-label";
  sectionLabel.textContent = i18n("operatorGoogleSectionLabel") || "Google";

  divider.appendChild(sectionLabel);
  dividerSection.appendChild(divider);

  const noaiOp = OPERATORS.find((op) => op.key === "noai");
  if (noaiOp) dividerSection.appendChild(buildGoogleOperatorRow(noaiOp));

  const udm14Op = OPERATORS.find((op) => op.key === "udm14");
  if (udm14Op) dividerSection.appendChild(buildGoogleOperatorRow(udm14Op));

  container.appendChild(dividerSection);
}

export function applyOperatorSupport(panel, hintEl, supportedOperators) {
  const isDisabled = supportedOperators.length === 0;
  panel.classList.toggle("operator-panel--disabled", isDisabled);

  const googleSection = panel.querySelector("[data-google-section]");
  if (googleSection) {
    const googleSupportsAny = supportedOperators.includes("noai") || supportedOperators.includes("udm14");
    googleSection.classList.toggle("hidden", !googleSupportsAny);
  }

  panel.querySelectorAll("label[data-operator-key]").forEach((lbl) => {
    const key = lbl.dataset.operatorKey;
    const cb = lbl.querySelector("input");
    const ok = supportedOperators.includes(key);
    lbl.classList.toggle("check-item--disabled", !ok);
    if (cb) {
      cb.disabled = !ok;
      if (!ok) cb.checked = false;
    }
  });

  panel.querySelectorAll("div[data-operator-key]").forEach((row) => {
    const key = row.dataset.operatorKey;
    const cb = row.querySelector("input");
    const ok = supportedOperators.includes(key);
    row.classList.toggle("check-item--disabled", !ok);
    if (cb) {
      cb.disabled = !ok;
      if (!ok) cb.checked = false;
    }
  });

  hintEl.textContent = isDisabled ? i18n("operatorUnavailable") || "Not supported by the selected search engine." : "";
}

export function syncNoaiUdm14State(panel, changed) {
  const noaiCb = panel.querySelector("input[value='noai']");
  const udm14Cb = panel.querySelector("input[value='udm14']");
  if (!noaiCb || !udm14Cb) return;

  if (changed === "noai" && noaiCb.checked) udm14Cb.checked = false;
  if (changed === "udm14" && udm14Cb.checked) noaiCb.checked = false;
}

export function renderHistory(container, history, onClear, onItemClick, onDeleteItem) {
  container.innerHTML = "";

  if (!history?.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = i18n("historyEmpty") || "No searches yet.";
    container.appendChild(empty);
    return;
  }

  const clearBtn = document.createElement("button");
  clearBtn.className = "history-clear-btn";
  clearBtn.textContent = i18n("historyClear") || "Clear history";
  clearBtn.addEventListener("click", onClear);
  container.appendChild(clearBtn);

  const now = Date.now();

  history.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "history-row";
    row.dataset.historyIndex = index;

    const ico = document.createElement("img");
    ico.className = "cs-icon history-engine-ico";
    ico.width = 13;
    ico.height = 13;
    ico.alt = "";
    applyIcon(ico, item.engine);

    const text = document.createElement("span");
    text.className = "history-text";
    text.textContent = item.query;
    text.title = item.query;

    const time = document.createElement("span");
    time.className = "history-time";
    time.textContent = formatRelativeTime(item.ts, now);

    const del = document.createElement("button");
    del.className = "history-delete-btn";
    del.title = i18n("btnDeleteHistoryItem") || "Delete";
    del.type = "button";
    del.dataset.deleteIndex = index;
    del.innerHTML = `<svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 1l8 8M9 1L1 9"/></svg>`;

    row.append(ico, text, time, del);
    container.appendChild(row);
  });

  container.addEventListener("click", (e) => {
    const deleteBtn = e.target.closest("[data-delete-index]");
    if (deleteBtn) {
      e.stopPropagation();
      onDeleteItem(+deleteBtn.dataset.deleteIndex);
      return;
    }
    const row = e.target.closest(".history-row");
    if (row) onItemClick(history[+row.dataset.historyIndex]);
  });
}
