document.addEventListener("DOMContentLoaded", function () {
  const searchEngine = document.getElementById("search-engine");

  function saveSettings() {
    const settings = {
      searchEngine: searchEngine.value
    };

    browser.storage.local.set({ settings }).then(() => {
      console.log("Nastavenia uložené:", settings);
    });
  }

  function loadSettings() {
    browser.storage.local.get("settings").then((data) => {
      if (data.settings) {
        searchEngine.value = data.settings.searchEngine || "google";
      }
    });
  }

  searchEngine.addEventListener("change", saveSettings);

  loadSettings();
});
