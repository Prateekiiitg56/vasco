import { useRef, useEffect, useState, useCallback } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ================================================================
   CONFIGURATION
   ================================================================ */
const TOTAL_FRAMES = 192
const FRAME_PATH = '/assets/sneaker-frames/frame_'

// Dust motes
const DUST_COUNT = 30
const DUST_MIN_R = 0.8
const DUST_MAX_R = 3

function createDustParticles(w, h) {
  return Array.from({ length: DUST_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    radius: DUST_MIN_R + Math.random() * (DUST_MAX_R - DUST_MIN_R),
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.2 - 0.1,
    baseOpacity: 0.15 + Math.random() * 0.35,
    phase: Math.random() * Math.PI * 2,
  }))
}

/* ================================================================
   COMPONENT
   ================================================================ */

/**
 * SneakerScrollSequence — GSAP ScrollTrigger-driven image-sequence
 * animation with integrated glow/vignette lighting system.
 *
 * The sneaker product canvas is the only light source on the page.
 * Frame index, glow opacity/scale, and ambient section glow are all
 * driven from the identical GSAP ScrollTrigger progress value.
 *
 * Props:
 *   onLoadProgress(pct)  — called with 0–100 during frame preloading
 *   onLoaded()           — called once all frames are ready
 */
export default function SneakerScrollSequence({
  onLoadProgress,
  onLoaded,
  scrollDistancePerFrame = 15,
}) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const dustCanvasRef = useRef(null)

  // Mutable refs (no React re-renders on scroll)
  const ctxRef = useRef(null)
  const dustCtxRef = useRef(null)
  const canvasSizeRef = useRef({ w: 0, h: 0 })
  const imagesRef = useRef([])
  const currentFrameRef = useRef(-1)
  const glowProgressRef = useRef(0)
  const dustParticlesRef = useRef(null)
  const rafRef = useRef(null)
  const lastDustTimeRef = useRef(0)
  const scrollTriggerRef = useRef(null)

  const [allLoaded, setAllLoaded] = useState(false)

  /* ----------------------------------------------------------------
     Draw a single frame onto the canvas with object-fit: cover + vignette mask
     ---------------------------------------------------------------- */
  const drawFrame = useCallback((ctx, img, w, h) => {
    if (!ctx || !img || !img.naturalWidth) return
    ctx.clearRect(0, 0, w, h)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    const imgAspect = img.naturalWidth / img.naturalHeight
    const canvasAspect = w / h
    let dw, dh, dx, dy

    if (canvasAspect > imgAspect) {
      // Canvas wider → fill width, crop height
      dw = w
      dh = w / imgAspect
      dx = 0
      dy = (h - dh) / 2
    } else {
      // Canvas taller → fill height, crop width
      dh = h
      dw = h * imgAspect
      dx = (w - dw) / 2
      dy = 0
    }

    ctx.drawImage(img, dx, dy, dw, dh)

    // --- Canvas compositing vignette: punch out flat grey studio background ---
    ctx.save()
    ctx.globalCompositeOperation = 'destination-in'
    const maskRadius = Math.max(w, h) * 0.42
    const radGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, maskRadius)
    radGrad.addColorStop(0, 'rgba(0,0,0,1)')
    radGrad.addColorStop(0.3, 'rgba(0,0,0,0.95)')
    radGrad.addColorStop(0.6, 'rgba(0,0,0,0.35)')
    radGrad.addColorStop(0.85, 'rgba(0,0,0,0)')
    ctx.fillStyle = radGrad
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
  }, [])

  /* ----------------------------------------------------------------
     Size a canvas to its CSS dimensions × device pixel ratio
     ---------------------------------------------------------------- */
  const sizeCanvas = useCallback((canvas) => {
    const dpr = window.devicePixelRatio || 1
    const displayWidth = canvas.clientWidth || window.innerWidth
    const displayHeight = canvas.clientHeight || window.innerHeight

    canvas.width = Math.floor(displayWidth * dpr)
    canvas.height = Math.floor(displayHeight * dpr)
    canvas.style.width = `${displayWidth}px`
    canvas.style.height = `${displayHeight}px`

    const ctx = canvas.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    console.log(`[Canvas Setup] width: ${canvas.width}, height: ${canvas.height}, devicePixelRatio: ${dpr}`)
    return { ctx, w: displayWidth, h: displayHeight }
  }, [])

  /* ----------------------------------------------------------------
     PHASE 1 — Preload all 192 high-res frames
     ---------------------------------------------------------------- */
  useEffect(() => {
    let loaded = 0
    const images = []

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image()
      img.src = `${FRAME_PATH}${String(i).padStart(4, '0')}.jpg`

      const onDone = () => {
        loaded++
        // Throttle React updates — report every 5 frames or at finish
        if (loaded % 5 === 0 || loaded >= TOTAL_FRAMES) {
          const pct = Math.floor((loaded / TOTAL_FRAMES) * 100)
          onLoadProgress?.(pct)
        }
        if (loaded >= TOTAL_FRAMES) {
          setAllLoaded(true)
          onLoaded?.()
        }
      }

      img.onload = onDone
      img.onerror = onDone // count failures so we never hang
      images.push(img)
    }

    imagesRef.current = images
  }, [onLoadProgress, onLoaded])

  /* ----------------------------------------------------------------
     FALLBACK — draw first frame as soon as it loads (before GSAP)
     ---------------------------------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || allLoaded) return

    const firstImg = imagesRef.current[0]
    if (!firstImg) return

    const tryDraw = () => {
      const { ctx, w, h } = sizeCanvas(canvas)
      ctxRef.current = ctx
      canvasSizeRef.current = { w, h }
      drawFrame(ctx, firstImg, w, h)
    }

    if (firstImg.complete && firstImg.naturalWidth) {
      tryDraw()
    } else {
      firstImg.addEventListener('load', tryDraw, { once: true })
    }
  }, [allLoaded, drawFrame, sizeCanvas])

  /* ----------------------------------------------------------------
     PHASE 2 — Direct 1:1 ScrollTrigger binding (after frames load)
     ---------------------------------------------------------------- */
  useEffect(() => {
    if (!allLoaded) return

    const canvas = canvasRef.current
    const dustCanvas = dustCanvasRef.current
    if (!canvas) return

    // --- Size canvases ---
    const { ctx, w, h } = sizeCanvas(canvas)
    ctxRef.current = ctx
    canvasSizeRef.current = { w, h }

    if (dustCanvas) {
      const dust = sizeCanvas(dustCanvas)
      dustCtxRef.current = dust.ctx
      dustParticlesRef.current = createDustParticles(dust.w, dust.h)
    }

    // Draw the current frame (may have scrolled during load)
    const firstImg = imagesRef.current[0]
    if (firstImg?.complete && firstImg.naturalWidth) {
      drawFrame(ctx, firstImg, w, h)
      currentFrameRef.current = 0
    }

    // --- Anchor pingpong sequence across the full page ---
    const totalSteps = (TOTAL_FRAMES - 1) * 2
    const sec0 = document.getElementById('section-0')

    const triggerEl = sec0 || document.body
    const endEl = document.body

    const rangePx = document.documentElement.scrollHeight - (sec0 ? sec0.offsetTop : 0) - window.innerHeight

    console.log(
      `[SneakerScrollSequence] Full page ScrollTrigger bound: ${rangePx}px from #section-0 to bottom of page (${totalSteps} steps)`
    )

    // Pingpong helper: step 0..191 -> frame 0..191; step 192..382 -> frame 190..0
    const getPingpongFrameIndex = (step) => {
      const maxFrame = TOTAL_FRAMES - 1
      const clampedStep = Math.min(totalSteps, Math.max(0, step))
      if (clampedStep <= maxFrame) {
        return clampedStep
      }
      return maxFrame - (clampedStep - maxFrame)
    }

    // --- Direct ScrollTrigger instance spanning full page with scrub: true ---
    scrollTriggerRef.current = ScrollTrigger.create({
      trigger: triggerEl,
      start: 'top top',
      endTrigger: endEl,
      end: 'bottom bottom',
      scrub: true, // Direct 1:1 coupling with 0ms lag
      onUpdate: (self) => {
        const p = self.progress // Read live scroll progress directly
        glowProgressRef.current = p

        // --- Step & frame update across 382 pingpong steps ---
        const step = Math.min(totalSteps, Math.max(0, Math.floor(p * totalSteps)))
        const frameIndex = getPingpongFrameIndex(step)

        if (frameIndex !== currentFrameRef.current) {
          const img = imagesRef.current[frameIndex]
          if (img?.complete && img.naturalWidth) {
            const { w: cw, h: ch } = canvasSizeRef.current
            drawFrame(ctxRef.current, img, cw, ch)
            currentFrameRef.current = frameIndex
          }
        }

        // --- Glow factor: triangular sin curve (peaks at midpoint p=0.5 / step 191) ---
        const glowFactor = Math.pow(Math.sin(p * Math.PI), 1.5)

        // Update glow layer via CSS custom props on wrapper
        if (containerRef.current) {
          const el = containerRef.current
          el.style.setProperty('--glow-opacity', (0.1 + glowFactor * 0.75).toFixed(3))
          el.style.setProperty('--glow-scale', (0.6 + glowFactor * 0.8).toFixed(3))
        }

        // Set root-level var for section ambient light-catch
        document.documentElement.style.setProperty(
          '--glow-intensity',
          glowFactor.toFixed(3)
        )
      },
    })

    ScrollTrigger.refresh()

    // --- Dust motes animation loop (~30fps) ---
    const animateDust = (timestamp) => {
      if (timestamp - lastDustTimeRef.current > 33) {
        lastDustTimeRef.current = timestamp
        const dCtx = dustCtxRef.current
        const particles = dustParticlesRef.current

        if (dCtx && particles && dustCanvas) {
          const dw = dustCanvas.clientWidth
          const dh = dustCanvas.clientHeight
          dCtx.clearRect(0, 0, dw, dh)

          const glowFactor = Math.pow(
            Math.sin(glowProgressRef.current * Math.PI),
            1.5
          )
          const dustAlpha = glowFactor * 0.4

          if (dustAlpha > 0.01) {
            for (let i = 0; i < particles.length; i++) {
              const pt = particles[i]

              // Drift
              pt.x += pt.vx
              pt.y += pt.vy

              // Wrap edges
              if (pt.x < -10) pt.x = dw + 10
              if (pt.x > dw + 10) pt.x = -10
              if (pt.y < -10) pt.y = dh + 10
              if (pt.y > dh + 10) pt.y = -10

              // Twinkle
              const twinkle = 0.5 + 0.5 * Math.sin(timestamp * 0.001 + pt.phase)
              const alpha = pt.baseOpacity * dustAlpha * twinkle

              if (alpha > 0.005) {
                dCtx.beginPath()
                dCtx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2)
                dCtx.fillStyle = `rgba(220,218,215,${alpha.toFixed(3)})`
                dCtx.fill()
              }
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(animateDust)
    }
    rafRef.current = requestAnimationFrame(animateDust)

    // --- Resize handler ---
    const handleResize = () => {
      const { ctx: newCtx, w: nw, h: nh } = sizeCanvas(canvas)
      ctxRef.current = newCtx
      canvasSizeRef.current = { w: nw, h: nh }

      if (dustCanvas) {
        const dust = sizeCanvas(dustCanvas)
        dustCtxRef.current = dust.ctx
        dustParticlesRef.current = createDustParticles(dust.w, dust.h)
      }

      currentFrameRef.current = -1 // force redraw on next update
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', handleResize)

    // --- Cleanup ---
    return () => {
      scrollTriggerRef.current?.kill()
      scrollTriggerRef.current = null
      window.removeEventListener('resize', handleResize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      // Reset root glow var
      document.documentElement.style.removeProperty('--glow-intensity')
    }
  }, [allLoaded, drawFrame, sizeCanvas])

  /* ----------------------------------------------------------------
     RENDER
     ---------------------------------------------------------------- */
  return (
    <div className="sneaker-sequence-wrapper" ref={containerRef}>
      {/* Glow / Bloom — behind the product canvas */}
      <div className="sneaker-glow" />

      {/* Sneaker frame canvas — vignette mask applied via CSS */}
      <canvas ref={canvasRef} className="sneaker-canvas" />

      {/* Atmospheric dust motes */}
      <canvas ref={dustCanvasRef} className="dust-canvas" />
    </div>
  )
}
