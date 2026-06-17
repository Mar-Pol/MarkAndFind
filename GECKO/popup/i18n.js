/* global browser */

// ─────────────────────────────────────────────────────────────────────────────
// popup/i18n.js
// ─────────────────────────────────────────────────────────────────────────────

export function i18n(key, substitutions) {
  try {
    return (typeof browser !== "undefined" && browser.i18n.getMessage(key, substitutions)) || "";
  } catch {
    return "";
  }
}

export function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const msg = i18n(el.dataset.i18n);
    if (msg) el.textContent = msg;
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const msg = i18n(el.dataset.i18nTitle);
    if (msg) el.title = msg;
  });
}
