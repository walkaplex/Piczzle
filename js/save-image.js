(() => {
  const saveButton = document.getElementById("saveImageBtn");
  const toast = document.getElementById("toast");
  const board = document.getElementById("board");
  const sizeStat = document.getElementById("sizeStat");
  let isSaving = false;

  if (!saveButton || !board) return;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 1700);
  }

  function puzzleSize() {
    const match = (sizeStat && sizeStat.textContent || "").match(/(\d+)x\1/);
    return match ? Number(match[1]) : 4;
  }

  function buildSolvedImageCanvas() {
    const slots = Array.from(board.querySelectorAll(".slot"));
    const n = puzzleSize();
    const images = slots.map(slot => slot.querySelector(".piece img"));

    if (images.length !== n * n || images.some(img => !img)) {
      throw new Error("Puzzle is not complete yet");
    }

    const first = images[0];
    const pieceW = first.naturalWidth || 300;
    const pieceH = first.naturalHeight || 225;
    const canvas = document.createElement("canvas");
    canvas.width = pieceW * n;
    canvas.height = pieceH * n;
    const ctx = canvas.getContext("2d");

    images.forEach((img, index) => {
      const row = Math.floor(index / n);
      const col = index % n;
      ctx.drawImage(img, col * pieceW, row * pieceH, pieceW, pieceH);
    });

    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error("Could not create image"));
      }, "image/jpeg", 0.94);
    });
  }

  function localDateStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async function saveImage(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (isSaving) return;
    isSaving = true;

    const originalText = saveButton.textContent;
    saveButton.textContent = "Preparing Image";
    saveButton.disabled = true;

    try {
      const canvas = buildSolvedImageCanvas();
      const filename = `piczzle-${localDateStamp()}.jpg`;

      if (window.PiczzleAndroid && typeof window.PiczzleAndroid.saveImage === "function") {
        const result = window.PiczzleAndroid.saveImage(filename, canvas.toDataURL("image/jpeg", 0.94));
        if (result !== "saved") throw new Error(result || "Native save failed");
        saveButton.textContent = "Image Saved";
        showToast("Image saved to photos");
        return;
      }

      const blob = await canvasToBlob(canvas);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      saveButton.textContent = "Image Saved";
      showToast("Image saved");
    } catch (_) {
      saveButton.textContent = "Save Unavailable";
      showToast("Solve the puzzle before saving");
    } finally {
      setTimeout(() => {
        saveButton.disabled = false;
        saveButton.textContent = originalText;
        isSaving = false;
      }, 1800);
    }
  }

  saveButton.addEventListener("pointerdown", saveImage);
  saveButton.addEventListener("click", saveImage);
})();
