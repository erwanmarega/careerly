import Link from 'next/link'
import { ArrowRight, Check, Minus } from 'lucide-react'

const mockApplications = [
  {
    company: 'Spotify',
    role: 'Product Designer',
    status: 'Entretien',
    statusColor: 'bg-emerald-500/20 text-emerald-400',
    days: 'il y a 3j',
  },
  {
    company: 'Airbnb',
    role: 'Frontend Engineer',
    status: 'En attente',
    statusColor: 'bg-amber-500/20 text-amber-400',
    days: 'il y a 8j',
  },
  {
    company: 'Alan',
    role: 'UX Designer',
    status: 'À relancer',
    statusColor: 'bg-blue-500/20 text-blue-400',
    days: 'il y a 12j',
  },
  {
    company: 'Notion',
    role: 'Product Manager',
    status: 'Refusé',
    statusColor: 'bg-red-500/20 text-red-400',
    days: 'il y a 15j',
  },
  {
    company: 'BlaBlaCar',
    role: 'UI Designer',
    status: 'Envoyée',
    statusColor: 'bg-white/10 text-white/40',
    days: 'il y a 2j',
  },
]

const comparison = [
  { feature: 'Suivi des candidatures', spreadsheet: true, careerly: true },
  { feature: 'Rappels de relance', spreadsheet: false, careerly: true },
  { feature: 'Historique des statuts', spreadsheet: false, careerly: true },
  { feature: 'Stats sur votre recherche', spreadsheet: false, careerly: true },
  { feature: 'Accessible partout', spreadsheet: false, careerly: true },
  { feature: 'Export PDF', spreadsheet: false, careerly: true },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-black text-xl tracking-tight">Careerly</span>
        <div className="flex items-center gap-6">
          <a
            href="#tarifs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
          >
            Tarifs
          </a>
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold bg-foreground text-background px-4 py-2 rounded-lg hover:bg-foreground/85 transition-colors"
          >
            Commencer
          </Link>
        </div>
      </header>

      <section className="bg-zinc-950 px-6 sm:px-10 pt-20 pb-0">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-12 items-end">
            <div className="pb-20">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-8">
                Gestion de candidatures
              </p>
              <h1 className="text-6xl sm:text-7xl lg:text-8xl leading-[0.88] tracking-tighter text-white mb-8">
                Vous postulez.
                <br />
                <span className="text-primary">On s'occupe</span>
                <br />
                du reste.
              </h1>
              <p className="text-base text-zinc-400 leading-relaxed mb-10 max-w-sm">
                Arrêtez de perdre le fil dans un tableur. Careerly centralise tout — statuts,
                relances, historique.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl hover:bg-primary/90 transition-colors"
                >
                  Essayer gratuitement
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <p className="text-sm text-zinc-600 self-center">Gratuit · Sans carte bancaire</p>
              </div>
            </div>

            <div className="self-end translate-y-px">
              <div className="bg-zinc-900 rounded-t-2xl border border-zinc-800 border-b-0 overflow-hidden">
                <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-white">Mes candidatures</p>
                    <p className="text-xs text-zinc-500">5 actives · 2 à relancer</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  </div>
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {mockApplications.map((app) => (
                    <div key={app.company} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-zinc-400">{app.company[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{app.company}</p>
                        <p className="text-xs text-zinc-600 truncate">{app.role}</p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${app.statusColor}`}
                      >
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-800 px-5 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-500">Entretien Spotify — demain à 10h</span>
                  <span className="text-xs text-zinc-700 ml-auto">40% réponses</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 grid grid-cols-3 divide-x divide-border">
          {[
            { n: '0', label: 'tableur requis' },
            { n: '30s', label: 'pour ajouter une candidature' },
            { n: '6', label: 'statuts pour tout suivre' },
          ].map((s) => (
            <div key={s.n} className="text-center px-4">
              <div className="text-4xl sm:text-5xl font-black text-foreground tabular-nums">
                {s.n}
              </div>
              <div className="text-xs text-muted-foreground mt-1.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section>
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground mb-16">
            Ça vous parle ?
          </p>
          <div className="divide-y divide-border border-t border-border">
            {[
              {
                n: '01',
                pain: 'Vous avez postulé chez Spotify.',
                detail:
                  'Il y a combien de jours déjà ? Ont-ils répondu ? Vous avez relancé ou pas ?',
              },
              {
                n: '02',
                pain: 'Votre tableur a 40 lignes.',
                detail:
                  'Lesquelles sont encore actives ? Lesquelles méritent une relance ? Vous ne savez plus.',
              },
              {
                n: '03',
                pain: "Un recruteur vous rappelle à l'improviste.",
                detail: "Vous cherchez frénétiquement la fiche de poste pendant qu'il parle.",
              },
            ].map((p) => (
              <div
                key={p.n}
                className="py-10 grid grid-cols-[48px_1fr] md:grid-cols-[48px_1fr_1fr] gap-x-8 gap-y-2 items-start group"
              >
                <span className="text-4xl font-black text-muted-foreground/10 leading-none pt-1 group-hover:text-primary/15 transition-colors">
                  {p.n}
                </span>
                <p className="text-lg sm:text-xl font-bold leading-snug">{p.pain}</p>
                <p className="col-start-2 md:col-start-3 text-muted-foreground leading-relaxed">
                  {p.detail}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-10 border-t-2 border-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-2xl font-black">Careerly centralise tout ça.</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Une seule page. Toutes vos candidatures. Toujours à jour.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-foreground text-background font-bold px-6 py-3 rounded-xl hover:bg-foreground/85 transition-colors flex-shrink-0 text-sm"
            >
              Essayer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 text-white border-t-4 border-foreground">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-12">
                Comment ça marche
              </p>
              <div className="space-y-12">
                {[
                  {
                    n: '01',
                    t: 'Vous postulez',
                    d: 'Ajoutez une candidature en 30 secondes — entreprise, poste, date, lien. Rien de plus.',
                  },
                  {
                    n: '02',
                    t: "Vous suivez l'avancée",
                    d: 'Chaque entretien planifié, chaque email reçu, chaque silence prolongé — tout est tracé.',
                  },
                  {
                    n: '03',
                    t: 'Vous relancez au bon moment',
                    d: 'Un rappel vous prévient quand il est temps de recontacter. Pas trop tôt, pas trop tard.',
                  },
                ].map((step) => (
                  <div key={step.n} className="flex gap-6 group">
                    <span className="text-5xl font-black text-zinc-800 leading-none w-14 flex-shrink-0 group-hover:text-primary transition-colors">
                      {step.n}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg mb-2 text-white">{step.t}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{step.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 lg:sticky lg:top-8">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-6">
                Careerly vs Excel
              </p>
              <div className="grid grid-cols-3 pb-4 border-b border-zinc-800">
                <span />
                <span className="text-xs font-medium text-center text-zinc-600">Excel</span>
                <span className="text-xs font-bold text-center text-primary">Careerly</span>
              </div>
              {comparison.map((row) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-3 py-3.5 border-b border-zinc-800/60 last:border-0 items-center"
                >
                  <span className="text-sm text-zinc-400">{row.feature}</span>
                  <div className="flex justify-center">
                    {row.spreadsheet ? (
                      <Check className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <Minus className="w-4 h-4 text-zinc-700" />
                    )}
                  </div>
                  <div className="flex justify-center">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="tarifs" className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
          <h2 className="text-4xl font-black tracking-tight mb-2">Tarifs</h2>
          <p className="text-muted-foreground mb-12 text-sm">
            Commencez gratuit, passez Pro si vous en avez besoin.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="border border-border rounded-2xl p-7">
              <div className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">
                Free
              </div>
              <div className="text-5xl font-black mb-1">0€</div>
              <p className="text-sm text-muted-foreground mb-8">Pour tester</p>
              <ul className="space-y-2.5 mb-8">
                {['10 candidatures', 'Suivi des statuts', 'Tableau de bord'].map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-foreground/30 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="block text-center text-sm font-bold border-2 border-border rounded-xl py-3 hover:bg-secondary transition-colors"
              >
                Commencer
              </Link>
            </div>

            <div className="border-2 border-primary rounded-2xl p-7 relative">
              <div className="absolute -top-3.5 left-6 bg-primary text-white text-xs font-black px-3 py-1 rounded-full tracking-wide">
                Le plus utilisé
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-primary mb-6">
                Pro
              </div>
              <div className="text-5xl font-black mb-1">8€</div>
              <p className="text-sm text-muted-foreground mb-8">par mois</p>
              <ul className="space-y-2.5 mb-8">
                {[
                  'Candidatures illimitées',
                  'Rappels de relance',
                  'Statistiques avancées',
                  'Export CSV & PDF',
                  'Historique des statuts',
                  'Assistant IA (bientôt)',
                ].map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/register?plan=pro"
                className="block text-center text-sm font-bold bg-primary text-white rounded-xl py-3 hover:bg-primary/90 transition-colors"
              >
                Passer en Pro
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 border-t-4 border-foreground">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-24">
          <h2 className="text-5xl sm:text-6xl lg:text-8xl text-white leading-[0.88] tracking-tighter mb-12 max-w-4xl">
            Votre prochaine
            <br />
            <span className="text-primary">candidature</span>
            <br />
            mérite mieux.
          </h2>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-colors text-sm"
          >
            Commencer maintenant — c'est gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black text-sm text-white">Careerly</span>
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} — Tous droits réservés
          </p>
          <div className="flex gap-5">
            <Link
              href="/privacy"
              className="text-xs text-zinc-600 hover:text-white transition-colors"
            >
              Confidentialité
            </Link>
            <Link
              href="/terms"
              className="text-xs text-zinc-600 hover:text-white transition-colors"
            >
              CGU
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
