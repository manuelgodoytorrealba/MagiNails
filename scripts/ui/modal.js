// /scripts/ui/modal.js
(() => {
  window.MAGI = window.MAGI || {};

  const open = (modalEl) => modalEl?.classList.add("is-open");
  const close = (modalEl) => modalEl?.classList.remove("is-open");

  window.MAGI.modal = { open, close };
})();