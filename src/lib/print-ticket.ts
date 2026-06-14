/* Impression d'un ticket de cuisine.
   Cible : imprimante thermique 80 mm (rendu correct aussi en A4).
   Pattern identique à qr-card.tsx : on ouvre une fenêtre, on y écrit
   le HTML du ticket, et window.onload déclenche print() puis close(). */

export type KitchenTicket = {
  orderNumber: number;
  tableLabel: string;
  createdAt: string;
  note: string | null;
  items: { name: string; qty: number }[];
};

/* Échappe le contenu dynamique avant injection dans le HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function printKitchenTicket(ticket: KitchenTicket): void {
  const win = window.open("", "_blank", "width=320,height=600");
  // Popup bloquée : on sort sans erreur.
  if (!win) return;

  const heure = new Date(ticket.createdAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemsHtml = ticket.items
    .map(
      (item) =>
        `<li><span class="qty">${item.qty} ×</span> ${escapeHtml(item.name)}</li>`
    )
    .join("");

  const noteHtml = ticket.note
    ? `<p class="note">Note : ${escapeHtml(ticket.note)}</p>`
    : "";

  win.document.write(`<!doctype html>
<html><head><meta charset="utf-8" /><title>Ticket #${ticket.orderNumber}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body {
    width: 72mm;
    margin: 0 auto;
    font-family: "Courier New", monospace;
    color: #000;
    background: #fff;
  }
  .table { font-size: 26px; font-weight: 700; margin: 0; }
  .meta { font-size: 16px; margin: 2px 0 8px; display: flex; justify-content: space-between; }
  hr { border: none; border-top: 1px dashed #000; margin: 8px 0; }
  ul { list-style: none; padding: 0; margin: 0; }
  li { font-size: 17px; font-weight: 700; line-height: 1.4; margin-bottom: 4px; }
  .qty { display: inline-block; min-width: 2.5em; }
  .note { font-size: 16px; font-weight: 700; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; }
</style></head>
<body>
  <p class="table">Table ${escapeHtml(ticket.tableLabel)}</p>
  <div class="meta"><span>#${ticket.orderNumber}</span><span>${heure}</span></div>
  <hr />
  <ul>${itemsHtml}</ul>
  ${noteHtml}
  <script>window.onload = () => { window.print(); window.close(); };</script>
</body></html>`);
  win.document.close();
}
