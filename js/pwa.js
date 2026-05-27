(() => {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    let refreshing = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("sw.js", { scope: "./" }).then(registration => {
      registration.update().catch(() => {});
    }).catch(() => {
      // Installation should never block the puzzle if service workers are unavailable.
    });
  });
})();
