import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LoadingScreen from './components/LoadingScreen.jsx'
import SneakerScrollSequence from './components/SneakerScrollSequence.jsx'
import Header from './components/Header.jsx'
import Section from './components/Section.jsx'
import useScrollProgress from './hooks/useScrollProgress.js'

/* ================================================================
   CONFIGURATION
   ================================================================ */

// 📝 Section content — VASCO sneaker brand
const SECTIONS = [
  {
    label: '01 - Drop',
    heading: 'Move\nDifferent.',
    description: "VASCO isn't just a sneaker - it's a statement. Born from the streets, crafted for the culture. Every step you take tells your story.",
    ctaText: 'Shop the Drop',
    ctaHref: '#section-1',
  },
  {
    label: '02 - Collection',
    heading: 'The New\nLineup',
    description: "From the minimalist Vasco Air to the bold Vasco Fury, our 2026 collection blends cutting-edge materials with timeless silhouettes. Lightweight, breathable, and built to turn heads.",
    ctaText: 'View Collection',
    ctaHref: '#section-2',
  },
  {
    label: '03 - Craft',
    heading: 'Built By\nHand',
    description: "Every pair is assembled with precision - hand-stitched uppers, injected EVA midsoles, and sustainably sourced materials. We obsess over every detail so your feet never have to compromise.",
  },
  {
    label: '04 - Culture',
    heading: 'Worn By\nThe Bold',
    description: "From Tokyo street style to New York studio sessions - VASCO lives where creativity happens. Join a community of artists, athletes, and originals who refuse to blend in.",
    ctaText: 'Our Stories',
    ctaHref: '#',
  },
  {
    label: '05 — Connect',
    heading: "Let's\nLink Up",
    description: "Collabs, custom orders, or just want to say what's up? We're always down to connect with people who share our energy.",
    ctaText: 'Get in Touch',
    ctaHref: 'mailto:hello@vasco.shoes',
  },
]

const TOTAL_SECTIONS = SECTIONS.length

/* ================================================================
   APP COMPONENT
   ================================================================ */
export default function App() {
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)

  const { progress, activeSection } = useScrollProgress(TOTAL_SECTIONS)

  // --- Mobile breakpoint ---
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // --- Loading: driven by real frame-preload progress ---
  const handleLoadProgress = useCallback((pct) => {
    setLoadProgress(pct)
  }, [])

  const handleLoaded = useCallback(() => {
    setLoadProgress(100)
    setTimeout(() => setIsLoading(false), 400)
  }, [])

  // --- Scroll to section ---
  const scrollToSection = (index) => {
    const sectionEl = document.getElementById(`section-${index}`)
    if (sectionEl) {
      sectionEl.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Loading Screen */}
      <LoadingScreen progress={loadProgress} isVisible={isLoading} />

      {/* Brand Header */}
      {!isLoading && <Header />}

      {/* Sneaker Image Sequence — the only light source */}
      <SneakerScrollSequence
        onLoadProgress={handleLoadProgress}
        onLoaded={handleLoaded}
      />

      {/* Navigation Dots */}
      <AnimatePresence>
        {!isLoading && (
          <motion.nav
            className="nav-dots"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Section navigation"
          >
            {SECTIONS.map((section, i) => (
              <button
                key={i}
                className={`nav-dot ${activeSection === i ? 'active' : ''}`}
                onClick={() => scrollToSection(i)}
                aria-label={`Go to ${section.label}`}
              >
                <span className="nav-dot-label">{section.label}</span>
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>



      {/* Scrollable Section Content */}
      <div className="scroll-content">
        {SECTIONS.map((section, i) => (
          <Section
            key={i}
            index={i}
            label={section.label}
            heading={section.heading}
            description={section.description}
            ctaText={section.ctaText}
            ctaHref={section.ctaHref}
            isActive={activeSection === i}
          />
        ))}
      </div>
    </>
  )
}
