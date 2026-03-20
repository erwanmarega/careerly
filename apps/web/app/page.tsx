import Link from 'next/link'
import { ArrowRight, Check, Users, BarChart3, Bell, Shield, ChevronRight } from 'lucide-react'

const mockStudents = [
  { name: 'Camille Dupont', apps: 12, status: 'Alternance trouvée', color: 'bg-emerald-500/20 text-emerald-400' },
  { name: 'Lucas Martin', apps: 8, status: 'En recherche', color: 'bg-amber-500/20 text-amber-400' },
  { name: 'Inès Bouchard', apps: 5, status: 'En recherche', color: 'bg-amber-500/20 text-amber-400' },
  { name: 'Tom Lefebvre', apps: 0, status: 'Pas démarré', color: 'bg-zinc-700/60 text-zinc-400' },
  { name: 'Sofia Moreau', apps: 15, status: 'Alternance trouvée', color: 'bg-emerald-500/20 text-emerald-400' },
]

const features = [
  {
    icon: Users,
    title: 'Visibilité totale sur votre promotion',
    description: 'Voyez en un coup d\'œil quels étudiants sont actifs, lesquels ont décroché leur alternance, et lesquels n\'ont pas encore démarré.',
  },
  {
    icon: Bell,
    title: 'Alertes étudiants inactifs',
    description: 'Soyez notifié quand un étudiant n\'a pas ajouté de candidature depuis trop longtemps. Intervenez avant qu\'il soit trop tard.',
  },
  {
    icon: BarChart3,
    title: 'Taux de placement en temps réel',
    description: 'Suivez le taux de placement de chaque promotion mois par mois. Des données concrètes pour vos bilans pédagogiques.',
  },
  {
    icon: Shield,
    title: 'Données maîtrisées et sécurisées',
    description: 'Les étudiants rejoignent volontairement votre espace. Hébergement en Europe, conformité RGPD.',
  },
]

