import Link from 'next/link'
import { ArrowRight, Check } from 'lucide-react'
import { MockDashboardCard } from '@/components/landing/MockDashboardCard'
import { AnimateIn } from '@/components/landing/AnimateIn'
import { LandingFeatures } from '@/components/landing/LandingFeatures'
import { LandingPricing } from '@/components/landing/LandingPricing'

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
              <MockDashboardCard />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
        <AnimateIn>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed mb-12">
            En fin d'année, la plupart des responsables de formation découvrent trop tard que des
            étudiants n'ont toujours rien. Postulo leur donne cette visibilité en continu, sans
            chasser les étudiants par email.
          </p>
        </AnimateIn>
        <LandingFeatures />
      </section>

      <section className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-20">
          <AnimateIn>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-10">
              Comment ça marche
            </p>
          </AnimateIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
            <AnimateIn from="left">
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
            </AnimateIn>
            <AnimateIn from="right" delay={0.15}>
              <div className="bg-secondary/50 rounded-2xl border border-border p-6 space-y-3">
                {[
                  { label: 'Relances automatiques aux étudiants inactifs' },
                  { label: 'Historique des statuts de chaque candidature' },
                  { label: 'Export CSV de toute la promotion' },
                  { label: 'Données hébergées en Europe' },
                  { label: 'Accès gratuit pour les étudiants' },
                ].map((f) => (
                  <div key={f.label} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <p className="text-sm">{f.label}</p>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      <section id="tarifs" className="bg-zinc-950 text-white border-t border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-24">
          <AnimateIn>
            <div className="max-w-xl mb-16">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Tarifs</p>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Les étudiants utilisent Postulo{' '}
                <span className="text-white font-semibold">gratuitement</span>. Seule l'école souscrit
                un abonnement annuel par promotion suivie.
              </p>
            </div>
          </AnimateIn>
          <LandingPricing />
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
