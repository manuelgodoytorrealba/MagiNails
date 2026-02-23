// /scripts/flows/bookingFlow.js
(() => {
  window.MAGI = window.MAGI || {};

  const { ROUTES, MONTHS_ES } = window.MAGI.CONFIG;
  const { load, set } = window.MAGI.store;
  const { qs, qsa, bindOnce } = window.MAGI.dom;
  const { open: openModal, close: closeModal } = window.MAGI.modal;
  const { buildMessage, openChat, formatDay } = window.MAGI.whatsapp;

  const joinNice = (arr) => {
    if (!arr || arr.length === 0) return "";
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} y ${arr[1]}`;
    return `${arr.slice(0, -1).join(", ")} y ${arr[arr.length - 1]}`;
  };

  // -------------------------
  // SELECTOR
  // -------------------------
  const initSelectorPage = () => {
    const state = load();

    const serviceEl = qs("#selector-service");
    const zoneEl = qs("#selector-zone");
    const dayEl = qs("#selector-day");
    const timeEl = qs("#selector-time");
    const cta = qs("#selector-cta");
    const hint = qs("#selector-hint");

    const cardService = qs("#card-service");
    const cardZone = qs("#card-zone");
    const cardDay = qs("#card-day");
    const cardTime = qs("#card-time");

    const modal = qs("#booking-modal");
    const cancelBtn = qs("#modal-cancel");
    const sendBtn = qs("#modal-send");

    const setValue = (el, value, placeholder) => {
      if (!el) return;
      el.textContent = value ?? placeholder;
    };

    setValue(serviceEl, state.service, "Selecciona un servicio");
    setValue(zoneEl, state.zone, "Selecciona una zona");
    setValue(dayEl, state.day ? formatDay(state.day) : null, "Selecciona un día");
    setValue(timeEl, state.time, "Selecciona un horario");

    const cards = [
      { key: "Servicio", ok: !!state.service, card: cardService },
      { key: "Zona", ok: !!state.zone, card: cardZone },
      { key: "Día", ok: !!state.day, card: cardDay },
      { key: "Horario", ok: !!state.time, card: cardTime },
    ];

    const done = cards.filter((c) => c.ok).length;
    const missing = cards.filter((c) => !c.ok);
    const ready = done === 4;

    cards.forEach(({ ok, card }) => {
      if (!card) return;
      card.classList.toggle("is-filled", ok);
      card.classList.toggle("is-empty", !ok);
      card.classList.remove("is-attention");
    });

    if (cta) cta.disabled = !ready;

    const paintHint = (missingKeys, doneCount, isReady) => {
      if (!hint) return;
      if (isReady) {
        hint.textContent = "";
        hint.classList.remove("is-visible");
        return;
      }

      const faltan = joinNice(missingKeys);
      if (doneCount === 0) hint.textContent = "Elige una opción en cada tarjeta para continuar.";
      else if (missingKeys.length === 1) hint.textContent = `Casi listo ✨ Solo falta: ${faltan}.`;
      else hint.textContent = `Te falta elegir: ${faltan}.`;

      hint.classList.add("is-visible");
    };

    paintHint(missing.map((m) => m.key), done, ready);

    bindOnce(cancelBtn, "click", "modal_cancel", () => closeModal(modal));

    bindOnce(sendBtn, "click", "modal_send", () => {
      const latest = load();
      const name = qs("#client-name")?.value.trim() ?? "";
      const note = qs("#client-note")?.value.trim() ?? "";

      if (!name) {
        alert("Por favor, escribe tu nombre.");
        return;
      }

      const msg = buildMessage({ name, note, state: latest });
      openChat(msg);
      closeModal(modal);
    });

    bindOnce(cta, "click", "cta_click", () => {
      const latest = load();

      const latestCards = [
        { key: "Servicio", ok: !!latest.service, card: cardService },
        { key: "Zona", ok: !!latest.zone, card: cardZone },
        { key: "Día", ok: !!latest.day, card: cardDay },
        { key: "Horario", ok: !!latest.time, card: cardTime },
      ];

      const done2 = latestCards.filter((c) => c.ok).length;
      const missing2 = latestCards.filter((c) => !c.ok);

      if (missing2.length) {
        cta?.classList.remove("is-shaking");
        void cta?.offsetWidth;
        cta?.classList.add("is-shaking");

        missing2.forEach((m) => m.card?.classList.add("is-attention"));
        setTimeout(() => missing2.forEach((m) => m.card?.classList.remove("is-attention")), 700);

        paintHint(missing2.map((m) => m.key), done2, false);
        return;
      }

      openModal(modal);
    });
  };

  // -------------------------
  // GENERIC LIST (servicio/horario)
  // -------------------------
  const initSelectableListPage = ({ itemSelector, selectedClass, field }) => {
    const items = qsa(itemSelector);
    const saveBtn = qs(".flow-save");
    if (!items.length || !saveBtn) return;

    const state = load();
    let currentValue = state[field] ?? null;

    const applySelection = () => {
      items.forEach((el) => {
        const v = el.getAttribute("data-value");
        el.classList.toggle(selectedClass, v === currentValue);
        if (v === currentValue) el.setAttribute("aria-pressed", "true");
        else el.removeAttribute("aria-pressed");
      });
    };

    applySelection();

    items.forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.getAttribute("data-value");
        currentValue = currentValue === v ? null : v;
        applySelection();
      });
    });

    bindOnce(saveBtn, "click", `save_${field}`, () => {
      set({ [field]: currentValue });
      window.location.href = ROUTES.selector;
    });
  };

  // -------------------------
  // ZONE PAGE
  // -------------------------
  const initZonePage = () => {
    const saveBtn = qs(".flow-save");
    const customWrap = qs(".zone-custom");
    const customBtn = qs("#zone-custom-btn");
    const customInput = qs("#zone-custom-input");

    const normalItems = qsa(".zone-item[data-value]");
    if (!saveBtn || !normalItems.length) return;

    const state = load();
    let currentValue = state.zone ?? null;

    const predefinedValues = normalItems.map((el) => el.getAttribute("data-value")).filter(Boolean);
    const isCustomValue = (val) => !!(val && !predefinedValues.includes(val));

    let customOpen = false;

    const openCustom = (open) => {
      customOpen = open;
      customWrap?.classList.toggle("is-open", open);
      customBtn?.classList.toggle("is-selected", open);

      if (open) customInput?.focus();
      else if (customInput) customInput.value = "";
    };

    const applySelection = () => {
      normalItems.forEach((el) => {
        const v = el.getAttribute("data-value");
        const selected = !!(v && v === currentValue);
        el.classList.toggle("is-selected", selected);
        if (selected) el.setAttribute("aria-pressed", "true");
        else el.removeAttribute("aria-pressed");
      });

      const customSelected = customOpen || isCustomValue(currentValue);
      customBtn?.classList.toggle("is-selected", customSelected);
      customWrap?.classList.toggle("is-open", customSelected);
    };

    if (customInput && isCustomValue(currentValue)) {
      customInput.value = currentValue;
      openCustom(true);
    } else {
      openCustom(false);
    }

    applySelection();

    normalItems.forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.getAttribute("data-value");
        if (!v) return;
        currentValue = currentValue === v ? null : v;
        openCustom(false);
        applySelection();
      });
    });

    customBtn?.addEventListener("click", () => {
      openCustom(!customOpen);
      const txt = customInput?.value.trim() ?? "";
      currentValue = txt || null;
      applySelection();
    });

    customInput?.addEventListener("input", () => {
      const txt = customInput.value.trim();
      openCustom(true);
      currentValue = txt || null;
      normalItems.forEach((x) => x.classList.remove("is-selected"));
      applySelection();
    });

    bindOnce(saveBtn, "click", "save_zone", () => {
      if (customOpen || isCustomValue(currentValue)) {
        const txt = customInput?.value.trim() ?? "";
        if (!txt) {
          alert("Escribe tu zona o código postal.");
          return;
        }
        set({ zone: txt });
        window.location.href = ROUTES.selector;
        return;
      }

      set({ zone: currentValue });
      window.location.href = ROUTES.selector;
    });
  };

  // -------------------------
  // DAY PAGE
  // -------------------------
  const initDayPage = () => {
    const calendarRoot = qs("#day-calendar");
    const saveBtn = qs(".flow-save");
    const clearBtn = qs("#day-clear");

    if (!calendarRoot || !saveBtn) return;

    const state = load();
    const today = new Date();
    let selectedIso = state.day ?? null;

    const buildMonth = (year, monthIndex) => {
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);
      const daysInMonth = lastDay.getDate();
      const offset = firstDay.getDay(); // 0=Dom ... 6=Sáb

      const section = document.createElement("section");
      section.className = "month";

      const title = document.createElement("h3");
      title.className = "month-title";
      title.textContent = `${MONTHS_ES[monthIndex]} ${year}`;
      section.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "month-grid";

      for (let i = 0; i < offset; i++) {
        const empty = document.createElement("span");
        empty.className = "day-empty";
        grid.appendChild(empty);
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const btn = document.createElement("button");
        btn.className = "day-cell";
        btn.type = "button";
        btn.textContent = String(d);

        const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        // bloquear sábados
        const dayOfWeek = new Date(year, monthIndex, d).getDay();
        if (dayOfWeek === 6) {
          btn.classList.add("is-disabled");
          btn.disabled = true;
          btn.setAttribute("aria-disabled", "true");
          if (selectedIso === iso) selectedIso = null;
          grid.appendChild(btn);
          continue;
        }

        const isToday =
          iso === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        if (isToday) btn.classList.add("is-today");

        if (selectedIso && iso === selectedIso) {
          btn.classList.add("is-selected");
          btn.setAttribute("aria-pressed", "true");
        }

        btn.addEventListener("click", () => {
          const isSame = selectedIso === iso;

          calendarRoot.querySelectorAll(".day-cell.is-selected").forEach((x) => {
            x.classList.remove("is-selected");
            x.removeAttribute("aria-pressed");
          });

          if (isSame) {
            selectedIso = null;
            return;
          }

          btn.classList.add("is-selected");
          btn.setAttribute("aria-pressed", "true");
          selectedIso = iso;
        });

        grid.appendChild(btn);
      }

      section.appendChild(grid);
      return section;
    };

    const baseDate = state.day ? new Date(state.day) : new Date();
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();

    calendarRoot.innerHTML = "";
    calendarRoot.appendChild(buildMonth(y, m));

    const next = new Date(y, m + 1, 1);
    calendarRoot.appendChild(buildMonth(next.getFullYear(), next.getMonth()));

    if (clearBtn) {
      bindOnce(clearBtn, "click", "day_clear", () => {
        set({ day: null, time: null });
        selectedIso = null;
        calendarRoot.querySelectorAll(".day-cell.is-selected").forEach((x) => {
          x.classList.remove("is-selected");
          x.removeAttribute("aria-pressed");
        });
      });
    }

    bindOnce(saveBtn, "click", "day_save", () => {
      const current = load();

      if (!selectedIso) {
        set({ day: null, time: null });
        window.location.href = ROUTES.selector;
        return;
      }

      const shouldResetTime = current.day && current.day !== selectedIso;

      set({
        day: selectedIso,
        ...(shouldResetTime ? { time: null } : {}),
      });

      window.location.href = ROUTES.selector;
    });
  };

  // Export público
  window.MAGI.bookingFlow = {
    initSelectorPage,
    initSelectableListPage,
    initZonePage,
    initDayPage,
  };
})();