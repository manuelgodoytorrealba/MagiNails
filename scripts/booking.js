// /scripts/booking.js
(() => {
  const STORAGE_KEY = "maginails_booking_v1";

  const DEFAULT_STATE = {
    service: null,
    zone: null,
    day: null,   // formato "YYYY-MM-DD"
    time: null,  // ejemplo "11:00 AM"
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
    // iso: "YYYY-MM-DD"
    if (!iso) return null;
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return null;
    // DD-MM-YY
    return `${d}-${m}-${y.slice(2)}`;
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

    if (serviceEl) serviceEl.textContent = state.service ?? "Selecciona un servicio";
    if (zoneEl) zoneEl.textContent = state.zone ?? "Selecciona una zona";
    if (dayEl) dayEl.textContent = state.day ? formatDay(state.day) : "Selecciona un día";
    if (timeEl) timeEl.textContent = state.time ?? "Selecciona un horario";

    const ready = !!(state.service && state.zone && state.day && state.time);

    if (cta) {
      cta.disabled = !ready;

      cta.addEventListener("click", () => {
        const latest = loadState();
        const ok = !!(latest.service && latest.zone && latest.day && latest.time);
        if (!ok) return;

        const fecha = formatDay(latest.day);

        const msg =
          `Hola ✨
          Quiero reservar una cita en MagiNails.

          • Servicio: ${latest.service}
          • Zona: ${latest.zone}
          • Día: ${fecha}
          • Horario: ${latest.time}

          ¿Me confirmas disponibilidad, por favor?`;

        const encoded = encodeURIComponent(msg);

        const phone = "34680973028";
        const url = `https://wa.me/${phone}?text=${encoded}`;

        window.open(url, "_blank", "noopener,noreferrer");
      });
    }


  };

  // =========================
  // GENERIC SELECT LIST (servicio / zona / horario)
  // =========================
  const initSelectableListPage = ({ itemSelector, selectedClass, field }) => {
    const items = Array.from(document.querySelectorAll(itemSelector));
    const saveBtn = document.querySelector(".flow-save");
    if (!items.length || !saveBtn) return;

    const state = loadState();
    let currentValue = state[field] ?? null;

    // si hay algo guardado, marcarlo visualmente
    if (currentValue) {
      items.forEach((el) => {
        const v = el.getAttribute("data-value");
        el.classList.toggle(selectedClass, v === currentValue);
      });
    }

    items.forEach((el) => {
      el.addEventListener("click", () => {
        items.forEach((x) => x.classList.remove(selectedClass));
        el.classList.add(selectedClass);
        currentValue = el.getAttribute("data-value");
      });
    });

    saveBtn.addEventListener("click", () => {
      if (!currentValue) return;

      // Si cambia el día, normalmente debería resetear horario.
      // Pero aquí aplica solo si field === "day".
      setState({ [field]: currentValue });
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

    // Si ya hay una fecha guardada, úsala; si no, usa hoy
    const today = new Date();
    const initialIso = state.day ?? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    let selectedIso = state.day ?? null;

    const MONTHS_ES = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const buildMonth = (year, monthIndex) => {
      // monthIndex: 0-11
      const firstDay = new Date(year, monthIndex, 1);
      const lastDay = new Date(year, monthIndex + 1, 0);
      const daysInMonth = lastDay.getDate();

      // Queremos semana empezando en Lunes, pero tu UI empieza en Dom (Dom...Sáb)
      // Con Dom primero, getDay() ya sirve: 0=Dom, 1=Lun...6=Sáb
      const offset = firstDay.getDay(); // cantidad de "vacíos" antes del día 1

      const section = document.createElement("section");
      section.className = "month";

      const title = document.createElement("h3");
      title.className = "month-title";
      title.textContent = `${MONTHS_ES[monthIndex]} ${year}`;
      section.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "month-grid";

      // vacíos
      for (let i = 0; i < offset; i++) {
        const empty = document.createElement("span");
        empty.className = "day-empty";
        grid.appendChild(empty);
      }

      // días
      for (let d = 1; d <= daysInMonth; d++) {
        const btn = document.createElement("button");
        btn.className = "day-cell";
        btn.type = "button";
        btn.textContent = String(d);

        const iso = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

        // marcar HOY
        const isToday =
          iso === `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

        if (isToday) btn.classList.add("is-today");

        // marcar SELECCIONADO (si existía o si el usuario hace click)
        if (selectedIso && iso === selectedIso) {
          btn.classList.add("is-selected");
          btn.setAttribute("aria-pressed", "true");
        }

        btn.addEventListener("click", () => {
          // desmarcar otros
          calendarRoot.querySelectorAll(".day-cell.is-selected").forEach((x) => {
            x.classList.remove("is-selected");
            x.removeAttribute("aria-pressed");
          });

          btn.classList.add("is-selected");
          btn.setAttribute("aria-pressed", "true");
          selectedIso = iso;
        });

        grid.appendChild(btn);
      }

      section.appendChild(grid);
      return section;
    };

    // Render: mes actual (foco) + siguiente
   const baseDate = state.day ? new Date(state.day) : new Date();

    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();

    calendarRoot.innerHTML = "";
    calendarRoot.appendChild(buildMonth(y, m));

    const next = new Date(y, m + 1, 1);
    calendarRoot.appendChild(buildMonth(next.getFullYear(), next.getMonth()));

    // Botón limpiar: borra día y (opcional) horario
    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        setState({ day: null, time: null }); // si cambias día, lo normal es resetear horario
        selectedIso = null;

        calendarRoot.querySelectorAll(".day-cell.is-selected").forEach((x) => {
          x.classList.remove("is-selected");
          x.removeAttribute("aria-pressed");
        });
      });
    }

    saveBtn.addEventListener("click", () => {
      if (!selectedIso) return;

      const current = loadState();
      const shouldResetTime = current.day && current.day !== selectedIso;

      setState({
        day: selectedIso,
        ...(shouldResetTime ? { time: null } : {}),
      });

      window.location.href = "/pages/selector.html";
    });
  };


  // =========================
  // ROUTER SIMPLE POR CLASE BODY
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    if (page.classList.contains("selector-page")) {
      initSelectorPage();
      return;
    }

    // servicio
    if (document.querySelector(".service-list")) {
      initSelectableListPage({
        itemSelector: ".service-item",
        selectedClass: "is-selected",
        field: "service",
      });
      return;
    }

    // zona
    if (document.querySelector(".zone-list")) {
      initSelectableListPage({
        itemSelector: ".zone-item",
        selectedClass: "is-selected",
        field: "zone",
      });
      return;
    }

    // horario
    if (document.querySelector(".time-grid")) {
      initSelectableListPage({
        itemSelector: ".time-slot",
        selectedClass: "is-selected",
        field: "time",
      });
      return;
    }

    // día
    if (document.getElementById("day-calendar")) {
      initDayPage();
      return;
    }
  });
})();
