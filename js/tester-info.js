(() => {
  function bindModal(openId, modalId, closeId) {
    const openButton = document.getElementById(openId);
    const modal = document.getElementById(modalId);
    const closeButton = document.getElementById(closeId);

    function open() {
      if (modal) modal.classList.add("show");
    }

    function close() {
      if (modal) modal.classList.remove("show");
    }

    if (openButton) openButton.addEventListener("click", open);
    if (closeButton) closeButton.addEventListener("click", close);
    if (modal) {
      modal.addEventListener("click", event => {
        if (event.target === modal) close();
      });
    }
  }

  bindModal("testerInfoBtn", "testerInfoModal", "testerInfoCloseBtn");
  bindModal("testPlanBtn", "testPlanModal", "testPlanCloseBtn");
})();
