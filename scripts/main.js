document.addEventListener("DOMContentLoaded", () => {

  const selectorBtn = document.getElementById("open-selector");
  const whatsappBtn = document.getElementById("open-whatsapp");

  if (selectorBtn) {
    selectorBtn.addEventListener("click", () => {
      window.location.href = "/pages/selector.html";
    });
  }

  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", () => {
     window.location.href = "/pages/selector.html";
    });
  }

});
