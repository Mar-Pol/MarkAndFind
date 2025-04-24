# Mark&Find

A browser extension that allows you to search for marked text on web pages using your chosen search engine (Google is the default).

## 📝Description

Mark&Find is a lightweight and efficient browser extension that lets you search for marked text on web pages using the keyboard shortcut CTRL+SHIFT+F. Whether you're doing research, reading long articles, or need to track important information across multiple tabs, Mark&Find makes text searching simple.

## ⚡Features

✔️ **Search Engines**: In addition to Google, you can choose other search engines including Bing, StartPage, and DuckDuckGo.
- *After closing Firefox, the search engine reverts to the default Google (which has the best search results even though from a privacy perspective it's spyware).*

## 🔧Installation

1. Download the latest `Mark&Find.xpi` file from the [Releases](https://github.com/Mar-Pol/MarkAndFind/releases) page
2. In Firefox, open `about:addons`
3. Click on the gear icon and select "Install Add-on From File..."
4. Navigate to the downloaded .xpi file and select it

## 🚀Usage

1. Navigate to any web page where you want to search for text
2. Select the text you want to search for
3. Press the keyboard shortcut CTRL+SHIFT+F
4. Done! The selected text will be searched in Google, unless you've set a different search engine in the extension menu.

## 🎓Certification

The extension is certified by Mozilla, making it installable on any version of Firefox.

## 🏗️Project Structure

- `popup.html` - Main interface for the extension's popup window
- `popup.js` - JavaScript handling popup functionality
- `background.js` - Background scripts for persistent functionality
- `manifest.json` - Extension configuration
- `styles.css` - Extension styling
- `icon.png` - Extension icon

## 🔒Privacy

Mark&Find respects your privacy. The extension doesn't collect any personal information or browsing data. All markings are stored locally on your device and are not transmitted to any external servers.

**THE EXTENSION REQUIRES JavaScript TO FUNCTION!**

## Donate❤️

If Mark&Find saves you time and you want to support my work, you can [buy me a coffee.](https://revolut.me/marp0l)  
Thanks for considering!

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE) - see the LICENSE file for details.
