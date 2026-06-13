import "server-only";
import nodemailer from "nodemailer";

/**
 * Envoi d'emails transactionnels via le SMTP du domaine (ponticom/IONOS).
 * Best-effort : un échec d'envoi ne doit jamais casser l'action métier.
 */

let cached: nodemailer.Transporter | null = null;

function transporter(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null; // SMTP non configuré → no-op

  if (!cached) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    cached = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 465 = SSL implicite, 587 = STARTTLS
      auth: { user, pass },
    });
  }
  return cached;
}

const FROM = process.env.SMTP_FROM ?? "Ardoise <contact@ponticom.fr>";

/** Gabarit HTML sobre aux couleurs Ardoise. */
function wrap(title: string, body: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f5ede0;font-family:Georgia,serif;color:#1a1f1f">
  <div style="max-width:520px;margin:0 auto;padding:32px 24px">
    <h1 style="font-size:24px;color:#c4623a;margin:0 0 16px">${title}</h1>
    ${body}
    <p style="margin-top:32px;font-size:12px;color:#4a5e5e">Envoyé via Ardoise</p>
  </div></body></html>`;
}

export async function sendReservationConfirmation(opts: {
  to: string;
  restaurantName: string;
  customerName: string;
  startsAt: string; // ISO
  partySize: number;
}): Promise<void> {
  const t = transporter();
  if (!t) return;

  const when = new Date(opts.startsAt).toLocaleString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  const body = `
    <p>Bonjour ${escapeHtml(opts.customerName)},</p>
    <p>Votre demande de réservation chez <strong>${escapeHtml(opts.restaurantName)}</strong> a bien été reçue :</p>
    <table style="border-collapse:collapse;margin:16px 0">
      <tr><td style="padding:4px 16px 4px 0;color:#4a5e5e">Date</td><td style="padding:4px 0"><strong>${when}</strong></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#4a5e5e">Couverts</td><td style="padding:4px 0"><strong>${opts.partySize}</strong></td></tr>
    </table>
    <p>Le restaurant vous confirmera par téléphone. En cas d'empêchement, prévenez-le directement.</p>`;

  try {
    await t.sendMail({
      from: FROM,
      to: opts.to,
      subject: `Votre réservation chez ${opts.restaurantName}`,
      html: wrap("Réservation reçue", body),
    });
  } catch (err) {
    console.error("sendReservationConfirmation failed:", err);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
