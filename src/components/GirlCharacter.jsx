import { useRef, useEffect, useMemo, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

/**
 * GirlCharacter — Auto-sized, two-phase character controller.
 *
 * Single Source of Truth:
 *   Computes THREE.Box3 from the model's actual geometry to derive:
 *   - finalScale = targetHeight / unscaledHeight
 *   - finalPosition = [offsetX, groundY - finalScale * bbox.min.y, 0]
 *
 * Phase A (Entrance):
 *   Animates from (finalPosition.z - startingZOffset) & (finalScale * 0.3)
 *   toward finalPosition & finalScale over entranceDuration.
 *
 * Phase B (Scroll Scrub):
 *   Locks at finalPosition & finalScale, scrubbing animation time with scroll.
 */

const MODEL_PATH = '/assets/girl-character.glb'
const ANIM_DAMP_FACTOR = 4

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

export default function GirlCharacter({
  rotation = [0, -0.15, 0],
  scrollProgress = 0,
  clipName,
  castShadow = true,
  ...props
}) {
  const groupRef = useRef()

  // ── Leva Live Debug Panel Controls ──────────────────────────────
  const {
    targetHeight,
    entranceDuration,
    startingZOffset,
    offsetX,
    groundY,
    entranceDelay,
  } = useControls('Girl Character', {
    targetHeight: { value: 4.5, min: 1.0, max: 10.0, step: 0.1, label: 'Target Height' },
    entranceDuration: { value: 1.8, min: 0.5, max: 5.0, step: 0.1, label: 'Entrance Duration (s)' },
    startingZOffset: { value: 15.0, min: 5.0, max: 35.0, step: 1.0, label: 'Start Z Offset' },
    offsetX: { value: 1.0, min: -5.0, max: 5.0, step: 0.1, label: 'Offset X (Text Margin)' },
    groundY: { value: -2.25, min: -6.0, max: 2.0, step: 0.05, label: 'Ground Level Y' },
    entranceDelay: { value: 0.4, min: 0.0, max: 2.0, step: 0.1, label: 'Entrance Delay (s)' },
  })

  // ── Phase gate ────────────────────────────────────────────────
  const [hasEntered, setHasEntered] = useState(false)
  const entranceElapsed = useRef(0)
  const dampedTime = useRef(0)

  // ── Load & Clone GLB ──────────────────────────────────────────
  const { scene, animations } = useGLTF(MODEL_PATH)
  const clonedScene = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { actions, names, mixer } = useAnimations(animations, clonedScene)

  // ── AUTO-COMPUTE RESTING TRANSFORM (Single Source of Truth) ───
  const restingTransform = useMemo(() => {
    // Compute bounding box from raw geometry
    const bbox = new THREE.Box3().setFromObject(clonedScene)
    const size = new THREE.Vector3()
    bbox.getSize(size)

    const unscaledHeight = size.y || 1.0
    const minY = bbox.min.y

    // Scale factor to make character exactly `targetHeight` units tall
    const finalScale = targetHeight / unscaledHeight

    // Position Y so feet (minY * finalScale) sit right at groundY
    const targetY = groundY - (minY * finalScale)
    const finalPosition = [offsetX, targetY, 0]

    return { finalScale, finalPosition }
  }, [clonedScene, targetHeight, groundY, offsetX])

  const { finalScale, finalPosition } = restingTransform

  // ── Material Upgrade Pass ─────────────────────────────────────
  useMemo(() => {
    clonedScene.traverse((child) => {
      if (!child.isMesh) return
      if (castShadow) {
        child.castShadow = true
        child.receiveShadow = true
      }
      child.frustumCulled = true

      const mat = child.material
      if (!mat) return

      if (mat.isMeshBasicMaterial || mat.isMeshLambertMaterial) {
        const upgraded = new THREE.MeshStandardMaterial()
        if (mat.map) upgraded.map = mat.map
        if (mat.normalMap) upgraded.normalMap = mat.normalMap
        if (mat.aoMap) upgraded.aoMap = mat.aoMap
        if (mat.emissiveMap) upgraded.emissiveMap = mat.emissiveMap
        if (mat.alphaMap) upgraded.alphaMap = mat.alphaMap
        upgraded.color.copy(mat.color)
        upgraded.transparent = mat.transparent
        upgraded.opacity = mat.opacity
        upgraded.side = mat.side
        upgraded.roughness = 0.7
        upgraded.metalness = 0.0
        upgraded.envMapIntensity = 1.0
        child.material = upgraded
      } else if (mat.isMeshStandardMaterial || mat.isMeshPhysicalMaterial) {
        mat.envMapIntensity = mat.envMapIntensity || 1.0
        mat.needsUpdate = true
      }
    })
  }, [clonedScene, castShadow])

  // ── Mount Animation Clip: play + pause at frame 0 ─────────────
  useEffect(() => {
    if (!names || names.length === 0) return

    const targetName = clipName || names[0]
    const action = actions[targetName]
    if (!action) return

    action.reset()
    action.clampWhenFinished = true
    action.setLoop(THREE.LoopOnce, 1)
    action.play()
    action.paused = true
    action.time = 0
    dampedTime.current = 0

    return () => { action.stop() }
  }, [actions, names, clipName])

  // ── Set initial entrance transform on mount ───────────────────
  useEffect(() => {
    if (!groupRef.current) return
    const startZ = finalPosition[2] - startingZOffset
    const startScale = finalScale * 0.3
    groupRef.current.position.set(finalPosition[0], finalPosition[1], startZ)
    groupRef.current.scale.set(startScale, startScale, startScale)
  }, [finalPosition, finalScale, startingZOffset])

  // ── Per-Frame Execution (Phase A or Phase B) ──────────────────
  useFrame((_, delta) => {
    if (!groupRef.current) return

    /* ============================================================
       PHASE A — ENTRANCE (time-driven, animates to computed target)
       ============================================================ */
    if (!hasEntered) {
      entranceElapsed.current += delta

      if (entranceElapsed.current < entranceDelay) return

      const t = Math.min(
        (entranceElapsed.current - entranceDelay) / entranceDuration,
        1
      )
      const eased = easeOutCubic(t)

      const startZ = finalPosition[2] - startingZOffset
      const startScale = finalScale * 0.3

      const currentZ = THREE.MathUtils.lerp(startZ, finalPosition[2], eased)
      const currentScale = THREE.MathUtils.lerp(startScale, finalScale, eased)

      groupRef.current.position.set(finalPosition[0], finalPosition[1], currentZ)
      groupRef.current.scale.set(currentScale, currentScale, currentScale)

      if (t >= 1) {
        groupRef.current.position.set(
          finalPosition[0],
          finalPosition[1],
          finalPosition[2]
        )
        groupRef.current.scale.set(finalScale, finalScale, finalScale)
        setHasEntered(true)
      }
      return
    }

    /* ============================================================
       PHASE B — SCROLL SCRUB (position & scale locked to resting)
       ============================================================ */
    // Keep position & scale firmly locked to the single source of truth
    groupRef.current.position.set(
      finalPosition[0],
      finalPosition[1],
      finalPosition[2]
    )
    groupRef.current.scale.set(finalScale, finalScale, finalScale)

    if (!names || names.length === 0) return

    const targetName = clipName || names[0]
    const action = actions[targetName]
    if (!action) return

    const clip = action.getClip()
    const duration = clip.duration

    const targetTime = Math.max(0, Math.min(1, scrollProgress)) * duration
    dampedTime.current = THREE.MathUtils.damp(
      dampedTime.current,
      targetTime,
      ANIM_DAMP_FACTOR,
      delta
    )

    action.time = dampedTime.current
    mixer.update(0)
  })

  return (
    <group
      ref={groupRef}
      rotation={rotation}
      dispose={null}
      {...props}
    >
      <primitive object={clonedScene} />
    </group>
  )
}

useGLTF.preload(MODEL_PATH)
