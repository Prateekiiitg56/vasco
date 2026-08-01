# Vasco Project — Implementation & Progress Summary

> **Project Name:** Vasco (`girl-3d-site`)  
> **Tech Stack:** React 19, Vite, Framer Motion, Spline, Blender (3D Asset Generation)  
> **Date:** August 2026  

---

## 📌 Project Overview
**VASCO** is a high-end, modern 3D interactive landing page for a street-wear sneaker brand ("*Move Different*"). The project combines smooth scroll-driven 3D camera animations, rich typography, dark-mode glassmorphism aesthetics, and responsive layout structures.

---

## 🛠️ Key Accomplishments

### 1. **Project Architecture & Setup**
- **Vite + React 19**: Clean module setup configured for high performance and fast development reload.
- **Dependencies**:
  - `@splinetool/react-spline` & `@splinetool/runtime` for 3D interactive web graphics.
  - `framer-motion` for fluid section entrance/exit animations.
  - `Vite` & standard plugins.

### 2. **UI & Component System**
- **`App.jsx`**: Main orchestrator managing:
  - Scroll position calculation and active section detection.
  - 3D camera keyframe LERP (Linear Interpolation) framework for smooth section-to-section camera transitions.
  - Mobile breakpoint responsiveness.
- **`Section.jsx`**: 100vh full-bleed narrative sections featuring:
  - Scroll-triggered entrance animations powered by `framer-motion` (`useInView`).
  - Staggered typography (Category tag, bold heading, description, call-to-action buttons).
- **`LoadingScreen.jsx`**:
  - Custom brand loading screen featuring percentage counter, animated progress bar, and elegant exit transitions (`AnimatePresence`).
- **`SplineScene.jsx`**:
  - Dedicated 3D Canvas container with fallback states and error handling.
- **`useScrollProgress.js`**:
  - Custom React hook computing normalized scroll progress (`0.0` to `1.0`) and active section index.

### 3. **Design System & Styling (`index.css`)**
- High-contrast, dark luxury palette (`#0a0a0a` background, pure white and subtle gray typography).
- Glassmorphism overlay cards and backdrop filters (`backdrop-filter: blur()`).
- Modern typographic scale with custom scrollbar styling.

### 4. **3D Asset Generation (Blender & Poly Haven)**
- **Low-Poly 3D Wooden Crate (`crate.glb`)**:
  - Procedurally modeled in **Blender** with inner core, corner posts, top/bottom frame rails, and diagonal X-braces.
  - Smart UV unwrapped for seamless texture coverage.
  - Textured with high-quality **Poly Haven PBR Material**: `brown_planks_03` (Diffuse, Normal, Roughness, AO maps).
  - Exported as a self-contained binary GLTF model to [`assets/crate.glb`](file:///d:/Hackathons/Vasco/assets/crate.glb) (~1.31 MB).

---

## 🗺️ Project Structure

```
d:/Hackathons/Vasco/
├── assets/
│   └── crate.glb             # Low-poly wooden crate 3D asset (Poly Haven textured)
├── src/
│   ├── components/
│   │   ├── LoadingScreen.jsx # Brand loading screen with progress animation
│   │   ├── Section.jsx       # Animated narrative sections
│   │   └── SplineScene.jsx   # 3D interactive canvas component
│   ├── hooks/
│   │   └── useScrollProgress.js # Custom scroll tracking hook
│   ├── App.jsx               # Core application logic & 3D state
│   ├── index.css             # Design tokens, typography & dark theme styling
│   └── main.jsx              # React entry point
├── index.html                # HTML entry point
├── package.json              # Project dependencies & scripts
└── PROJECT_SUMMARY.md        # Current project status documentation
```

---

## 📖 Brand Narrative Content
The application features 5 interactive sections:
1. **`01 — Drop`**: *"Move Different."* — Brand introduction.
2. **`02 — Collection`**: *"The New Lineup"* — Showcase of sneaker lines (Vasco Air, Vasco Fury).
3. **`03 — Craft`**: *"Built By Hand"* — Materials, sustainability, hand-stitched detailing.
4. **`04 — Culture`**: *"Worn By The Bold"* — Streetwear community and stories.
5. **`05 — Connect`**: *"Let's Link Up"* — Collabs and contact links.

---

## 🚀 Next Steps & Recommendations
1. **Connect 3D Scene**: Update `SPLINE_SCENE_URL` or load the generated `crate.glb` using Three.js / React Three Fiber.
2. **Tune Camera Keyframes**: Fine-tune `CAMERA_KEYFRAMES` coordinates in `App.jsx` to match exact 3D camera angles per section.
3. **Deploy & Build**: Run `npm run build` to generate production static bundle.
