(() => {
  const capacitor = window.Capacitor;
  const platform = capacitor && typeof capacitor.getPlatform === "function"
    ? capacitor.getPlatform()
    : "web";
  const isNative = Boolean(capacitor && typeof capacitor.isNativePlatform === "function" && capacitor.isNativePlatform());

  document.documentElement.dataset.platform = platform;
  document.documentElement.classList.toggle("is-native", isNative);

  const plugins = capacitor && capacitor.Plugins ? capacitor.Plugins : {};

  async function call(plugin, method, options) {
    try {
      if (plugins[plugin] && typeof plugins[plugin][method] === "function") {
        await plugins[plugin][method](options || {});
      }
    } catch (_) {
      // Native niceties should never block the puzzle.
    }
  }

  window.PiczzleNative = {
    isNative,
    platform,
    lightImpact() {
      return call("Haptics", "impact", { style: "LIGHT" });
    },
    selection() {
      return call("Haptics", "selectionChanged");
    },
    success() {
      return call("Haptics", "notification", { type: "SUCCESS" });
    },
    hideSplash() {
      return call("SplashScreen", "hide");
    }
  };

  window.addEventListener("load", () => {
    call("StatusBar", "setOverlaysWebView", { overlay: false });
    call("StatusBar", "setStyle", { style: "DARK" });
    call("StatusBar", "setBackgroundColor", { color: "#0b1020" });
    window.PiczzleNative.hideSplash();
  });
})();
