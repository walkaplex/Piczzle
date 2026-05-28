(() => {
  const copyButton = document.getElementById("copyShareBtn");

  if (!copyButton) return;

  copyButton.addEventListener("click", () => {
    copyButton.textContent = "Link Copied";
    clearTimeout(copyButton.resetTimer);
    copyButton.resetTimer = setTimeout(() => {
      copyButton.textContent = "Copy Link";
    }, 1800);
  });
})();
