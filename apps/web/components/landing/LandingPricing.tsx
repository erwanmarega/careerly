'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

const starterFeatures = [
  'Tableau de bord en temps réel',
  'Suivi des candidatures par étudiant',
  'Relances automatiques aux inactifs',
  'Export CSV de la promotion',
  'Accès gratuit pour les étudiants',
]

const proFeatures = [
  'Tout le plan Starter',
  'Promotions illimitées',
  'Multi-formations sur un seul compte',
  'Statistiques de placement avancées',
  "Accompagnement à l'onboarding",
  'Support prioritaire',
]

const ease = [0.16, 1, 0.3, 1] as const

export function LandingPricing() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <motion.div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 flex flex-col"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: 0, ease }}
        >
          <div className="mb-6">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Starter</p>
            <p className="text-3xl font-black text-white mb-1">Sur devis</p>
            <p className="text-sm text-zinc-500">1 promotion · jusqu'à 50 étudiants</p>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {starterFeatures.map((f) => (
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
        </motion.div>

        <motion.div
          className="bg-zinc-900 border-2 border-primary rounded-2xl p-8 flex flex-col relative overflow-hidden"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: 0.12, ease }}
        >
          <div className="absolute top-5 right-5 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            Recommandé
          </div>
          <div className="mb-6">
            <p className="text-xs text-primary uppercase tracking-widest mb-3">Pro</p>
            <p className="text-3xl font-black text-white mb-1">Sur devis</p>
            <p className="text-sm text-zinc-500">Promotions illimitées</p>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {proFeatures.map((f) => (
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
        </motion.div>
      </div>

      <motion.div
        className="flex items-center gap-3 px-5 py-4 rounded-xl bg-zinc-900 border border-zinc-800 max-w-lg"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.25, ease }}
      >
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-primary" />
        </div>
        <p className="text-sm text-zinc-400">
          <span className="text-white font-semibold">Gratuit pour tous les étudiants.</span>{' '}
          Aucune carte bancaire, aucun abonnement.
        </p>
      </motion.div>
    </>
  )
}
