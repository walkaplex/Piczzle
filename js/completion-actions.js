(() => {
  const modal = document.getElementById("modal");
  const viewButton = document.getElementById("viewPuzzleBtn");
  const feedbackButton = document.getElementById("feedbackBtn");

  if (modal && viewButton) {
    viewButton.addEventListener("click", () => {
      modal.classList.remove("show");
    });
  }

  if (feedbackButton) {
    feedbackButton.addEventListener("click", () => {
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
        `Puzzle state: ${title}`,
        `Puzzle size: ${size}`,
        `Time: ${time}`,
        `Moves: ${moves}`
      ].join("\n");

      feedbackButton.href = `mailto:piczzle.support@gmail.com?subject=${encodeURIComponent("Piczzle feedback")}&body=${encodeURIComponent(body)}`;
    });
  }
})();
