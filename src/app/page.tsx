import Link from "next/link";

/* Landing — cible bar / café / terrasse. Héro asymétrique, pas de badge
   flottant, pas de grille de cards identiques, pas d'illustration 3D.
   Ticket de comptoir en CSS pur (preuve > promesse). */

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
              Espace gérant
            </Link>
          </nav>
        </div>
      </header>

      {/* Héro asymétrique 55/45 */}
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[55fr_45fr] md:py-24">
        <div className="flex flex-col justify-center">
          <p className="font-mono text-sm uppercase tracking-[0.12em] text-terracotta">
            Bars · cafés · terrasses
          </p>
          <h1 className="mt-4 font-display text-[42px] font-bold leading-[1.05] tracking-tight md:text-[64px]">
            En terrasse, on
            <br />
            <span className="text-terracotta">n&apos;attend plus.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-ardoise-mid">
            Vos clients scannent le QR de leur table et commandent. Le comptoir
            reçoit le ticket en direct. Plus de mains levées, plus d&apos;allers-retours
            inutiles&nbsp;: vos serveurs servent, la terrasse tourne.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="press inline-flex h-12 items-center rounded-[4px] bg-terracotta px-6 text-[16px] font-semibold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
            >
              Tester sur ma terrasse
            </Link>
            <a
              href="#fonctionnement"
              className="press inline-flex h-12 items-center rounded-[4px] border-[1.5px] border-terracotta px-6 text-[16px] font-semibold text-terracotta hover:bg-terracotta/5"
            >
              Voir le fonctionnement
            </a>
          </div>
          <p className="mt-5 text-sm text-ardoise-mid">
            Zéro commission · zéro matériel à acheter · mise en route en 20 minutes
          </p>
        </div>

        {/* Ticket de comptoir — zéro image, typographie pure */}
        <div
          className="hidden min-h-[420px] flex-col justify-center bg-ardoise-night p-10 text-creme md:flex"
          style={{ clipPath: "polygon(6% 0, 100% 0, 100% 100%, 0 100%)" }}
        >
          <p className="font-display text-xl font-semibold text-terracotta-pale">
            Terrasse 4 — reçu au comptoir
          </p>
          <ul className="mt-6 space-y-4 font-mono text-[15px]">
            <li className="flex justify-between gap-4 border-l-[3px] border-terracotta pl-4">
              <span>2 × Spritz</span>
              <span>16,00 €</span>
            </li>
            <li className="flex justify-between gap-4 border-l-[3px] border-terracotta pl-4">
              <span>1 × Pression 50cl</span>
              <span>6,50 €</span>
            </li>
            <li className="flex justify-between gap-4 border-l-[3px] border-terracotta pl-4">
              <span>1 × Planche mixte</span>
              <span>14,00 €</span>
            </li>
          </ul>
          <p className="mt-8 border-t border-creme/20 pt-4 font-mono text-sm text-creme/70">
            Commande #47 · reçue il y a 8 s · en préparation
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
                body: "Chaque table — ou chaque coin de terrasse — a son code, lié à une session que vous ouvrez le matin et fermez le soir. Une table libérée ne reçoit plus de commande.",
              },
              {
                n: "2",
                title: "Il commande depuis son téléphone",
                body: "Votre carte, vos prix, vos photos. Pas de compte à créer, pas d'application à installer. Il commande sa tournée en dix secondes, le serveur n'a plus à traverser la salle pour prendre la commande.",
              },
              {
                n: "3",
                title: "Le comptoir reçoit le ticket en direct",
                body: "Un écran derrière le bar, lisible à deux mètres. Le ticket tombe, vous préparez, vous marquez « prêt ». Pas de tablette en cuisine, pas de nouveau matériel : l'écran que vous avez déjà suffit.",
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

      {/* Pourquoi ça change tout en terrasse — deux colonnes asymétriques */}
      <section className="py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-[2fr_3fr]">
          <h2 className="font-display text-[28px] font-bold md:text-[42px]">
            Pensé pour le
            <br />
            coup de feu en terrasse
          </h2>
          <ul className="space-y-5 text-[17px]">
            {[
              "La terrasse pleine commande sans attendre qu'un serveur passe",
              "Le comptoir reçoit chaque tournée en direct, lisible à deux mètres",
              "Aucun matériel à acheter : votre écran actuel suffit, ticket papier en option",
              "Votre carte modifiable en direct — rupture d'un fût ou d'un plat en un clic",
              "Encaissement au comptoir, comme aujourd'hui : rien à changer en caisse",
              "Réservations en ligne incluses pour les tables du soir",
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

      {/* Prix transparent — l'argument zéro commission en gras */}
      <section className="bg-craie py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-[28px] font-bold md:text-[42px]">
            Un prix clair. Zéro commission.
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-ardoise-mid">
            Les plateformes prennent une part sur chaque commande. Nous, jamais.
            Un abonnement fixe, et chaque euro encaissé reste à vous.
          </p>
          <div className="mt-10 max-w-md border-l-[3px] border-terracotta pl-6">
            <p className="font-display text-[56px] font-bold leading-none">
              59&nbsp;€
              <span className="text-xl font-semibold text-ardoise-mid">
                {" "}
                / mois
              </span>
            </p>
            <p className="mt-3 text-ardoise-mid">
              Tout compris. Sans engagement. Sans commission sur vos ventes.
            </p>
            <Link
              href="/login"
              className="press mt-6 inline-flex h-12 items-center rounded-[4px] bg-terracotta px-6 text-[16px] font-semibold text-craie transition-colors duration-150 hover:bg-terracotta-dark"
            >
              Tester gratuitement
            </Link>
          </div>
        </div>
      </section>

      {/* CTA final sur fond ardoise */}
      <section className="bg-ardoise-deep py-20 text-creme">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display max-w-2xl text-[28px] font-bold md:text-[42px]">
            Mettez le QR sur vos tables dès demain midi.
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
            Conçu pour les bars et cafés indépendants — Guyane &amp; Métropole
          </span>
        </div>
      </footer>
    </main>
  );
}
