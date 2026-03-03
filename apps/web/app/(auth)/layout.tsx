import Link from 'next/link'
import dynamic from 'next/dynamic'
import { CheckCircle2 } from 'lucide-react'

const ThreeAuthBackground = dynamic(() => import('@/components/ThreeAuthBackground'), {
  ssr: false,
})

const features = [
  'Toutes vos candidatures en un seul endroit',
  'Rappels automatiques pour ne jamais oublier de relancer',
  'Statistiques et taux de réponse en temps réel',
  'Vue Kanban pour visualiser votre pipeline',
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col bg-background min-w-0">
        <header className="px-8 py-6 shrink-0">
          <Link href="/" className="font-bold text-xl tracking-tight">
            Careerly
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-8">{children}</main>
        <footer className="px-8 py-4 shrink-0">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Careerly</p>
        </footer>
      </div>

      <div className="hidden lg:flex w-[460px] xl:w-[520px] shrink-0 bg-zinc-950 relative overflow-hidden flex-col justify-center p-14">
        <ThreeAuthBackground className="absolute inset-0 w-full h-full" />

        <div className="absolute inset-0 bg-gradient-to-br from-zinc-150/80 via-zinc-950/60 to-zinc-950/40 z-[1]" />

        <div className="relative z-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-600 mb-10">
            Careerly
          </p>

          <h2 className="text-4xl xl:text-5xl tracking-tighter text-white leading-[1.05] mb-4">
            Votre recherche
            <br />
            d&apos;emploi,{' '}
            <span className="text-primary">
              enfin
              <br />
              organisée.
            </span>
          </h2>

          <p className="text-sm text-white mb-10 leading-relaxed">
            Arrêtez de perdre le fil dans un tableur.
          </p>

          <div className="space-y-4 mb-12">
            {features.map((f) => (
              <div key={f} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-white leading-snug">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
