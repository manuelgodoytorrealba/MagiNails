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

window.addEventListener("load", () => {
  const loader = document.getElementById("app-loader");
  if (!loader) return;

  // deja que pinte 1 frame para que la transición se vea
  requestAnimationFrame(() => {
    loader.classList.add("is-hidden");
    setTimeout(() => loader.remove(), 320);
  });
});