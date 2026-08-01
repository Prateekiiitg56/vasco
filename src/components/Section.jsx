import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

/**
 * Section — a single 100vh overlay section with animated text.
 *
 * Props:
 *   label       — small uppercase label (e.g. "01 — Hero")
 *   heading     — main heading text
 *   description — paragraph text
 *   ctaText     — optional button text
 *   ctaHref     — optional button link
 *   index       — section index (used for stagger timing)
 *   isActive    — whether this section is the currently active one
 */
export default function Section({
  label,
  heading,
  description,
  ctaText,
  ctaHref,
  index = 0,
  isActive = false,
}) {
  const sectionRef = useRef(null)
  const isInView = useInView(sectionRef, {
    amount: 0.3,
    once: false,
  })

  const shouldAnimate = isInView

  // Stagger variants for child elements
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 40,
      filter: 'blur(8px)',
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: {
        duration: 0.7,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  return (
    <section className="section" ref={sectionRef} id={`section-${index}`}>
      <motion.div
        className="section-inner"
        variants={containerVariants}
        initial="hidden"
        animate={shouldAnimate ? 'visible' : 'hidden'}
      >
        {label && (
          <motion.div className="section-label" variants={itemVariants}>
            {label}
          </motion.div>
        )}

        <motion.h2 className="section-heading" variants={itemVariants}>
          {heading}
        </motion.h2>

        {description && (
          <motion.p className="section-description" variants={itemVariants}>
            {description}
          </motion.p>
        )}

        {ctaText && (
          <motion.a
            href={ctaHref || '#'}
            className="section-cta"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
          >
            {ctaText}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </motion.a>
        )}
      </motion.div>
    </section>
  )
}
