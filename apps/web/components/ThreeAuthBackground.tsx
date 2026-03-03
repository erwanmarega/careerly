'use client'

import { useEffect, useRef } from 'react'

export default function ThreeAuthBackground({ className }: { className?: string }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<() => void>()

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    import('three').then((THREE) => {
      const w = mount.clientWidth || 500
      const h = mount.clientHeight || 700

      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setSize(w, h)
      renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
      mount.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100)
      camera.position.z = 5.5

      const geoInner = new THREE.IcosahedronGeometry(1.4, 1)
      const matInner = new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        wireframe: true,
        transparent: true,
        opacity: 0.55,
      })
      const meshInner = new THREE.Mesh(geoInner, matInner)
      scene.add(meshInner)

      const geoOuter = new THREE.IcosahedronGeometry(2.5, 1)
      const matOuter = new THREE.MeshBasicMaterial({
        color: 0x7c3aed,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      })
      const meshOuter = new THREE.Mesh(geoOuter, matOuter)
      scene.add(meshOuter)

      const geoRing1 = new THREE.TorusGeometry(2.0, 0.009, 4, 160)
      const matRing1 = new THREE.MeshBasicMaterial({
        color: 0x8b5cf6,
        transparent: true,
        opacity: 0.55,
      })
      const ring1 = new THREE.Mesh(geoRing1, matRing1)
      ring1.rotation.x = Math.PI / 2.5
      scene.add(ring1)

      const geoRing2 = new THREE.TorusGeometry(2.7, 0.006, 4, 160)
      const matRing2 = new THREE.MeshBasicMaterial({
        color: 0x6d28d9,
        transparent: true,
        opacity: 0.38,
      })
      const ring2 = new THREE.Mesh(geoRing2, matRing2)
      ring2.rotation.x = Math.PI / 1.7
      ring2.rotation.z = Math.PI / 4
      scene.add(ring2)

      const N = 280
      const pPos = new Float32Array(N * 3)
      for (let i = 0; i < N; i++) {
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        const r = 3.2 + Math.random() * 2.2
        pPos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta)
        pPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
        pPos[i * 3 + 2] = r * Math.cos(phi)
      }
      const pGeo = new THREE.BufferGeometry()
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3))
      const pMat = new THREE.PointsMaterial({
        color: 0x8b5cf6,
        size: 0.045,
        transparent: true,
        opacity: 0.65,
        sizeAttenuation: true,
      })
      const points = new THREE.Points(pGeo, pMat)
      scene.add(points)

      const mouse = { x: 0, y: 0 }
      const camPos = { x: 0, y: 0 }

      function onMouseMove(e: MouseEvent) {
        const rect = mount.getBoundingClientRect()
        mouse.x = (e.clientX - rect.left) / rect.width - 0.5
        mouse.y = -((e.clientY - rect.top) / rect.height - 0.5)
      }
      mount.addEventListener('mousemove', onMouseMove)

      const colorA = new THREE.Color(0x8b5cf6)
      const colorB = new THREE.Color(0x6366f1)
      const colorMix = new THREE.Color()

      const allMats = [matInner, matOuter, matRing1, matRing2, pMat]

      let animId: number
      let t = 0

      function tick() {
        animId = requestAnimationFrame(tick)
        t += 0.006

        meshInner.rotation.x = t * 0.42
        meshInner.rotation.y = t * 0.65

        meshOuter.rotation.x = -t * 0.15
        meshOuter.rotation.y = -t * 0.22
        meshOuter.rotation.z = t * 0.08

        ring1.rotation.z = t * 0.28
        ring2.rotation.y = t * 0.19
        ring2.rotation.z = -t * 0.12

        const pulse = 1 + Math.sin(t * 1.8) * 0.045
        meshInner.scale.setScalar(pulse)

        points.rotation.y = t * 0.04
        points.rotation.x = t * 0.02

        const f = (Math.sin(t * 0.45) + 1) / 2
        colorMix.lerpColors(colorA, colorB, f)
        allMats.forEach((m) => m.color.copy(colorMix))

        camPos.x += (mouse.x * 0.9 - camPos.x) * 0.04
        camPos.y += (mouse.y * 0.65 - camPos.y) * 0.04
        camera.position.x = camPos.x
        camera.position.y = camPos.y
        camera.lookAt(0, 0, 0)

        renderer.render(scene, camera)
      }

      tick()

      function onResize() {
        const nw = mount.clientWidth
        const nh = mount.clientHeight
        camera.aspect = nw / nh
        camera.updateProjectionMatrix()
        renderer.setSize(nw, nh)
      }
      window.addEventListener('resize', onResize)

      cleanupRef.current = () => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', onResize)
        mount.removeEventListener('mousemove', onMouseMove)
        ;[geoInner, geoOuter, geoRing1, geoRing2, pGeo].forEach((g) => g.dispose())
        allMats.forEach((m) => m.dispose())
        renderer.dispose()
        renderer.domElement.remove()
      }
    })

    return () => cleanupRef.current?.()
  }, [])

  return <div ref={mountRef} className={className} />
}
