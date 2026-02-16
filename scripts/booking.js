// /scripts/booking.js
(() => {
  const STORAGE_KEY = "maginails_booking_v1";

  const DEFAULT_STATE = {
    service: null,
    zone: null,
    day: null,  // "YYYY-MM-DD"
    time: null, // "11:00 AM"
  };

  const loadState = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_STATE, ...parsed };
    } catch {
      return { ...DEFAULT_STATE };
    }
  };

  const saveState = (next) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const setState = (patch) => {
    const current = loadState();
    const next = { ...current, ...patch };
    saveState(next);
    return next;
  };

  const formatDay = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return null;
    return `${d}-${m}-${y.slice(2)}`; // DD-MM-YY
  };

  // "Servicio, Zona y Horario"
  const joinNice = (arr) => {
    if (!arr || arr.length === 0) return "";
    if (arr.length === 1) return arr[0];
    if (arr.length === 2) return `${arr[0]} y ${arr[1]}`;
    return `${arr.slice(0, -1).join(", ")} y ${arr[arr.length - 1]}`;
  };

  // Evita listeners duplicados sin romper interacciones (NO usamos { once:true } aquí)
  const bindOnce = (el, eventName, key, handler) => {
    if (!el) return;
    const flag = `bound_${key}`;
    if (el.dataset[flag] === "1") return;
    el.dataset[flag] = "1";
    el.addEventListener(eventName, handler);
  };

  const page = document.body;

  // =========================
  // SELECTOR PAGE
  // =========================
  const initSelectorPage = () => {
    const state = loadState();

    const serviceEl = document.getElementById("selector-service");
    const zoneEl = document.getElementById("selector-zone");
    const dayEl = document.getElementById("selector-day");
    const timeEl = document.getElementById("selector-time");
    const cta = document.getElementById("selector-cta");
    const hint = document.getElementById("selector-hint");

    // Cards (wrapper)
    const cardService = document.getElementById("card-service");
    const cardZone = document.getElementById("card-zone");
    const cardDay = document.getElementById("card-day");
    const cardTime = document.getElementById("card-time");

    // Modal
    const modal = document.getElementById("booking-modal");
    const cancelBtn = document.getElementById("modal-cancel");
    const sendBtn = document.getElementById("modal-send");

    // Render values (solo texto)
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

    // estados visuales por card
    cards.forEach(({ ok, card }) => {
      if (!card) return;
      card.classList.toggle("is-filled", ok);
      card.classList.toggle("is-empty", !ok);
      card.classList.remove("is-attention");
    });

    // botón
    if (cta) cta.disabled = !ready;

    // hint dinámico (texto natural)
    const paintHint = (missingKeys, doneCount, isReady) => {
      if (!hint) return;
      if (isReady) {
        hint.textContent = "";
        hint.classList.remove("is-visible");
        return;
      }

      const faltan = joinNice(missingKeys);

      if (doneCount === 0) {
        hint.textContent = "Elige una opción en cada tarjeta para continuar.";
      } else if (missingKeys.length === 1) {
        hint.textContent = `Casi listo ✨ Solo falta: ${faltan}.`;
      } else {
        hint.textContent = `Te falta elegir: ${faltan}.`;
      }

      hint.classList.add("is-visible");
    };

    paintHint(missing.map((m) => m.key), done, ready);

    // Modal: cerrar
    bindOnce(cancelBtn, "click", "modal_cancel", () => {
      modal?.classList.remove("is-open");
    });

    // Modal: enviar WhatsApp
    bindOnce(sendBtn, "click", "modal_send", () => {
      const latest = loadState();
      const name = document.getElementById("client-name")?.value.trim() ?? "";
      const note = document.getElementById("client-note")?.value.trim() ?? "";

      if (!name) {
        alert("Por favor, escribe tu nombre.");
        return;
      }

      const fecha = formatDay(latest.day);

      const msg = `Hola ✨
Quiero reservar una cita en MagiNails.

• Nombre: ${name}
• Servicio: ${latest.service}
• Zona: ${latest.zone}
• Día: ${fecha}
• Horario: ${latest.time}
${note ? `• Nota: ${note}` : ""}

¿Me confirmas disponibilidad?`;

      const url = `https://wa.me/34646074096?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      modal?.classList.remove("is-open");
    });

    // Click CTA
    bindOnce(cta, "click", "cta_click", () => {
      const latest = loadState();

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

      modal?.classList.add("is-open");
    });
  };

  // =========================
  // GENERIC SELECT LIST (servicio / horario)
  // =========================
  const initSelectableListPage = ({ itemSelector, selectedClass, field }) => {
    const items = Array.from(document.querySelectorAll(itemSelector));
    const saveBtn = document.querySelector(".flow-save");
    if (!items.length || !saveBtn) return;

    const state = loadState();
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
        currentValue = currentValue === v ? null : v; // toggle
        applySelection();
      });
    });

    bindOnce(saveBtn, "click", `save_${field}`, () => {
      setState({ [field]: currentValue });
      window.location.href = "/pages/selector.html";
    });
  };

  // =========================
  // ZONE PAGE (incluye "Otra zona" con input oculto)
  // Requiere en zona.html:
  // - div.zone-custom
  // - button#zone-custom-btn
  // - input#zone-custom-input
  // - botones normales con: .zone-item[data-value="..."]
  // =========================
  const initZonePage = () => {
    const saveBtn = document.querySelector(".flow-save");

    const customWrap = document.querySelector(".zone-custom");
    const customBtn = document.getElementById("zone-custom-btn");
    const customInput = document.getElementById("zone-custom-input");

    // ✅ Solo zonas normales (las que tienen data-value)
    const normalItems = Array.from(document.querySelectorAll(".zone-item[data-value]"));

    if (!saveBtn || !normalItems.length) return;

    const state = loadState();
    let currentValue = state.zone ?? null;

    const predefinedValues = normalItems
      .map((el) => el.getAttribute("data-value"))
      .filter(Boolean);

    const isCustomValue = (val) => !!(val && !predefinedValues.includes(val));

    // Estado visual del custom (si está abierto)
    let customOpen = false;

    const openCustom = (open) => {
      customOpen = open;

      if (customWrap) customWrap.classList.toggle("is-open", open);
      if (customBtn) customBtn.classList.toggle("is-selected", open);

      if (open) {
        customInput?.focus();
      } else {
        // al cerrar custom, limpiamos el input (si quieres mantenerlo, quita esta línea)
        if (customInput) customInput.value = "";
      }
    };

    const applySelection = () => {
      // Selección de zonas normales
      normalItems.forEach((el) => {
        const v = el.getAttribute("data-value");
        const selected = !!(v && v === currentValue);
        el.classList.toggle("is-selected", selected);
        if (selected) el.setAttribute("aria-pressed", "true");
        else el.removeAttribute("aria-pressed");
      });

      // Custom marcado si está abierto o si el valor guardado era custom
      const customSelected = customOpen || isCustomValue(currentValue);
      if (customBtn) {
        customBtn.classList.toggle("is-selected", customSelected);
        if (customSelected) customBtn.setAttribute("aria-pressed", "true");
        else customBtn.removeAttribute("aria-pressed");
      }
      if (customWrap) customWrap.classList.toggle("is-open", customSelected);
    };

    // ✅ Precarga: si había una zona custom guardada, abrir y rellenar
    if (customInput && isCustomValue(currentValue)) {
      customInput.value = currentValue;
      openCustom(true);
    } else {
      openCustom(false);
    }

    applySelection();

    // Click zonas normales (toggle)
    normalItems.forEach((el) => {
      el.addEventListener("click", () => {
        const v = el.getAttribute("data-value");
        if (!v) return;

        // toggle normal
        currentValue = currentValue === v ? null : v;

        // si eligen normal, cerrar custom
        openCustom(false);

        applySelection();
      });
    });

    // Click “Otra zona” (abre/cierra)
    customBtn?.addEventListener("click", () => {
      openCustom(!customOpen);
      // si abre sin texto, currentValue queda null (ok)
      // si ya hay texto, lo tomamos
      const txt = customInput?.value.trim() ?? "";
      currentValue = txt || (customOpen ? null : currentValue);
      applySelection();
    });

    // Escribir en el input => activa modo custom y guarda en memoria local (en currentValue)
    customInput?.addEventListener("input", () => {
      const txt = customInput.value.trim();

      if (txt.length > 0) {
        // si escriben, forzamos custom abierto y valor custom
        openCustom(true);
        currentValue = txt;
      } else {
        // si borran todo, queda sin selección custom
        currentValue = null;
        // mantenemos abierto para que puedan seguir escribiendo si quieren
        openCustom(true);
      }

      // deselecciona normales (visual)
      normalItems.forEach((x) => x.classList.remove("is-selected"));
      applySelection();
    });

    // Guardar
    bindOnce(saveBtn, "click", "save_zone", () => {
      // si custom está activo, exige texto
      if (customOpen || isCustomValue(currentValue)) {
        const txt = customInput?.value.trim() ?? "";
        if (!txt) {
          alert("Escribe tu zona o código postal.");
          return;
        }
        setState({ zone: txt });
        window.location.href = "/pages/selector.html";
        return;
      }

      // normal / o null
      setState({ zone: currentValue });
      window.location.href = "/pages/selector.html";
    });
  };



  // =========================
  // DAY PAGE (calendario)
  // =========================
  const initDayPage = () => {
    const calendarRoot = document.getElementById("day-calendar");
    const saveBtn = document.querySelector(".flow-save");
    const clearBtn = document.getElementById("day-clear");

    if (!calendarRoot || !saveBtn) return;

    const state = loadState();
    const today = new Date();
    let selectedIso = state.day ?? null;

    const MONTHS_ES = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];

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

        const dayOfWeek = new Date(year, monthIndex, d).getDay(); // 0=Dom ... 6=Sáb
        const isSaturday = dayOfWeek === 6;

        if (isSaturday) {
          btn.classList.add("is-disabled");
          btn.disabled = true;
          btn.setAttribute("aria-disabled", "true");

          // Si por algún motivo estaba guardado un sábado, lo anulamos visualmente
          if (selectedIso === iso) {
            selectedIso = null;
          }

          grid.appendChild(btn);
          continue; // importante: no le ponemos click
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
            selectedIso = null; // toggle off
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
        setState({ day: null, time: null });
        selectedIso = null;

        calendarRoot.querySelectorAll(".day-cell.is-selected").forEach((x) => {
          x.classList.remove("is-selected");
          x.removeAttribute("aria-pressed");
        });
      });
    }

    bindOnce(saveBtn, "click", "day_save", () => {
      const current = loadState();

      if (!selectedIso) {
        setState({ day: null, time: null });
        window.location.href = "/pages/selector.html";
        return;
      }

      const shouldResetTime = current.day && current.day !== selectedIso;

      setState({
        day: selectedIso,
        ...(shouldResetTime ? { time: null } : {}),
      });

      window.location.href = "/pages/selector.html";
    });
  };

  // =========================
  // ROUTER
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    if (page.classList.contains("selector-page")) {
      initSelectorPage();
      return;
    }

    if (document.querySelector(".service-list")) {
      initSelectableListPage({
        itemSelector: ".service-item",
        selectedClass: "is-selected",
        field: "service",
      });
      return;
    }

    // Zona: si existe input custom, usamos initZonePage
    if (document.querySelector(".zone-list")) {
      if (document.getElementById("zone-custom-input") || document.getElementById("zone-custom-btn")) {
        initZonePage();
      } else {
        // fallback por si aún no añadiste la parte de "Otra zona"
        initSelectableListPage({
          itemSelector: ".zone-item",
          selectedClass: "is-selected",
          field: "zone",
        });
      }
      return;
    }

    if (document.querySelector(".time-grid")) {
      initSelectableListPage({
        itemSelector: ".time-slot",
        selectedClass: "is-selected",
        field: "time",
      });
      return;
    }

    if (document.getElementById("day-calendar")) {
      initDayPage();
      return;
    }
  });
})();
