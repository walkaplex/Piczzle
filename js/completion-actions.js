(() => {
  const modal = document.getElementById("modal");
  const viewButton = document.getElementById("viewPuzzleBtn");

  if (modal && viewButton) {
    viewButton.addEventListener("click", () => {
      modal.classList.remove("show");
    });
  }
})();
