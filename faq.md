# FAQ

## 1. No shortcut is set

### Problem

The extension shows:

> “No shortcut is set. Click to open shortcut settings.”

### Cause

The browser does not automatically assign keyboard shortcuts to extensions or you removed it.

### Fix

Click the message directly in the extension UI.
It opens the browser shortcut settings page for MarkAndFind.

Then assign your preferred shortcut.

Example:

* `Ctrl+Shift+L`
* `Alt+K`

Default shortcut:
 * `Ctrl+Shift+F`

The exact shortcut options depend on the browser.

---

## 2. Private / Incognito window does not work

### Problem

Searching selected text does not work in private or incognito windows.

### Cause

Browser extensions cannot access private windows unless explicitly allowed by the user.

### Fix

Open browser extension settings and enable:

* Firefox: **Run in Private Windows**
* Chromium browsers: **Allow in Incognito**

Without this permission, the extension cannot work in private windows.

---

## 3. Keyboard shortcut or auto-search does not work on some pages

### Problem

Keyboard shortcut or auto-search does not work on certain pages.

The extension may show:

> “Keyboard shortcut and auto-search are not available on this page.”

Sometimes this warning may not appear even though shortcuts still do not work.

### Cause

Some browser-protected pages block extension content scripts.

This is a browser security limitation, not an addon bug.

Examples may include:

* browser internal pages
* extension stores
* protected system pages

### Fix

Use the context menu instead.

When this restriction is active, the extension icon may show a yellow question mark badge.

---

## 4. Opera: keyboard shortcut or auto-search does not work

### Problem

Keyboard shortcut and auto-search do not work in Opera.

### Cause

Opera blocks access to search result pages unless additional permission is enabled.

### Fix

Open:

`opera://extensions`

Find MarkAndFind and enable:

> “Allow access to search page results”

Without this permission, keyboard shortcuts and auto-search cannot function correctly.

After enabling the permission, the warning message may remain visible temporarily.

This happens because Opera does not provide an API that allows the addon to verify the permission state directly.

You can:

* close the warning manually using the `×` button
* or simply use the keyboard shortcut again

After a successful search, the warning disappears automatically.

---

## 5. Can I export, import, or reset addon settings?

Yes.

Click the MarkAndFind icon in the browser toolbar.

If it’s not visible, pin it from the extensions menu.

Click **About** tab.

Scroll to **More settings** section.

There you can:

* export settings
* import settings
* reset settings to default

---

## 6. How do I change the keyboard shortcut?

### Method 1

In the extension UI, scroll to the bottom.

The current shortcut is displayed in the **Keyboard shortcut** section.

Clicking it opens the browser shortcut settings directly.

### Method 2

Open the browser extension shortcuts manager manually.

Usually:

> Add-ons / Extensions Manager → Manage Extension Shortcuts

The exact path depends on the browser.
