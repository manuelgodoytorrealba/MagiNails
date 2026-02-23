// /scripts/booking.js
(() => {
  const page = document.body;

  document.addEventListener("DOMContentLoaded", () => {
    const flow = window.MAGI.bookingFlow;

    if (page.classList.contains("selector-page")) {
      flow.initSelectorPage();
      return;
    }

    if (document.querySelector(".service-list")) {
      flow.initSelectableListPage({
        itemSelector: ".service-item",
        selectedClass: "is-selected",
        field: "service",
      });
      return;
    }

    if (document.querySelector(".zone-list")) {
      if (document.getElementById("zone-custom-input") || document.getElementById("zone-custom-btn")) {
        flow.initZonePage();
      } else {
        flow.initSelectableListPage({
          itemSelector: ".zone-item",
          selectedClass: "is-selected",
          field: "zone",
        });
      }
      return;
    }

    if (document.querySelector(".time-grid")) {
      flow.initSelectableListPage({
        itemSelector: ".time-slot",
        selectedClass: "is-selected",
        field: "time",
      });
      return;
    }

    if (document.getElementById("day-calendar")) {
      flow.initDayPage();
      return;
    }
  });
})();