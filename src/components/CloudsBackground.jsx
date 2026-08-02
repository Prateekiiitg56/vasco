import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import CLOUDS from 'vanta/dist/vanta.clouds.min'

/**
 * CloudsBackground — Ambient dark Vanta.js CLOUDS background.
 * Mounts into a fixed viewport container behind all content.
 * Skipped on mobile (<768px) for performance.
 */
export default function CloudsBackground({ isMobile = false }) {
  const vantaRef = useRef(null)
  const vantaEffectRef = useRef(null)

  useEffect(() => {
    if (isMobile || !vantaRef.current) return

    let effect = null
    try {
      effect = CLOUDS({
        THREE,
        el: vantaRef.current,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.0,
        minWidth: 200.0,
        backgroundAlpha: 1,
        backgroundColor: 0x0a0a0a,   // matches site dark base
        skyColor: 0x0d1b2a,          // deep navy
        cloudColor: 0x1c2b3a,        // dark slate clouds
        cloudShadowColor: 0x000000,
        sunColor: 0x3a3a3a,          // dim, no strong warm sun
        sunGlareColor: 0x2a2a2a,
        sunlightColor: 0x2a2a2a,
        speed: 0.9,
        scale: 3,
        scaleMobile: 1,
      })
      vantaEffectRef.current = effect
    } catch (err) {
      console.warn('[CloudsBackground] Vanta initialization notice:', err)
    }

    return () => {
      if (vantaEffectRef.current) {
        vantaEffectRef.current.destroy()
        vantaEffectRef.current = null
      }
    }
  }, [isMobile])

  if (isMobile) return null

  return <div ref={vantaRef} className="vanta-clouds-wrapper" />
}
