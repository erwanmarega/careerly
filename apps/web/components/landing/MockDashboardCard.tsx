'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

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
  {
    name: 'Tom Lefebvre',
    apps: 0,
    status: 'Pas démarré',
    color: 'bg-zinc-700/60 text-zinc-400',
  },
  {
    name: 'Sofia Moreau',
    apps: 15,
    status: 'Alternance trouvée',
    color: 'bg-emerald-500/20 text-emerald-400',
  },
]

export function MockDashboardCard() {
  const [open, setOpen] = useState(true)

  return (
    <div className="bg-zinc-900 rounded-t-2xl border border-zinc-800 border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full border-b border-zinc-800 px-5 py-4 flex items-center justify-between hover:bg-zinc-800/40 transition-colors cursor-pointer"
      >
        <div className="text-left">
          <p className="font-semibold text-sm text-white">BTS SIO — Promo 2024</p>
          <p className="text-xs text-zinc-500">24 étudiants · 8 alternances trouvées</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
            33% placés
          </div>
          <ChevronDown
            className="w-4 h-4 text-zinc-600 transition-transform duration-300"
            style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          />
        </div>
      </button>

      <div
        style={{
          display: 'grid',
          gridTemplateRows: open ? '1fr' : '0fr',
          transition: 'grid-template-rows 0.4s ease',
        }}
      >
        <div style={{ overflow: 'hidden' }}>
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
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${s.color}`}>
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
  )
}
