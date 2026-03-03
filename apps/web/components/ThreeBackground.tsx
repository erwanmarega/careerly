'use client'

import { useEffect, useRef } from 'react'

export default function ThreeBackground({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<() => void>()

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const el: HTMLDivElement = mount

    import('three').then((THREE) => {
      const w = el.clientWidth || innerWidth
      const h = el.clientHeight || innerHeight

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
      camera.position.z = 7

      const N = 90
      const spread = 13
      const pos = new Float32Array(N * 3)
      const vel = new Float32Array(N * 3)

      for (let i = 0; i < N; i++) {
        pos[i * 3 + 0] = (Math.random() - 0.5) * spread
        pos[i * 3 + 1] = (Math.random() - 0.5) * spread
        pos[i * 3 + 2] = (Math.random() - 0.5) * 4
        vel[i * 3 + 0] = (Math.random() - 0.5) * 0.005
        vel[i * 3 + 1] = (Math.random() - 0.5) * 0.005
        vel[i * 3 + 2] = (Math.random() - 0.5) * 0.001
      }

      const pGeo = new THREE.BufferGeometry()
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      const pMat = new THREE.PointsMaterial({
        color: 0x8b5cf6,
        size: 0.07,
        transparent: true,
        opacity: 0.85,
      })
      scene.add(new THREE.Points(pGeo, pMat))

      const maxLines = (N * (N - 1)) / 2
      const lpos = new Float32Array(maxLines * 6)
      const lGeo = new THREE.BufferGeometry()
      lGeo.setAttribute('position', new THREE.BufferAttribute(lpos, 3))
      const lMat = new THREE.LineBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.12,
      })
      scene.add(new THREE.LineSegments(lGeo, lMat))

      const CONN_SQ = 3.8 * 3.8
      let animId: number

      function tick() {
        animId = requestAnimationFrame(tick)

        for (let i = 0; i < N; i++) {
          for (let k = 0; k < 3; k++) {
            pos[i * 3 + k] += vel[i * 3 + k]
            const lim = k < 2 ? spread / 2 : 2
            if (Math.abs(pos[i * 3 + k]) > lim) vel[i * 3 + k] *= -1
          }
        }
        pGeo.attributes.position.needsUpdate = true

        let li = 0
        for (let i = 0; i < N - 1; i++) {
          for (let j = i + 1; j < N; j++) {
            const dx = pos[i * 3] - pos[j * 3]
            const dy = pos[i * 3 + 1] - pos[j * 3 + 1]
            const dz = pos[i * 3 + 2] - pos[j * 3 + 2]
            if (dx * dx + dy * dy + dz * dz < CONN_SQ) {
              lpos[li++] = pos[i * 3]; lpos[li++] = pos[i * 3 + 1]; lpos[li++] = pos[i * 3 + 2]
              lpos[li++] = pos[j * 3]; lpos[li++] = pos[j * 3 + 1]; lpos[li++] = pos[j * 3 + 2]
            }
          }
        }
        lGeo.attributes.position.needsUpdate = true
        lGeo.setDrawRange(0, li / 3)

        renderer.render(scene, camera)
      }

      tick()

      function onResize() {
        const w = el.clientWidth
        const h = el.clientHeight
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        renderer.setSize(w, h)
      }
      window.addEventListener('resize', onResize)

      cleanupRef.current = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        pGeo.dispose()
        lGeo.dispose()
        pMat.dispose()
        lMat.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => cleanupRef.current?.()
  }, [])

  return <div ref={mountRef} className={className} />
}
