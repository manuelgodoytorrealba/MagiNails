// /scripts/config.js
(() => {
  window.MAGI = window.MAGI || {};

  window.MAGI.CONFIG = {
    STORAGE_KEY: "maginails_booking_v1",
    WHATSAPP_NUMBER: "34646074096",

    ROUTES: {
      selector: "/pages/selector.html",
      service: "/pages/servicio.html",
      zone: "/pages/zona.html",
      day: "/pages/dia.html",
      time: "/pages/horario.html",
    },

    MONTHS_ES: [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ],
  };
})();