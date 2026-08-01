import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * useScrollProgress — tracks scroll position as:
 *   - progress: 0–1 normalized across full scroll height
 *   - activeSection: index (0 to totalSections-1) of current section
 *   - sectionProgress: 0–1 progress *within* the current section
 *
 * Uses requestAnimationFrame for throttled updates.
 */
export default function useScrollProgress(totalSections = 5) {
  const [scrollData, setScrollData] = useState({
    progress: 0,
    activeSection: 0,
    sectionProgress: 0,
  })

  const rafRef = useRef(null)
  const ticking = useRef(false)

  const update = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const docHeight = document.documentElement.scrollHeight - window.innerHeight
    const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0

    // Each section occupies 1/totalSections of the scroll range
    const sectionSize = 1 / totalSections
    const activeSection = Math.min(
      Math.floor(progress / sectionSize),
      totalSections - 1
    )
    const sectionProgress = (progress - activeSection * sectionSize) / sectionSize

    setScrollData({ progress, activeSection, sectionProgress })
    ticking.current = false
  }, [totalSections])

  const onScroll = useCallback(() => {
    if (!ticking.current) {
      ticking.current = true
      rafRef.current = requestAnimationFrame(update)
    }
  }, [update])

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true })
    // Initial measurement
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [onScroll, update])

  return scrollData
}
