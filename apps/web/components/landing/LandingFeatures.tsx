'use client'

import { motion } from 'framer-motion'

const features = [
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
]

export function LandingFeatures() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-px border border-border rounded-2xl overflow-hidden bg-border">
      {features.map((item, i) => (
        <motion.div
          key={item.label}
          className="bg-card px-6 py-8"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="font-semibold text-sm mb-2">{item.label}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}
