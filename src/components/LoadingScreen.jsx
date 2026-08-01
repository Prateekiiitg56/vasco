import { motion, AnimatePresence } from 'framer-motion'

/**
 * LoadingScreen — full-screen overlay shown while the site loads.
 * Branded for VASCO sneakers.
 */
export default function LoadingScreen({ progress = 0, isVisible = true }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Ambient glow orbs */}
          <div style={{
            position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'
          }}>
            <motion.div
              style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,107,44,0.1) 0%, transparent 70%)',
                top: '15%',
                left: '25%',
                filter: 'blur(80px)',
              }}
              animate={{ x: [0, 40, -20, 0], y: [0, -30, 15, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              style={{
                position: 'absolute',
                width: '350px',
                height: '350px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,179,71,0.08) 0%, transparent 70%)',
                bottom: '20%',
                right: '20%',
                filter: 'blur(60px)',
              }}
              animate={{ x: [0, -30, 20, 0], y: [0, 20, -30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          {/* Brand Logo */}
          <motion.div
            className="loading-logo"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            VASCO
          </motion.div>

          {/* Progress bar */}
          <motion.div
            className="loading-bar-track"
            initial={{ opacity: 0, scaleX: 0.8 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div
              className="loading-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </motion.div>

          {/* Status text */}
          <motion.div
            className="loading-percentage"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {progress < 100 ? 'Lacing up...' : 'Ready to drop'}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
