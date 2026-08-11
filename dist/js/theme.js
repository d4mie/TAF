(function () {
  var STORAGE_KEY = "taf-theme";

  function systemTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function getStoredTheme() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "dark" || stored === "light") return stored;
    } catch (e) {}
    return null;
  }

  function currentTheme() {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }

  function applyTheme(theme, persist) {
    var next = theme === "dark" ? "dark" : "light";
    document.documentElement.classList.toggle("dark", next === "dark");
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch (e) {}
    }
    syncToggle(next);
  }

  function syncToggle(theme) {
    var buttons = document.querySelectorAll("[data-theme-toggle]");
    buttons.forEach(function (btn) {
      var isDark = theme === "dark";
      btn.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
      btn.setAttribute(
        "title",
        isDark ? "Switch to light mode" : "Switch to dark mode"
      );
      btn.setAttribute("aria-pressed", isDark ? "true" : "false");
    });
  }

  function toggleTheme() {
    applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
  }

  // Ensure stored/system preference is applied even if inline head script missed
  applyTheme(getStoredTheme() || systemTheme(), false);

  document.addEventListener("DOMContentLoaded", function () {
    syncToggle(currentTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", toggleTheme);
    });
  });

  // If user hasn't chosen yet, follow OS changes live
  try {
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", function (event) {
        if (getStoredTheme()) return;
        applyTheme(event.matches ? "dark" : "light", false);
      });
  } catch (e) {}
})();
