// /scripts/integrations/whatsapp.js
(() => {
  window.MAGI = window.MAGI || {};
  const { WHATSAPP_NUMBER } = window.MAGI.CONFIG;

  const formatDay = (iso) => {
    if (!iso) return null;
    const [y, m, d] = iso.split("-");
    if (!y || !m || !d) return null;
    return `${d}-${m}-${y.slice(2)}`; // DD-MM-YY
  };

  const buildMessage = ({ name, note, state }) => {
    const fecha = formatDay(state.day);

    return `Hola ✨
Quiero reservar una cita en MagiNails.

• Nombre: ${name}
• Servicio: ${state.service}
• Zona: ${state.zone}
• Día: ${fecha}
• Horario: ${state.time}
${note ? `• Nota: ${note}` : ""}

¿Me confirmas disponibilidad?`;
  };

  const openChat = (msg) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  window.MAGI.whatsapp = { formatDay, buildMessage, openChat };
})();