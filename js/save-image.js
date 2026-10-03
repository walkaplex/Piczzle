(() => {
  const saveButton = document.getElementById("saveImageBtn");
  const toast = document.getElementById("toast");
  let isSaving = false;
  let prepared;
  if (!saveButton) return;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  function prepareImage() {
    const image = window.PiczzleGame?.solvedImage();
    if (!image) return null;
    if (prepared?.image === image) return prepared;
    const [header, data] = image.split(",");
    const mime = header.match(/^data:(image\/[a-z0-9.+-]+);base64$/i)?.[1];
    if (!mime || !data) throw new Error("Invalid puzzle image");
    const bytes = Uint8Array.from(atob(data), char => char.charCodeAt(0));
    const stamp = new Date().toLocaleDateString("en-CA");
    const file = new File([bytes], `piczzle-${stamp}.${mime === "image/png" ? "png" : "jpg"}`, { type: mime });
    prepared = { image, file };
    return prepared;
  }

  // Prepare before the Save tap so iOS sharing retains its user gesture.
  window.addEventListener("piczzle:solved", () => {
    try { prepareImage(); } catch (_) { prepared = null; }
  });

  async function saveImage(event) {
    event.preventDefault();
    event.stopPropagation();
    if (isSaving) return;
    if (!window.PiczzleGame?.solvedImage()) {
      showToast("Solve the puzzle before saving");
      return;
    }
    isSaving = true;
    const originalText = saveButton.textContent;
    saveButton.disabled = true;
    try {
      const { image, file } = prepareImage();
      if (window.PiczzleAndroid && typeof window.PiczzleAndroid.saveImage === "function") {
        const result = window.PiczzleAndroid.saveImage(file.name, image);
        if (result === "shared") {
          showToast("Choose a save option in the share sheet");
          return;
        }
        if (result !== "saved") throw new Error("Native save failed");
        showToast("Image saved to photos");
        return;
      }
      if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "Piczzle", text: "My completed Piczzle" });
        showToast("Image handed to the share sheet");
        return;
      }
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      showToast("Image downloaded");
    } catch (error) {
      showToast(error?.name === "AbortError" ? "Save cancelled" : "Couldn't save the image. Please try again.");
    } finally {
      setTimeout(() => {
        saveButton.disabled = false;
        saveButton.textContent = originalText;
        isSaving = false;
      }, 1000);
    }
  }
  saveButton.addEventListener("pointerdown", saveImage);
  saveButton.addEventListener("click", saveImage);
})();
