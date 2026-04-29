'use client'

import { motion } from 'framer-motion'

export function AnimateIn({
  children,
  className,
  delay = 0,
  from = 'bottom',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  from?: 'bottom' | 'left' | 'right'
}) {
  return (
    <motion.div
      className={className}
      initial={{
        opacity: 0,
        y: from === 'bottom' ? 28 : 0,
        x: from === 'left' ? -28 : from === 'right' ? 28 : 0,
      }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
