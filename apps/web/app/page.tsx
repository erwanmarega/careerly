import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'

const mockStudents = [
  {
    name: 'Camille Dupont',
    apps: 12,
    status: 'Alternance trouvée',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    name: 'Lucas Martin',
    apps: 8,
    status: 'En recherche',
    color: 'bg-amber-500/20 text-amber-400',
  },
  {
    name: 'Inès Bouchard',
    apps: 5,
    status: 'En recherche',
    color: 'bg-amber-500/20 text-amber-400',
  },
  { name: 'Tom Lefebvre', apps: 0, status: 'Pas démarré', color: 'bg-zinc-700/60 text-zinc-400' },
  {
    name: 'Sofia Moreau',
    apps: 15,
    status: 'Alternance trouvée',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <header className="px-6 sm:px-10 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <span className="font-black text-xl tracking-tight">Postulo</span>
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
          <a
            href="mailto:contact@postulo.fr"
            className="text-sm font-semibold bg-foreground text-background px-4 py-2 rounded-lg hover:bg-foreground/85 transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </header>

      <section className="relative bg-zinc-950 px-6 sm:px-10 pt-20 pb-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-violet-600/20 blur-[140px] pointer-events-none" />
        <div className="absolute top-10 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_440px] gap-12 items-end">
            <div className="pb-20 relative">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl leading-[0.92] tracking-tighter text-white mb-7">
                Qui a trouvé
                <br />
                son alternance ?
              </h1>
              <p className="text-base text-zinc-400 leading-relaxed mb-3 max-w-sm">
                Postulo connecte vos étudiants à votre tableau de bord. Vous voyez leurs
                candidatures au fil de l'eau, sans leur envoyer un seul message.
              </p>
              <p className="text-sm text-zinc-600 mb-10 max-w-sm">
                Pour les CFA et écoles en recherche d'alternance.
              </p>
              <a
                href="mailto:contact@postulo.fr"
                className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3.5 rounded-xl hover:bg-primary/90 transition-colors font-semibold"
              >
                Demander une démo
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="self-end translate-y-px relative">
              <img
                src="/mascot/peeking.png"
                alt="Mascotte Postulo"
                width={250}
                className="hidden lg:block absolute -top-[6.5rem] left-1/2 -translate-x-1/2 drop-shadow-2xl z-10 pointer-events-none"
              />
              <div className="bg-zinc-900 rounded-t-2xl border border-zinc-800 border-b-0 overflow-hidden">
                <div className="border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm text-white">BTS SIO — Promo 2024</p>
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
                        <p className="text-xs text-zinc-600">
                          {s.apps} candidature{s.apps !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}
                      >
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-zinc-800 px-5 py-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-zinc-500">
                    Tom Lefebvre — aucune candidature depuis 3 semaines
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
        <p className="text-sm text-muted-foreground max-w-xl leading-relaxed mb-12">
          En fin d'année, la plupart des responsables de formation découvrent trop tard que des
          étudiants n'ont toujours rien. Postulo leur donne cette visibilité en continu, sans
          chasser les étudiants par email.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px border border-border rounded-2xl overflow-hidden bg-border">
          {[
            {
              label: "Qui n'a pas encore postulé",
              desc: "Identifiez les étudiants inactifs avant qu'il soit trop tard.",
            },
            {
              label: 'Où en est chaque étudiant',
              desc: "Candidatures envoyées, entretiens en cours, offres reçues — tout d'un coup d'œil.",
            },
            {
              label: 'Le taux de placement de votre promo',
              desc: 'Un chiffre concret pour vos bilans, mis à jour en temps réel.',
            },
          ].map((item) => (
            <div key={item.label} className="bg-card px-6 py-8">
              <p className="font-semibold text-sm mb-2">{item.label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-10">
            Comment ça marche
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <div className="space-y-8">
              <div>
                <p className="text-sm font-semibold text-primary mb-1">Pour l'école</p>
                <p className="text-2xl font-bold tracking-tight mb-3">
                  Vous créez votre espace, on vous donne un code.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Partagez ce code à vos étudiants. Ceux qui s'inscrivent sur Postulo rejoignent
                  automatiquement votre tableau de bord.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-zinc-500 mb-1">Pour les étudiants</p>
                <p className="text-2xl font-bold tracking-tight mb-3">
                  Ils suivent leurs candidatures. Vous les voyez.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Chaque candidature ajoutée par un étudiant apparaît dans votre dashboard. Pas de
                  saisie manuelle, pas de formulaires à remplir.
                </p>
              </div>
            </div>
            <div className="bg-secondary/50 rounded-2xl border border-border p-6 space-y-3">
              {[
                { label: 'Relances automatiques aux étudiants inactifs', done: true },
                { label: 'Historique des statuts de chaque candidature', done: true },
                { label: 'Export CSV de toute la promotion', done: true },
                { label: 'Données hébergées en Europe', done: true },
                { label: 'Accès gratuit pour les étudiants', done: true },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <p className="text-sm">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="tarifs" className="bg-zinc-950 text-white border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-24">
          <div className="max-w-xl mb-16">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Tarifs</p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Les étudiants utilisent Postulo{' '}
              <span className="text-white font-semibold">gratuitement</span>. Seule l'école souscrit
              un abonnement annuel par promotion suivie.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col">
              <div className="mb-6">
                <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Starter</p>
                <p className="text-3xl font-black text-white mb-1">Sur devis</p>
                <p className="text-sm text-zinc-500">1 promotion · jusqu'à 50 étudiants</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Tableau de bord en temps réel',
                  'Suivi des candidatures par étudiant',
                  'Relances automatiques aux inactifs',
                  'Export CSV de la promotion',
                  'Accès gratuit pour les étudiants',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" />
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

            <div className="bg-zinc-900 border-2 border-primary rounded-2xl p-8 flex flex-col relative overflow-hidden">
              <div className="absolute top-5 right-5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                Recommandé
              </div>
              <div className="mb-6">
                <p className="text-xs text-primary uppercase tracking-widest mb-3">Pro</p>
                <p className="text-3xl font-black text-white mb-1">Sur devis</p>
                <p className="text-sm text-zinc-500">Promotions illimitées</p>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Tout le plan Starter',
                  'Promotions illimitées',
                  'Multi-formations sur un seul compte',
                  'Statistiques de placement avancées',
                  "Accompagnement à l'onboarding",
                  'Support prioritaire',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-300">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
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

          <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-zinc-900 border border-zinc-800 max-w-lg">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Check className="w-4 h-4 text-primary" />
            </div>
            <p className="text-sm text-zinc-400">
              <span className="text-white font-semibold">Gratuit pour tous les étudiants.</span>{' '}
              Aucune carte bancaire, aucun abonnement.
            </p>
          </div>
        </div>
      </section>

      <footer className="bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-black text-sm text-white">Postulo</span>
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()}</p>
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