const steps = [
  {
    who: 'École',
    n: '01',
    title: 'Créez votre espace école',
    desc: 'En 2 minutes, votre CFA dispose d\'un tableau de bord dédié avec un code d\'invitation unique pour votre promotion.',
  },
  {
    who: 'Étudiants',
    n: '02',
    title: 'Les étudiants rejoignent',
    desc: 'Ils créent leur compte sur Postulo, saisissent votre code, et commencent à tracker leurs candidatures depuis n\'importe où.',
  },
  {
    who: 'École',
    n: '03',
    title: 'Vous suivez en temps réel',
    desc: 'Votre tableau de bord se met à jour au fil des candidatures. Plus besoin de relancer les étudiants par email pour savoir où ils en sont.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      <header className="px-6 sm:px-10 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-black text-xl tracking-tight">Postulo</span>
        <div className="flex items-center gap-6">
          <a href="#fonctionnalites" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Fonctionnalités
          </a>
          <a href="#tarifs" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
            Tarifs
          </a>
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Connexion
          </Link>
          <a
            href="mailto:contact@postulo.fr"
            className="text-sm font-semibold bg-foreground text-background px-4 py-2 rounded-lg hover:bg-foreground/85 transition-colors"
          >
            Demander une démo
          </a>
        </div>
      </header>

      <section className="relative bg-zinc-950 px-6 sm:px-10 pt-20 pb-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-12 items-end">
            <div className="pb-20">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-8 border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Conçu pour les CFA et écoles
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl leading-[0.9] tracking-tighter text-white mb-8">
                Sachez qui a trouvé
                <br />
                son alternance.
                <br />
                <span className="text-primary">En temps réel.</span>
              </h1>
              <p className="text-base text-zinc-400 leading-relaxed mb-10 max-w-md">
                Postulo donne à votre équipe pédagogique une visibilité complète sur la recherche d'alternance de chaque étudiant — sans les relancer un par un.
              </p>
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <a
                  href="mailto:contact@postulo.fr"
                  className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl hover:bg-primary/90 transition-colors font-semibold"
                >
                  Demander une démo
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#fonctionnalites"
                  className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm self-center"
                >
                  Voir comment ça marche
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="self-end translate-y-px">
              <div className="bg-zinc-900 rounded-t-2xl border border-zinc-800 border-b-0 overflow-hidden">
                <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-white">Promotion 2024 — BTS SIO</p>
                    <p className="text-xs text-zinc-500">24 étudiants · 8 alternances trouvées</p>
                  </div>
                  <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                    33% placés
                  </div>
                </div>
                <div className="divide-y divide-zinc-800/60">
                  {mockStudents.map((s) => (
                    <div key={s.name} className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-black text-zinc-400">{s.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{s.name}</p>
                        <p className="text-xs text-zinc-600">{s.apps} candidature{s.apps !== 1 ? 's' : ''}</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-800 px-5 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-zinc-500">Tom Lefebvre — aucune candidature depuis 3 semaines</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 grid grid-cols-3 divide-x divide-border">
          {[
            { n: '0', label: 'email de relance à envoyer' },
            { n: '100%', label: 'visibilité sur votre promo' },
            { n: 'temps réel', label: 'taux de placement mis à jour' },
          ].map((s) => (
            <div key={s.n} className="text-center px-4">
              <div className="text-3xl sm:text-4xl font-black text-foreground tabular-nums">{s.n}</div>
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
                pain: 'Vous ne savez pas qui cherche encore.',
                detail: 'La date de rentrée approche et vous découvrez en dernière minute que 30% de votre promo est encore sans alternance.',
              },
              {
                n: '02',
                pain: 'Relancer 80 étudiants par email prend des heures.',
                detail: 'Chaque mois, vous envoyez des mails pour savoir où ils en sont. La moitié ne répond pas.',
              },
              {
                n: '03',
                pain: 'Vos bilans pédagogiques manquent de données.',
                detail: 'Combien de candidatures envoyées en moyenne ? Quel taux d\'entretien ? Impossible à mesurer sans outil.',
              },
            ].map((p) => (
              <div key={p.n} className="py-10 grid grid-cols-[48px_1fr] md:grid-cols-[48px_1fr_1fr] gap-x-8 gap-y-2 items-start group">
                <span className="text-4xl font-black text-muted-foreground/10 leading-none pt-1 group-hover:text-primary/15 transition-colors">
                  {p.n}
                </span>
                <p className="text-lg sm:text-xl font-bold leading-snug">{p.pain}</p>
                <p className="col-start-2 md:col-start-3 text-muted-foreground leading-relaxed">{p.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-10 border-t-2 border-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <p className="text-2xl font-black">Postulo résout ça.</p>
              <p className="text-muted-foreground mt-1 text-sm">Un tableau de bord. Toute votre promo. Toujours à jour.</p>
            </div>
            <a
              href="mailto:contact@postulo.fr"
              className="inline-flex items-center gap-2 bg-foreground text-background font-bold px-6 py-3 rounded-xl hover:bg-foreground/85 transition-colors flex-shrink-0 text-sm"
            >
              Demander une démo
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      <section id="fonctionnalites" className="bg-zinc-950 text-white border-t-4 border-foreground">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-4">
            Fonctionnalités
          </p>
          <h2 className="text-4xl font-black text-white mb-16 max-w-xl leading-tight tracking-tight">
            Tout ce dont votre équipe pédagogique a besoin.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((f) => (
              <div key={f.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-7 hover:border-zinc-700 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground mb-4">
            Comment ça marche
          </p>
          <h2 className="text-4xl font-black mb-16 tracking-tight">Opérationnel en 10 minutes.</h2>
          <div className="space-y-0 divide-y divide-border border-t border-border">
            {steps.map((step) => (
              <div key={step.n} className="py-10 grid grid-cols-1 md:grid-cols-[48px_120px_1fr_1fr] gap-x-8 gap-y-2 items-start">
                <span className="text-4xl font-black text-muted-foreground/10 leading-none">{step.n}</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full self-start w-fit ${
                  step.who === 'École'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  {step.who}
                </span>
                <p className="text-lg font-bold leading-snug">{step.title}</p>
                <p className="text-muted-foreground leading-relaxed text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="tarifs" className="bg-zinc-950 text-white border-t-4 border-foreground">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-4">Tarifs</p>
          <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Un tarif simple, par promotion.</h2>
          <p className="text-zinc-400 mb-16 text-sm max-w-lg">
            Un abonnement annuel par promotion. Les étudiants utilisent Postulo gratuitement — c'est l'école qui s'abonne.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-6">Starter</div>
              <div className="text-4xl font-black text-white mb-1">Sur devis</div>
              <p className="text-sm text-zinc-500 mb-8">1 promotion · jusqu'à 50 étudiants</p>
              <ul className="space-y-3 mb-10">
                {[
                  'Tableau de bord pédagogique',
                  'Suivi des candidatures',
                  'Taux de placement en temps réel',
                  'Alertes étudiants inactifs',
                  'Support par email',
                ].map((f) => (
                  <li key={f} className="text-sm text-zinc-400 flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:contact@postulo.fr"
                className="block text-center text-sm font-bold border border-zinc-700 text-white rounded-xl py-3 hover:bg-zinc-800 transition-colors"
              >
                Nous contacter
              </a>
            </div>

            <div className="bg-zinc-900 border-2 border-primary rounded-2xl p-8 relative">
              <div className="absolute -top-3.5 left-6 bg-primary text-white text-xs font-black px-3 py-1 rounded-full tracking-wide">
                Le plus demandé
              </div>
              <div className="text-xs font-black uppercase tracking-widest text-primary mb-6">Pro</div>
              <div className="text-4xl font-black text-white mb-1">Sur devis</div>
              <p className="text-sm text-zinc-500 mb-8">Promotions illimitées · étudiants illimités</p>
              <ul className="space-y-3 mb-10">
                {[
                  'Tout le plan Starter',
                  'Promotions multiples',
                  'Statistiques avancées par promo',
                  'Export des données',
                  'Onboarding dédié',
                  'Support prioritaire',
                ].map((f) => (
                  <li key={f} className="text-sm text-zinc-400 flex items-center gap-2.5">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="mailto:contact@postulo.fr"
                className="block text-center text-sm font-bold bg-primary text-white rounded-xl py-3 hover:bg-primary/90 transition-colors"
              >
                Demander une démo
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-24">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl text-white leading-[0.9] tracking-tighter mb-6 max-w-3xl">
            Votre prochaine
            <br />
            promotion mérite
            <br />
            <span className="text-primary">mieux qu'Excel.</span>
          </h2>
          <p className="text-zinc-400 mb-10 max-w-md">
            Rejoignez les CFA qui donnent à leurs équipes pédagogiques une vraie visibilité sur la recherche d'alternance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:contact@postulo.fr"
              className="inline-flex items-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-2xl hover:bg-primary/90 transition-colors text-sm"
            >
              Demander une démo gratuite
              <ArrowRight className="w-5 h-5" />
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-sm self-center"
            >
              Déjà client ? Se connecter
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black text-sm text-white">Postulo</span>
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} — Tous droits réservés</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="text-xs text-zinc-600 hover:text-white transition-colors">
              Confidentialité
            </Link>
            <Link href="/terms" className="text-xs text-zinc-600 hover:text-white transition-colors">
              CGU
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
