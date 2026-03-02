'use client'

import { useEffect, useRef } from 'react'

interface Particle {
  startX: number
  startY: number
  baseX: number
  baseY: number
  x: number
  y: number
  size: number
  alpha: number
  phase: number
  freq: number
  ampX: number
  ampY: number
  border: boolean
  delay: number
}

function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
  }
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)]
}

function buildParticles(w: number, h: number, radius: number, n: number): Particle[] {
  const particles: Particle[] = []
  const r = Math.min(radius, w / 2, h / 2)
  const borderN = Math.round(n * 0.70)

  const segs = [
    { len: w - 2 * r, key: 'top' },
    { len: (Math.PI / 2) * r, key: 'tr' },
    { len: h - 2 * r, key: 'right' },
    { len: (Math.PI / 2) * r, key: 'br' },
    { len: w - 2 * r, key: 'bottom' },
    { len: (Math.PI / 2) * r, key: 'bl' },
    { len: h - 2 * r, key: 'left' },
    { len: (Math.PI / 2) * r, key: 'tl' },
  ]
  const total = segs.reduce((s, seg) => s + seg.len, 0)

  for (let i = 0; i < borderN; i++) {
    const pos = (i / borderN) * total
    let key = 'top', t = 0, cum = 0

    for (const seg of segs) {
      if (pos <= cum + seg.len) {
        key = seg.key
        t = seg.len > 0 ? (pos - cum) / seg.len : 0
        break
      }
      cum += seg.len
    }

    let bx = 0, by = 0
    if (key === 'top')    { bx = r + t * (w - 2 * r);                                            by = 0 }
    if (key === 'tr')     { bx = w - r + Math.cos(-Math.PI / 2 + t * Math.PI / 2) * r;          by = r + Math.sin(-Math.PI / 2 + t * Math.PI / 2) * r }
    if (key === 'right')  { bx = w;                                                              by = r + t * (h - 2 * r) }
    if (key === 'br')     { bx = w - r + Math.cos(t * Math.PI / 2) * r;                         by = h - r + Math.sin(t * Math.PI / 2) * r }
    if (key === 'bottom') { bx = w - r - t * (w - 2 * r);                                       by = h }
    if (key === 'bl')     { bx = r + Math.cos(Math.PI / 2 + t * Math.PI / 2) * r;              by = h - r + Math.sin(Math.PI / 2 + t * Math.PI / 2) * r }
    if (key === 'left')   { bx = 0;                                                              by = h - r - t * (h - 2 * r) }
    if (key === 'tl')     { bx = r + Math.cos(Math.PI + t * Math.PI / 2) * r;                   by = r + Math.sin(Math.PI + t * Math.PI / 2) * r }

    bx += (Math.random() - 0.5) * 2
    by += (Math.random() - 0.5) * 2

    const sx = Math.random() * w
    const sy = Math.random() * h

    particles.push({
      startX: sx, startY: sy,
      baseX: bx, baseY: by,
      x: sx, y: sy,
      size: Math.random() * 1.6 + 0.7,
      alpha: Math.random() * 0.45 + 0.5,
      phase: Math.random() * Math.PI * 2,
      freq: Math.random() * 0.014 + 0.007,
      ampX: Math.random() * 2.5 + 1,
      ampY: Math.random() * 1.5 + 0.6,
      border: true,
      delay: Math.floor(Math.random() * 30),
    })
  }

  for (let i = 0; i < n - borderN; i++) {
    const bx = r + Math.random() * (w - 2 * r)
    const by = r + Math.random() * (h - 2 * r)
    const sx = Math.random() * w
    const sy = Math.random() * h

    particles.push({
      startX: sx, startY: sy,
      baseX: bx, baseY: by,
      x: sx, y: sy,
      size: Math.random() * 0.9 + 0.3,
      alpha: Math.random() * 0.14 + 0.04,
      phase: Math.random() * Math.PI * 2,
      freq: Math.random() * 0.009 + 0.004,
      ampX: Math.random() * 3 + 1.5,
      ampY: Math.random() * 2 + 1,
      border: false,
      delay: 15 + Math.floor(Math.random() * 30),
    })
  }

  return particles
}

const FORMATION_FRAMES = 90

export default function ParticleRect({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLSpanElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D
    if (!ctx) return

    const { width: w, height: h } = wrap.getBoundingClientRect()
    if (w === 0 || h === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    ctx.scale(dpr, dpr)

    const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
    const [hh = 262, ss = 83, ll = 58] = raw.split(/[\s,]+/).map(parseFloat)
    const [cr, cg, cb] = hslToRgb(hh, ss, ll)
    const rgb = `${cr}, ${cg}, ${cb}`

    const particles = buildParticles(w, h, 8, 190)
    let tick = 0

    function draw() {
      ctx.clearRect(0, 0, w, h)
      tick++

      ctx.shadowColor = `rgba(${rgb}, 0.3)`
      ctx.shadowBlur = 6

      for (const p of particles) {
        if (!p.border) continue

        const elapsed = Math.max(0, tick - p.delay)
        const progress = Math.min(1, elapsed / FORMATION_FRAMES)
        const eased = easeOutExpo(progress)

        if (progress < 1) {
          p.x = p.startX + (p.baseX - p.startX) * eased
          p.y = p.startY + (p.baseY - p.startY) * eased
        } else {
          p.x = p.baseX + Math.sin(tick * p.freq + p.phase) * p.ampX
          p.y = p.baseY + Math.cos(tick * p.freq * 0.65 + p.phase * 1.4) * p.ampY
        }

        const fade = elapsed < 15 ? elapsed / 15 : 1
        const pulse = progress >= 1 ? 0.58 + 0.42 * Math.sin(tick * p.freq * 0.45 + p.phase) : 1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb}, ${p.alpha * pulse * fade})`
        ctx.fill()
      }

      ctx.shadowBlur = 0

      for (const p of particles) {
        if (p.border) continue

        const elapsed = Math.max(0, tick - p.delay)
        const progress = Math.min(1, elapsed / FORMATION_FRAMES)
        const eased = easeOutExpo(progress)

        if (progress < 1) {
          p.x = p.startX + (p.baseX - p.startX) * eased
          p.y = p.startY + (p.baseY - p.startY) * eased
        } else {
          p.x = p.baseX + Math.sin(tick * p.freq + p.phase) * p.ampX
          p.y = p.baseY + Math.cos(tick * p.freq * 0.55 + p.phase * 1.2) * p.ampY
        }

        const fade = elapsed < 15 ? elapsed / 15 : 1
        const pulse = progress >= 1 ? 0.5 + 0.5 * Math.sin(tick * p.freq * 0.35 + p.phase) : 1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb}, ${p.alpha * pulse * fade})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  return (
    <span ref={wrapRef} className="relative inline-block px-3 py-1 mt-2">
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{ width: '100%', height: '100%' }}
      />
      <span className="relative z-10 font-serif italic font-normal text-primary">
        {children}
      </span>
    </span>
  )
}
