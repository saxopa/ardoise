import Link from "next/link";
import { signOut } from "@/app/login/actions";
import { getUserRestaurant } from "@/lib/restaurant";

const NAV = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/orders", label: "Commandes" },
  { href: "/admin/menu", label: "Carte" },
  { href: "/admin/tables", label: "Tables & QR" },
  { href: "/admin/reservations", label: "Réservations" },
  { href: "/admin/settings", label: "Réglages" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { restaurant } = await getUserRestaurant();

  return (
    <div className="flex min-h-screen flex-1">
      {/* Sidebar fixe fond ardoise — pas de nav top */}
      <aside className="hidden w-60 shrink-0 flex-col bg-ardoise-deep text-creme md:flex">
        <div className="px-6 py-6">
          <Link href="/admin" className="font-display text-2xl font-bold">
            Ardoise
          </Link>
          {restaurant && (
            <p className="mt-1 truncate text-sm text-creme/60">
              {restaurant.name}
            </p>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[4px] px-3 py-2 text-[15px] text-creme/80 transition-colors duration-150 hover:bg-creme/8 hover:text-creme"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/kitchen"
            className="mt-4 rounded-[4px] border border-terracotta-pale/40 px-3 py-2 text-[15px] font-medium text-terracotta-pale transition-colors duration-150 hover:bg-terracotta/15"
          >
            Écran cuisine →
          </Link>
        </nav>
        <form action={signOut} className="px-6 py-6">
          <button
            type="submit"
            className="text-sm text-creme/60 underline underline-offset-[3px] hover:text-creme"
          >
            Se déconnecter
          </button>
        </form>
      </aside>

      {/* Nav mobile */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center gap-3 overflow-x-auto border-b border-ardoise-deep/12 bg-ardoise-deep px-4 py-3 text-creme md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm text-creme/80"
            >
              {item.label}
            </Link>
          ))}
        </header>
        <main className="flex-1 px-6 py-8 md:px-10">{children}</main>
      </div>
    </div>
  );
}
