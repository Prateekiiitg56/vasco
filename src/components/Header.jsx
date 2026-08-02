import { useState } from 'react'
import { motion } from 'framer-motion'

export default function Header() {
  const [selectedSize, setSelectedSize] = useState('US 10')
  const [isSizeMenuOpen, setIsSizeMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)

  const sizes = ['US 8', 'US 9', 'US 10', 'US 11', 'US 12']

  const handleAddToCart = () => {
    setCartCount(prev => prev + 1)
  }

  return (
    <header className="brand-header">
      <div className="header-left">
        <a href="#" className="header-logo">
          <span className="logo-main">VASCO</span>
          <span className="logo-sub">// 2026</span>
        </a>
        <div className="drop-status">
          <span className="status-dot pulse" />
          <span className="status-text">DROP 01 LIVE</span>
        </div>
      </div>

      <div className="header-center desktop-only">
        <span className="tech-ticker">
          SUEDE UPPER • INJECTED EVA MIDSOLE • HIGH-GRIP TREAD
        </span>
      </div>

      <div className="header-right">
        {/* Size Selector */}
        <div className="size-selector-wrap">
          <button
            className="header-pill-btn"
            onClick={() => setIsSizeMenuOpen(!isSizeMenuOpen)}
            aria-label="Select Size"
          >
            <span className="pill-label">SIZE:</span>
            <span className="pill-val">{selectedSize}</span>
            <svg className={`chevron ${isSizeMenuOpen ? 'open' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {isSizeMenuOpen && (
            <motion.div
              className="size-dropdown glass-card"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="dropdown-title">SELECT SIZE</div>
              <div className="size-options">
                {sizes.map((sz) => (
                  <button
                    key={sz}
                    className={`size-opt ${selectedSize === sz ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSize(sz)
                      setIsSizeMenuOpen(false)
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Add / Bag Button */}
        <button className="header-cta-btn" onClick={handleAddToCart}>
          <span className="cta-txt">BAG</span>
          <span className="cart-count">{cartCount}</span>
        </button>
      </div>
    </header>
  )
}
