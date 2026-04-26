import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <img
          src="/mascot/confused.png"
          alt="Mascotte perdue"
          width={400}
          className="drop-shadow-2xl mb-2"
        />

        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4">Erreur 404</p>
        <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-white mb-4">
          Page introuvable
        </h1>
        <p className="text-zinc-400 text-base max-w-sm leading-relaxed mb-10">
          On ne sait pas trop où elle est passée... notre loutre non plus.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors font-semibold text-sm"
          >
            Retour à l'accueil
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 hover:text-white transition-colors"
          >
            Mon dashboard →
          </Link>
        </div>
      </div>
    </div>
  )
}
