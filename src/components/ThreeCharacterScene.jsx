import { useRef, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  Vignette,
  N8AO,
} from '@react-three/postprocessing'
import * as THREE from 'three'
import { Leva } from 'leva'
import GirlCharacter from './GirlCharacter.jsx'

/* ================================================================
   TUNING CONSTANTS — adjust these to taste
   ================================================================ */

// Damping factor for THREE.MathUtils.damp per-frame.
// Lower = smoother/slower response, higher = snappier.
// 0.12 gives a silky editorial feel; raise to ~0.2 for snappier.
const CAMERA_DAMP_FACTOR = 0.12

// Extra layer of scroll-value smoothing.
// The raw scroll progress itself is lerped each frame toward
// the latest value so fast/jerky scrolls don't produce stutter.
const SCROLL_DAMP_FACTOR = 0.1

const DEG2RAD = Math.PI / 180

/* ================================================================
   CAMERA KEYFRAMES
   Positions in Three.js units, rotations in degrees.
   ================================================================ */
const CAMERA_KEYFRAMES = [
  { // 01 — Hero: front-facing, full body visible
    position: { x: 0, y: 1.2, z: 7 },
    rotation: { x: -3, y: 0, z: 0 },
  },
  { // 02 — Collection: orbit right, mid body
    position: { x: 4, y: 1.5, z: 5.5 },
    rotation: { x: -5, y: -20, z: 0 },
  },
  { // 03 — Craft: close-up, higher angle
    position: { x: -3, y: 3.0, z: 4 },
    rotation: { x: -15, y: 18, z: 0 },
  },
  { // 04 — Culture: wide orbit left
    position: { x: 5, y: 1.0, z: 6 },
    rotation: { x: -2, y: -28, z: 0 },
  },
  { // 05 — Contact: pull back, centered
    position: { x: 0, y: 2.5, z: 8 },
    rotation: { x: -6, y: 0, z: 0 },
  },
]

/* ================================================================
   UTILITY
   ================================================================ */
function lerpVal(a, b, t) {
  return a + (b - a) * t
}

/* ================================================================
   ScrollCamera — damped camera that follows scroll progress
   ================================================================ */
function ScrollCamera({ progress }) {
  const { camera } = useThree()

  // Smoothed scroll value (eliminates scroll jitter)
  const smoothProgress = useRef(0)

  // Current damped camera pose
  const current = useRef(null)

  // Initialise from keyframe 0
  if (!current.current) {
    const kf = CAMERA_KEYFRAMES[0]
    const init = {
      px: kf.position.x,
      py: kf.position.y,
      pz: kf.position.z,
      rx: kf.rotation.x * DEG2RAD,
      ry: kf.rotation.y * DEG2RAD,
      rz: kf.rotation.z * DEG2RAD,
    }
    current.current = { ...init }
    smoothProgress.current = 0

    camera.position.set(init.px, init.py, init.pz)
    camera.rotation.set(init.rx, init.ry, init.rz, 'XYZ')
  }

  useFrame((_, delta) => {
    // 1. Smooth the raw scroll progress value each frame
    //    This absorbs fast/jerky scroll spikes.
    smoothProgress.current = THREE.MathUtils.damp(
      smoothProgress.current,
      progress,
      SCROLL_DAMP_FACTOR / delta,  // convert to exponential decay rate
      delta
    )
    const sp = smoothProgress.current

    // 2. Compute target camera pose from smoothed progress
    const totalKF = CAMERA_KEYFRAMES.length
    const scaled = sp * (totalKF - 1)
    const fromIdx = Math.min(Math.floor(scaled), totalKF - 2)
    const toIdx = fromIdx + 1
    const t = scaled - fromIdx

    const from = CAMERA_KEYFRAMES[fromIdx]
    const to = CAMERA_KEYFRAMES[toIdx]

    const targetPx = lerpVal(from.position.x, to.position.x, t)
    const targetPy = lerpVal(from.position.y, to.position.y, t)
    const targetPz = lerpVal(from.position.z, to.position.z, t)
    const targetRx = lerpVal(from.rotation.x, to.rotation.x, t) * DEG2RAD
    const targetRy = lerpVal(from.rotation.y, to.rotation.y, t) * DEG2RAD
    const targetRz = lerpVal(from.rotation.z, to.rotation.z, t) * DEG2RAD

    // 3. Damp current camera pose toward the target
    //    THREE.MathUtils.damp is frame-rate independent unlike raw lerp.
    const lambda = CAMERA_DAMP_FACTOR / delta
    const cur = current.current

    cur.px = THREE.MathUtils.damp(cur.px, targetPx, lambda, delta)
    cur.py = THREE.MathUtils.damp(cur.py, targetPy, lambda, delta)
    cur.pz = THREE.MathUtils.damp(cur.pz, targetPz, lambda, delta)
    cur.rx = THREE.MathUtils.damp(cur.rx, targetRx, lambda, delta)
    cur.ry = THREE.MathUtils.damp(cur.ry, targetRy, lambda, delta)
    cur.rz = THREE.MathUtils.damp(cur.rz, targetRz, lambda, delta)

    camera.position.set(cur.px, cur.py, cur.pz)
    camera.rotation.set(cur.rx, cur.ry, cur.rz, 'XYZ')
  })

  return null
}

