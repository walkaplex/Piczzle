(() => {
  const openButton = document.getElementById("testerInfoBtn");
  const modal = document.getElementById("testerInfoModal");
  const closeButton = document.getElementById("testerInfoCloseBtn");

  function openInfo() {
    if (modal) modal.classList.add("show");
  }

  function closeInfo() {
    if (modal) modal.classList.remove("show");
  }

  if (openButton) openButton.addEventListener("click", openInfo);
  if (closeButton) closeButton.addEventListener("click", closeInfo);
  if (modal) {
    modal.addEventListener("click", event => {
      if (event.target === modal) closeInfo();
    });
  }
})();
