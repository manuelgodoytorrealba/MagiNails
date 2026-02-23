// /scripts/state/store.js
(() => {
  window.MAGI = window.MAGI || {};
  const { STORAGE_KEY } = window.MAGI.CONFIG;

  const DEFAULT_STATE = {
    service: null,
    zone: null,
    day: null,  // "YYYY-MM-DD"
    time: null, // "11:00 AM"
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    } catch {
      return { ...DEFAULT_STATE };
    }
  };

  const save = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const set = (patch) => {
    const current = load();
    const next = { ...current, ...patch };
    save(next);
    return next;
  };

  window.MAGI.store = { DEFAULT_STATE, load, save, set };
})();