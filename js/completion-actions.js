(() => {
  const modal = document.getElementById("modal");
  const viewButton = document.getElementById("viewPuzzleBtn");
  const app = document.getElementById("app");
  const version = document.getElementById("appVersion");
  if (version) version.textContent = `Build ${window.PiczzleGame?.version || "unknown"}`;
  const dialogs = Array.from(document.querySelectorAll(".modalBg"));
  let activeDialog;
  let returnFocus;

  dialogs.forEach(dialog => {
    const title = dialog.querySelector("h2");
    if (!title.id) title.id = `${dialog.id}Title`;
    title.tabIndex = -1;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", title.id);
  });

  function syncDialogs() {
    const open = dialogs.filter(dialog => dialog.classList.contains("show"));
    const next = open[open.length - 1];
    if (next === activeDialog) return;
    if (!activeDialog && next) returnFocus = document.activeElement;
    activeDialog = next;
    if (app) app.inert = Boolean(next);
    dialogs.forEach(dialog => {
      dialog.inert = dialog !== next;
      dialog.setAttribute("aria-hidden", String(dialog !== next));
    });
    if (next) next.querySelector("h2").focus({ preventScroll: true });
    else {
      const target = returnFocus?.isConnected && returnFocus.getClientRects().length ? returnFocus :
        document.getElementById(app?.classList.contains("playMode") ? "editBtn" : "stepUpload");
      target?.focus({ preventScroll: true });
    }
  }
  const observer = new MutationObserver(syncDialogs);
  dialogs.forEach(dialog => observer.observe(dialog, { attributes: true, attributeFilter: ["class"] }));
  syncDialogs();
  function closeTopDialog() {
    // Query the DOM too: native Back can arrive before the mutation observer runs.
    const dialog = dialogs.filter(item => item.classList.contains("show")).at(-1);
    if (!dialog) return false;
    if (dialog.id === "confirmModal") document.getElementById("confirmCancelBtn").click();
    else if (dialog.id === "sharedIntroModal") document.getElementById("sharedIntroCloseBtn").click();
    else if (dialog.id === "missingShareModal") document.getElementById("missingShareCloseBtn").click();
    else dialog.classList.remove("show");
    return true;
  }
  window.PiczzleDialogs = { closeTop: closeTopDialog };
  document.addEventListener("keydown", event => {
    if (!activeDialog) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeTopDialog();
    } else if (event.key === "Tab") {
      const controls = Array.from(activeDialog.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])'))
        .filter(control => control.getClientRects().length);
      const index = controls.indexOf(document.activeElement);
      if (!controls.length) { event.preventDefault(); return; }
      if (index < 0 || event.shiftKey && index === 0 || !event.shiftKey && index === controls.length - 1) {
        event.preventDefault();
        controls[event.shiftKey ? controls.length - 1 : 0].focus();
      }
    }
  });
  const photoLabel = document.querySelector('label[for="fileInput"]');
  if (photoLabel) {
    photoLabel.tabIndex = 0;
    photoLabel.setAttribute("role", "button");
    photoLabel.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        document.getElementById("fileInput").click();
      }
    });
  }

  if (modal && viewButton) {
    viewButton.addEventListener("click", () => {
      modal.classList.remove("show");
    });
  }

  document.querySelectorAll("#feedbackBtn, [data-feedback]").forEach(button => {
    button.addEventListener("click", () => {
      const time = document.getElementById("modalTime")?.textContent || "";
      const moves = document.getElementById("modalMoves")?.textContent || "";
      const size = document.getElementById("modalSize")?.textContent || "";
      const title = document.getElementById("modalTitle")?.textContent || "Puzzle complete";
      const body = [
        "What happened?",
        "",
        "Device:",
        "",
        "Browser or Android version:",
        "",
        "Screenshot attached?",
        "",
        `App version: ${window.PiczzleGame?.version || "unknown"}`,
        `Browser: ${navigator.userAgent}`,
        `Puzzle state: ${title}`,
        `Puzzle size: ${size}`,
        `Time: ${time}`,
        `Moves: ${moves}`
      ].join("\n");

      button.href = `mailto:piczzle.support@gmail.com?subject=${encodeURIComponent("Piczzle feedback")}&body=${encodeURIComponent(body)}`;
    });
  });
})();
