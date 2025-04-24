async function getSettings() {
  let data = await browser.storage.local.get("settings");
  return data.settings || { searchEngine: "google" };
}

async function getSelectedText() {
  let [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  let result = await browser.tabs.executeScript(tab.id, {
    code: "window.getSelection().toString();"
  });
  return result[0];
}

const searchEngines = {
  google: "https://www.google.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
  startpage: "https://www.startpage.com/do/dsearch?query=",
  bing: "https://www.bing.com/search?q="
};

browser.commands.onCommand.addListener(async (command) => {
  const settings = await getSettings();

  if (command === "search-google") {
    let selectedText = await getSelectedText();
    
    if (selectedText) {
      let searchUrl = searchEngines[settings.searchEngine] + encodeURIComponent(selectedText);
      browser.tabs.create({ url: searchUrl });
    } else {
      console.log("Žiadny text nebol označený.");
    }
  }
});
