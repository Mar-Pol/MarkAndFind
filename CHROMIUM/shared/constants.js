// ─────────────────────────────────────────────────────────────────────────────
// shared/constants.js
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_SETTINGS = {
  searchEngine: "google",
  multiEngines: [],
  enabled: true,
  openIn: "new-tab",
  autoSearch: false,
  autoSearchDelay: 2000,
  operatorsEnabled: false,
  searchOperators: [],
  customEngineUrl: "",
  customEngineName: "Custom",
  favoriteEngines: [],
  historyEnabled: true,
  cleanupEnabled: false,
  cleanupRules: [],
};

export const SEARCH_ENGINES = {
  google: {
    name: "Google",
    url: "https://www.google.com/search?q=",
    group: "coreWebSearch",
    syntaxGroup: "google",
    operators: ["site", "intitle", "inurl", "filetype", "exact", "noai", "udm14"],
  },
  bing: {
    name: "Bing",
    url: "https://www.bing.com/search?q=",
    group: "coreWebSearch",
    syntaxGroup: "bing",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
  yahoo: {
    name: "Yahoo",
    url: "https://search.yahoo.com/search?q=",
    group: "coreWebSearch",
    syntaxGroup: "bing",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
  brave: {
    name: "Brave Search",
    url: "https://search.brave.com/search?q=",
    group: "privacy",
    syntaxGroup: "google",
    operators: ["site", "intitle", "filetype", "exact"],
  },
  duckduckgo: {
    name: "DuckDuckGo",
    url: "https://duckduckgo.com/?q=",
    group: "privacy",
    syntaxGroup: "bing",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
  duckduckgo_noai: {
    name: "DDG (No AI)",
    fullName: "DuckDuckGo (No AI)",
    url: "https://noai.duckduckgo.com/?q=",
    group: "privacy",
    syntaxGroup: "bing",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
  ecosia: {
    name: "Ecosia",
    url: "https://www.ecosia.org/search?q=",
    group: "privacy",
    syntaxGroup: "bing",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
  kagi: {
    name: "Kagi (Paid)",
    i18nKey: "kagiOption",
    url: "https://kagi.com/search?q=",
    group: "privacy",
    syntaxGroup: "kagi",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
  qwant: {
    name: "Qwant",
    url: "https://www.qwant.com/?q=",
    group: "privacy",
    syntaxGroup: "bing",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
  startpage: {
    name: "StartPage",
    url: "https://www.startpage.com/search?q=",
    group: "privacy",
    syntaxGroup: "google",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
  wikipedia: {
    name: "Wikipedia",
    url: "https://en.wikipedia.org/wiki/Special:Search?search=",
    group: "knowledge",
    operators: [],
  },
  wolframalpha: {
    name: "WolframAlpha",
    url: "https://www.wolframalpha.com/input?i=",
    group: "knowledge",
    operators: [],
  },
  youtube: {
    name: "YouTube",
    url: "https://www.youtube.com/results?search_query=",
    group: "media",
    operators: [],
  },
  github: {
    name: "GitHub",
    url: "https://github.com/search?q=",
    group: "developer",
    operators: [],
  },
  npm: {
    name: "npm",
    url: "https://www.npmjs.com/search?q=",
    group: "developer",
    operators: [],
  },
  stackoverflow: {
    name: "Stack Overflow",
    url: "https://stackoverflow.com/search?q=",
    group: "developer",
    operators: [],
  },
  quora: {
    name: "Quora",
    url: "https://www.quora.com/search?q=",
    group: "community",
    operators: [],
  },
  reddit: {
    name: "Reddit",
    url: "https://www.reddit.com/search/?q=",
    group: "community",
    operators: [],
  },
  perplexity: {
    name: "Perplexity",
    url: "https://www.perplexity.ai/search?q=",
    group: "ai",
    syntaxGroup: "google",
    operators: ["site", "exact"],
  },
  baidu: {
    name: "Baidu",
    url: "https://www.baidu.com/s?wd=",
    group: "regional",
    flag: "🇨🇳",
    syntaxGroup: "google",
    operators: ["site", "intitle", "inurl", "exact"],
  },
  coccoc: {
    name: "Cốc Cốc",
    url: "https://coccoc.com/search?query=",
    group: "regional",
    flag: "🇻🇳",
    operators: [],
  },
  daum: {
    name: "Daum",
    url: "https://search.daum.net/search?q=",
    group: "regional",
    flag: "🇰🇷",
    operators: [],
  },
  naver: {
    name: "Naver",
    url: "https://search.naver.com/search.naver?query=",
    group: "regional",
    flag: "🇰🇷",
    syntaxGroup: "google",
    operators: ["site"],
  },
  seznam: {
    name: "Seznam",
    url: "https://search.seznam.cz/?q=",
    group: "regional",
    flag: "🇨🇿",
    syntaxGroup: "google",
    operators: ["site", "filetype", "exact"],
  },
  sogou: {
    name: "Sogou",
    url: "https://www.sogou.com/web?query=",
    group: "regional",
    flag: "🇨🇳",
    operators: [],
  },
  yandex: {
    name: "Yandex",
    url: "https://yandex.com/search/?text=",
    group: "regional",
    flag: "🇷🇺",
    syntaxGroup: "yandex",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
  custom: {
    name: "Custom engine…",
    i18nKey: "customOption",
    url: null,
    group: "custom",
    syntaxGroup: "google",
    operators: ["site", "intitle", "inurl", "filetype", "exact"],
  },
};

export const GROUPS = [
  { key: "coreWebSearch", i18n: "groupCoreWebSearch", label: "Core Web Search" },
  { key: "privacy", i18n: "groupPrivacy", label: "Privacy-Focused" },
  { key: "knowledge", i18n: "groupKnowledge", label: "Knowledge" },
  { key: "media", i18n: "groupMedia", label: "Media" },
  { key: "developer", i18n: "groupDeveloper", label: "Developer" },
  { key: "community", i18n: "groupCommunity", label: "Community" },
  { key: "ai", i18n: "groupAI", label: "AI" },
  { key: "regional", i18n: "groupRegional", label: "Regional" },
  { key: "custom", i18n: "groupCustom", label: "Custom" },
];

export const OPERATORS = [
  { key: "site", label: "operatorSite", hint: "operatorHintSite" },
  { key: "exact", label: "operatorExact", hint: "operatorHintExact" },
  { key: "intitle", label: "operatorIntitle", hint: "operatorHintIntitle" },
  { key: "inurl", label: "operatorInurl", hint: "operatorHintInurl" },
  { key: "filetype", label: "operatorFiletype", hint: "operatorHintFiletype" },
  { key: "noai", label: "operatorNoai", hint: "operatorHintNoai", googleSpecial: true },
  { key: "udm14", label: "operatorUdm14", hint: "operatorHintUdm14", googleSpecial: true },
];

export const FILETYPE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "doc,docx", label: "Word (doc / docx)" },
  { value: "xls,xlsx", label: "Excel (xls / xlsx)" },
  { value: "ppt,pptx", label: "PowerPoint (ppt / pptx)" },
  { value: "txt", label: "TXT" },
  { value: "csv", label: "CSV" },
  { value: "xml", label: "XML" },
  { value: "json", label: "JSON" },
];

export const OPERATOR_SYNTAX = {
  google: {
    site: "site:",
    intitle: "intitle:",
    inurl: "inurl:",
    filetype: "filetype:",
  },
  bing: {
    site: "site:",
    intitle: "intitle:",
    inurl: "instreamset:url:",
    filetype: "filetype:",
  },
  yandex: {
    site: "site:",
    intitle: "title:",
    inurl: "url:",
    filetype: "mime:",
  },
  kagi: {
    site: "site:",
    intitle: "intitle:",
    inurl: "inurl:",
    filetype: "file:",
  },
};

export const HISTORY_MAX = 20;

//KEYBOARD SHORCUT NOT WORK
export const RESTRICTED_URL_PREFIXES = [
  // Chromium-based
  "chrome:",
  "chrome-extension:",

  // Opera
  "opera:",
  "opera-extension:",

  // Edge
  "edge:",
  "extension:",

  // Vivaldi
  "vivaldi:",
  "vivaldi-extension:",

  // Brave
  "brave:",

  // Arc
  "arc:",

  // Yandex Browser
  "yandex:",

  // Samsung Internet
  "samsung:",
  "sbrowser:",

  // UC Browser
  "ucbrowser:",

  // SeaMonkey
  "seamonkey:",

  // Gecko-based
  // Firefox
  "moz-extension:",
  "about:",

  // Pale Moon
  "palemoon:",

  // General / system
  "data:",
  "view-source:",
  "devtools:",
];

export const RESTRICTED_DOMAINS = [
  // Chrome / Chromium
  "chrome.google.com/webstore",
  "chromewebstore.google.com",

  // Edge
  "microsoftedge.microsoft.com/addons",

   // Note: addons.* and extensions.* hostnames are handled by regex in isRestrictedUrl(
];
