import Link from "next/link";

/* Landing — héro asymétrique, pas de badge flottant, pas de section stats,
   pas de grille de 3 cards identiques. Ardoise de bistrot en CSS pur. */

export default function Home() {
  return (
    <main className="flex-1">
      {/* Nav */}
      <header className="border-b border-ardoise-deep/12">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="font-display text-2xl font-bold tracking-tight">
            Ardoise
          </span>
          <nav className="flex items-center gap-6 text-[15px]">
            <a
              href="#fonctionnement"
              className="hidden text-ardoise-mid underline decoration-ardoise-mid/40 underline-offset-[3px] hover:text-encre sm:block"
            >
              Comment ça marche
            </a>
            <Link
              href="/login"
              className="press inline-flex h-10 items-center rounded-[4px] bg-terracotta px-4 font-semibold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
            >
              Espace restaurateur
            </Link>
          </nav>
        </div>
      </header>

      {/* Héro asymétrique 55/45 */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[55fr_45fr] md:py-24">
        <div className="flex flex-col justify-center">
          <h1 className="font-display text-[42px] font-bold leading-[1.05] tracking-tight md:text-[64px]">
            Vos clients commandent.
            <br />
            <span className="text-terracotta">Votre cuisine suit.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ardoise-mid">
            Un QR code sur chaque table. Le client consulte la carte, commande,
            la cuisine reçoit le ticket en temps réel. Sans commission, sans
            matériel à acheter, sans application à installer.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="press inline-flex h-12 items-center rounded-[4px] bg-terracotta px-6 text-[16px] font-semibold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
            >
              Essayer gratuitement
            </Link>
            <a
              href="#fonctionnement"
              className="press inline-flex h-12 items-center rounded-[4px] border-[1.5px] border-terracotta px-6 text-[16px] font-semibold text-terracotta hover:bg-terracotta/5"
            >
              Voir le fonctionnement
            </a>
          </div>
        </div>

        {/* Ardoise de bistrot — zéro image, typographie pure */}
        <div
          className="hidden min-h-[420px] flex-col justify-center bg-ardoise-night p-10 text-creme md:flex"
          style={{ clipPath: "polygon(6% 0, 100% 0, 100% 100%, 0 100%)" }}
        >
          <p className="font-display text-xl font-semibold text-terracotta-pale">
            Table 12 — Le Comptoir
          </p>
          <ul className="mt-6 space-y-4 font-mono text-[15px]">
            <li className="flex justify-between gap-4 border-l-[3px] border-terracotta pl-4">
              <span>2 × Magret de canard</span>
              <span>52,00 €</span>
            </li>
            <li className="flex justify-between gap-4 border-l-[3px] border-terracotta pl-4">
              <span>1 × Salade landaise</span>
              <span>14,50 €</span>
            </li>
            <li className="flex justify-between gap-4 border-l-[3px] border-terracotta pl-4">
              <span>3 × Verre — Cahors</span>
              <span>18,00 €</span>
            </li>
          </ul>
          <p className="mt-8 border-t border-creme/20 pt-4 font-mono text-sm text-creme/70">
            Commande #47 · reçue en cuisine il y a 8 s
          </p>
        </div>
      </section>

      {/* Fonctionnement — liste numérotée verticale, pas de cards */}
      <section id="fonctionnement" className="bg-craie py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-[28px] font-bold md:text-[42px]">
            Trois gestes, zéro friction
          </h2>
          <ol className="mt-12 space-y-12 md:space-y-16">
            {[
              {
                n: "1",
                title: "Le client scanne le QR de sa table",
                body: "Chaque table possède son code, lié à une session sécurisée que vous ouvrez et fermez depuis votre tableau de bord. Une table libérée ne peut plus recevoir de commande.",
              },
              {
                n: "2",
                title: "Il commande depuis sa poche",
                body: "Votre carte, vos prix, vos photos. Le client compose sa commande sans créer de compte ni installer quoi que ce soit. Les prix sont vérifiés côté serveur, pas dans le navigateur.",
              },
              {
                n: "3",
                title: "La cuisine reçoit le ticket immédiatement",
                body: "Écran cuisine en temps réel, lisible à deux mètres. Chaque ticket avance : reçu, en préparation, prêt, servi. Le client suit l'avancement depuis sa table.",
              },
            ].map((step) => (
              <li key={step.n} className="grid gap-4 md:grid-cols-[120px_1fr]">
                <span className="font-display text-[42px] font-bold leading-none text-terracotta">
                  {step.n}
                </span>
                <div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 max-w-2xl leading-relaxed text-ardoise-mid">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Ce qui est inclus — deux colonnes asymétriques */}
      <section className="py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[2fr_3fr]">
          <h2 className="font-display text-[28px] font-bold md:text-[42px]">
            Tout est compris,
            <br />
            rien n&apos;est en option
          </h2>
          <ul className="space-y-5 text-[17px]">
            {[
              "Commande à table par QR code, sessions sécurisées par table",
              "Écran cuisine temps réel — aucun rechargement de page",
              "Réservations en ligne avec gestion des statuts",
              "Carte et menus modifiables en direct (rupture = un clic)",
              "Tableau de bord : commandes du jour, chiffre, couverts",
              "Vos données chez vous : export possible à tout moment",
            ].map((f) => (
              <li
                key={f}
                className="border-l-[3px] border-terracotta pl-4 leading-relaxed"
              >
                {f}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA final sur fond ardoise */}
      <section className="bg-ardoise-deep py-20 text-creme">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display max-w-2xl text-[28px] font-bold md:text-[42px]">
            Mettez votre carte sur la table dès ce soir.
          </h2>
          <p className="mt-4 max-w-xl text-creme/80">
            Création du compte, de la carte et des QR codes en moins de vingt
            minutes. Aucune carte bancaire demandée pour essayer.
          </p>
          <Link
            href="/login"
            className="press mt-8 inline-flex h-12 items-center rounded-[4px] bg-terracotta px-6 text-[16px] font-semibold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
          >
            Créer mon espace
          </Link>
        </div>
      </section>

      <footer className="border-t border-ardoise-deep/12 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 text-sm text-ardoise-mid">
          <span className="font-display text-lg font-bold text-encre">
            Ardoise
          </span>
          <span>
            Conçu pour les restaurateurs indépendants — Guyane &amp; Métropole
          </span>
        </div>
      </footer>
    </main>
  );
}
