(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => {
      // Installation should never block the puzzle if service workers are unavailable.
    });
  });
})();
