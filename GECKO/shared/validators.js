// ─────────────────────────────────────────────────────────────────────────────
// shared/validators.js
// ─────────────────────────────────────────────────────────────────────────────

import { SEARCH_ENGINES, OPERATOR_SYNTAX } from "./constants.js";
import { ISO_639_1 } from "./lang-codes.js";

/** @typedef {"ok" | "empty" | "invalidUrl" | "badProtocol" | "noQuerySlot"} UrlValidationResult */

/**
 * Validate a custom search engine URL.
 *
 * @param {string} raw: raw value from the input field
 * @returns {UrlValidationResult}
 */
export function validateCustomUrl(raw) {
  const url = raw.trim();
  if (!url) return "empty";

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return "invalidUrl";
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return "badProtocol";
  }

  const lc = url.toLowerCase();
  const hasSearchHook = lc.includes("{query}") || lc.includes("?") || lc.includes("=") || lc.includes("search") || lc.includes("query") || lc.includes("find");

  if (!hasSearchHook) return "noQuerySlot";

  return "ok";
}

/**
 * Build the final search text by applying operators to the raw selection.
 *
 * @param {string}  rawText      -> the user's selected text
 * @param {string}  currentUrl   -> URL of the source tab (for site: operator)
 * @param {string}  engineKey    -> key into SEARCH_ENGINES
 */
export function buildSearchText(settings, rawText, currentUrl, engineKey) {
  const text = rawText.trim();
  const operators = settings.operatorsEnabled && Array.isArray(settings.searchOperators) ? settings.searchOperators : [];

  if (operators.length === 0) return text;

  const engine = SEARCH_ENGINES[engineKey];
  const syntax = OPERATOR_SYNTAX[engine?.syntaxGroup ?? "google"];
  const parts = [];

  if (operators.includes("site") && currentUrl && syntax.site) {
    try {
      parts.push(`${syntax.site}${new URL(currentUrl).hostname}`);
    } catch {
      // invalid URL: skip the operator silently
    }
  }

  if (operators.includes("intitle") && syntax.intitle) {
    parts.push(`${syntax.intitle}${text}`);
  }

  if (operators.includes("inurl") && syntax.inurl) {
    parts.push(`${syntax.inurl}${text}`);
  }

  if (operators.includes("exact")) {
    parts.push(`"${text}"`);
  } else if (!operators.includes("intitle") && !operators.includes("inurl")) {
    parts.push(text);
  }

  const filetypeOp = operators.find((op) => op.startsWith("filetype:"));
  if (filetypeOp && syntax.filetype) {
    const types = filetypeOp.slice("filetype:".length).split(",");
    parts.push(types.length === 1 ? `${syntax.filetype}${types[0]}` : `(${types.map((t) => `${syntax.filetype}${t}`).join(" OR ")})`);
  }

  // Google-only
  if (operators.includes("noai")) parts.push('-"AI"');

  return parts.join(" ");
}

/**
 * Build the final URL for a given engine and search text.
 *
 * @param {string} text       -> already-processed search text (from buildSearchText)
 * @returns {string|null}     -> null if the engine URL cannot be resolved
 */
export function buildUrl(settings, text, engineKey) {
  const encoded = encodeURIComponent(text);
  const operators = settings.operatorsEnabled && Array.isArray(settings.searchOperators) ? settings.searchOperators : [];
  const addUdm14 = operators.includes("udm14");

  if (engineKey === "custom") {
    const raw = settings.customEngineUrl?.trim() || "";
    if (!raw) return null;
    return raw.includes("{query}") ? raw.replace("{query}", encoded) : raw + encoded;
  }

  const baseUrl = SEARCH_ENGINES[engineKey]?.url ?? null;
  if (!baseUrl) return null;
  return baseUrl + encoded + (addUdm14 ? "&udm=14" : "");
}

// Locale detection priority (highest → lowest):
//   1. Explicit pageLang passed in from the content script (document.lang,
//      og:locale, yt-page-data, GAPI_LOCALE, etc.)
//   2. Nothing: skip the rule entirely rather than guess wrong.

/**
 * Extract just the primary language subtag (lowercase 2-letter) from a
 * BCP-47 locale string like "en", "EN", "en_US".
 * Returns null if the input doesn't look like a valid BCP-47 tag.
 *
 * @param {string|null|undefined} raw
 * @returns {string|null}  lowercase 2-letter ISO 639-1 code, or null
 */
function parseLangCode(raw) {
  if (!raw) return null;
  const primary = String(raw).trim().split(/[-_]/)[0].toLowerCase();
  return primary.length === 2 && ISO_639_1.has(primary) ? primary : null;
}

/**
 * Clean up selected text before searching.
 * Applies only the rules the user has enabled.
 *
 * Rules:
 *  "whitespace"  -> collapse all whitespace (spaces, tabs, \r\n) into single spaces
 *  "locale"      -> remove a language tag injected at the start/end of the text
 *                  The tag is identified by comparing against the page language
 *                  detected by the content script (document.lang, og:locale,
 *                  yt-page-data, GAPI_LOCALE, etc.) - never a blind 2-letter guess.
 *  "separators"  -> strip leading/trailing pipe, dash, bullet separators
 *                  e.g. "| Clarkson, Hammond a May" → "Clarkson, Hammond a May"
 *
 * @param {string[]}    rules     -> active rule keys from settings.cleanupRules
 * @param {string|null} pageLang  -> BCP-47 locale from content script (may be null)
 */
export function sanitizeText(raw, rules = [], pageLang = null) {
  if (!raw) return "";

  let text = raw;
  try {
    text = decodeURIComponent(raw);
  } catch {
    /* not URI-encoded: keep as is */
  }

  if (rules.includes("whitespace")) {
    text = text.replace(/[\s\u00a0]+/g, " ");
  }

  if (rules.includes("locale")) {
    const candidates = new Set();

    const primaryLang = parseLangCode(pageLang);
    if (primaryLang) {
      candidates.add(primaryLang);
    }

    const startMatch = text.match(/^\s*([a-zA-Z]{2})(?:[-_][a-zA-Z]{2})?\b/u);
    if (startMatch) {
      const fullToken = startMatch[0].trim();
      const langPart = startMatch[1].toLowerCase();

      if (ISO_639_1.has(langPart)) {
        if (langPart === primaryLang || fullToken === fullToken.toUpperCase() || fullToken.includes("-") || fullToken.includes("_")) {
          candidates.add(langPart);
        }
      }
    }

    const endMatch = text.match(/\b([a-zA-Z]{2})(?:[-_][a-zA-Z]{2})?\s*$/u);
    if (endMatch) {
      const fullToken = endMatch[0].trim();
      const langPart = endMatch[1].toLowerCase();

      if (ISO_639_1.has(langPart)) {
        if (langPart === primaryLang || fullToken === fullToken.toUpperCase() || fullToken.includes("-") || fullToken.includes("_")) {
          candidates.add(langPart);
        }
      }
    }

    for (const lang of candidates) {
      const pattern = `\\b${lang}(?:[-_][a-zA-Z]{2})?\\b`;

      const startRe = new RegExp(`^\\s*${pattern}\\s*`, "iu");
      const endRe = new RegExp(`\\s*${pattern}\\s*$`, "iu");

      text = text.replace(startRe, "").replace(endRe, "");
    }
  }

  if (rules.includes("separators")) {
    text = text.replace(/^[\s|•–\-·/\\]+/, "").replace(/[\s|•–\-·/\\]+$/, "");
  }

  return text.trim();
}
