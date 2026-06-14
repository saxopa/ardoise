"use client";

/* Bandeau de coupure réseau — sobre, sticky en haut.
   N'apparaît que lorsque le canal Realtime est déconnecté. */

export function OfflineBanner({ connected }: { connected: boolean }) {
  if (connected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-50 flex items-center justify-center gap-2.5 bg-ardoise-deep px-4 py-2 text-center text-[13px] font-medium text-creme"
    >
      <span
        aria-hidden="true"
        className="inline-block h-2 w-2 animate-pulse rounded-full bg-terracotta-pale"
      />
      Connexion perdue — reconnexion en cours…
    </div>
  );
}
