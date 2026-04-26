import Script from 'next/script'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <div className="hidden lg:flex flex-1 relative overflow-hidden flex-col items-center justify-center">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <Link href="/" className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-600 mb-16 hover:text-zinc-400 transition-colors">
            Postulo
          </Link>

          <img
            src="/mascot/badge.png"
            alt="Mascotte Postulo"
            className="w-[420px] xl:w-[480px] drop-shadow-2xl mb-6"
          />

          <h2 className="text-3xl xl:text-4xl tracking-tighter text-white leading-tight mb-3">
            Votre recherche d&apos;emploi,{' '}
            <span className="text-primary">enfin organisée.</span>
          </h2>
          <p className="text-sm text-zinc-500 max-w-xs leading-relaxed">
            Toutes vos candidatures au même endroit, sans jamais perdre le fil.
          </p>
        </div>
      </div>

      <div className="w-full lg:w-[480px] xl:w-[520px] shrink-0 flex flex-col bg-zinc-900 border-l border-zinc-800">
        <header className="px-10 py-7 shrink-0 lg:hidden">
          <Link href="/" className="font-bold text-xl tracking-tight text-white">
            Postulo
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-10 py-8">
          {children}
        </main>

        <footer className="px-10 py-5 shrink-0">
          <p className="text-xs text-zinc-600">© {new Date().getFullYear()} Postulo</p>
        </footer>
      </div>
    </div>
  )
}
