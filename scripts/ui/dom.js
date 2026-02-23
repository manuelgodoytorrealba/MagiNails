// /scripts/ui/dom.js
(() => {
  window.MAGI = window.MAGI || {};

  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // evita listeners duplicados (usa dataset flag)
  const bindOnce = (el, eventName, key, handler) => {
    if (!el) return;
    const flag = `bound_${key}`;
    if (el.dataset[flag] === "1") return;
    el.dataset[flag] = "1";
    el.addEventListener(eventName, handler);
  };

  window.MAGI.dom = { qs, qsa, bindOnce };
})();