/* ================================================================
   PostProcessing — Bloom + SSAO + Vignette
   ================================================================ */
function PostEffects() {
  return (
    <EffectComposer multisampling={4}>
      {/* Bloom: subtle glow on bright highlights only */}
      <Bloom
        intensity={0.35}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      {/* SSAO: ambient occlusion in crevices & contact areas */}
      <N8AO
        aoRadius={0.5}
        intensity={1.5}
        distanceFalloff={0.6}
        quality="medium"
      />
      {/* Vignette: subtle darkened edges for editorial feel */}
      <Vignette
        offset={0.3}
        darkness={0.45}
        eskil={false}
      />
    </EffectComposer>
  )
}

/* ================================================================
   ThreeCharacterScene — R3F Canvas with photorealistic rendering
   ================================================================ */
export default function ThreeCharacterScene({
  progress = 0,
  activeSection = 0,
  onLoaded,
}) {
  const hasCalledLoaded = useRef(false)

  const handleCreated = ({ gl }) => {
    // Ensure correct color space & shadow setup on the renderer
    gl.outputColorSpace = THREE.SRGBColorSpace
    gl.shadowMap.enabled = true
    gl.shadowMap.type = THREE.PCFSoftShadowMap

    if (!hasCalledLoaded.current) {
      hasCalledLoaded.current = true
      onLoaded?.()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <div style={{ pointerEvents: 'auto', position: 'relative', zIndex: 99999 }}>
        <Leva />
      </div>
      <Canvas
        shadows
        camera={{ fov: 45, near: 0.1, far: 100 }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.1,
          powerPreference: 'high-performance',
        }}
        onCreated={handleCreated}
        style={{ background: 'transparent' }}
      >
        {/* ── Scroll-driven damped camera ── */}
        <ScrollCamera progress={progress} />

        {/* ── HDRI environment lighting ──
            "city" gives moody, editorial reflections with warm highlights
            and cool shadows — fits a streetwear brand aesthetic.
            Other good options: "night", "warehouse", "studio"         */}
        <Environment
          preset="city"
          background={false}
          environmentIntensity={0.8}
        />

        {/* ── Rim / Key light setup ──
            Key light: strong, warm-white from upper-right-front.
            Fill light: softer, cool-blue from lower-left-back.
            Rim light: behind the character for edge separation.       */}

        {/* Key light */}
        <directionalLight
          position={[4, 6, 3]}
          intensity={2.2}
          color="#fff5e6"
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={20}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.0005}
          shadow-normalBias={0.02}
        />

        {/* Fill light */}
        <directionalLight
          position={[-3, 3, -2]}
          intensity={0.6}
          color="#b0c4de"
        />

        {/* Rim / back light for edge separation */}
        <directionalLight
          position={[-1, 3, -4]}
          intensity={1.4}
          color="#e8d5ff"
        />

        {/* Subtle ambient fill (very low — HDRI does most of the work) */}
        <ambientLight intensity={0.15} color="#f0e6d6" />

        {/* ── Character (Auto-computed resting transform & Phase A/B controller) ── */}
        <GirlCharacter
          rotation={[0, -0.15, 0]}
          scrollProgress={progress}
          castShadow
        />

        {/* ── Contact shadows — sits at ground level Y (-2.25) ── */}
        <ContactShadows
          position={[1.0, -2.25, 0]}
          opacity={0.6}
          scale={14}
          blur={2.8}
          far={6}
          resolution={512}
          color="#1a1a2e"
        />

        {/* ── Post-processing ── */}
        <PostEffects />
      </Canvas>
    </div>
  )
}
