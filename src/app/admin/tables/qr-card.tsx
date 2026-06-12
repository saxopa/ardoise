"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export default function QrCard({
  qrUid,
  tableLabel,
  restaurantName,
}: {
  qrUid: string;
  tableLabel: string;
  restaurantName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    // QR PERMANENT : encode /q/<qr_uid>, jamais le token de session.
    // S'imprime une seule fois ; le serveur résout la session à chaque scan.
    const qrUrl = `${window.location.origin}/q/${qrUid}`;
    // Valeur browser-only (origin) : initialisation en effet, pattern volontaire.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(qrUrl);
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrUrl, {
        width: 180,
        margin: 1,
        color: { dark: "#1a1f1f", light: "#fafaf7" },
      });
    }
  }, [qrUid]);

  function printQr() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const win = window.open("", "_blank", "width=420,height=560");
    if (!win) return;
    win.document.write(`<!doctype html>
<html><head><title>QR Table ${tableLabel}</title>
<style>
  body { font-family: Georgia, serif; text-align: center; padding: 40px 20px; color: #1a1f1f; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  p { margin: 4px 0; color: #4a5e5e; }
  img { margin-top: 16px; }
  .hint { font-size: 13px; margin-top: 16px; }
</style></head>
<body>
  <h1>${restaurantName.replace(/</g, "&lt;")}</h1>
  <p>Table ${tableLabel.replace(/</g, "&lt;")}</p>
  <img src="${dataUrl}" width="220" height="220" alt="QR code" />
  <p class="hint">Scannez pour consulter la carte et commander</p>
  <script>window.onload = () => { window.print(); window.close(); };</script>
</body></html>`);
    win.document.close();
  }

  return (
    <div className="flex flex-col items-center rounded-[8px] border border-ardoise-deep/12 bg-craie p-4">
      <canvas ref={canvasRef} className="rounded-[4px]" />
      <p className="mt-2 max-w-full truncate font-mono text-xs text-ardoise-mid">
        {url}
      </p>
      <p className="mt-1 text-xs text-ardoise-mid">
        QR permanent — à imprimer une seule fois
      </p>
      <button
        type="button"
        onClick={printQr}
        className="press mt-3 inline-flex h-9 items-center rounded-[4px] border-[1.5px] border-terracotta px-4 text-sm font-semibold text-terracotta hover:bg-terracotta/5"
      >
        Imprimer le QR
      </button>
    </div>
  );
}
