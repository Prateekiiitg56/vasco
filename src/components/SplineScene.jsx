import { useRef, forwardRef, useImperativeHandle, useState } from 'react'
import Spline from '@splinetool/react-spline'

/**
 * SplineScene — loads the Spline 3D scene and exposes the `spline` app instance
 * to the parent via a forwarded ref.
 *
 * Parent usage:
 *   const splineRef = useRef()
 *   <SplineScene ref={splineRef} onLoaded={() => ...} />
 *   // then: splineRef.current.findObjectByName('Camera')
 *
 * Props:
 *   sceneUrl  — the .splinecode URL
 *   onLoaded  — callback fired when scene is fully loaded
 */
const SplineScene = forwardRef(function SplineScene({ sceneUrl, onLoaded }, ref) {
  const splineApp = useRef(null)

  // Expose the spline runtime to the parent
  useImperativeHandle(ref, () => ({
    get app() {
      return splineApp.current
    },
    findObjectByName(name) {
      return splineApp.current?.findObjectByName(name) ?? null
    },
    emitEvent(eventName, objectName) {
      return splineApp.current?.emitEvent(eventName, objectName)
    },
  }))

  function handleLoad(spline) {
    splineApp.current = spline
    onLoaded?.()
  }

  return (
    <div className="spline-canvas-wrapper">
      <Spline
        scene={sceneUrl}
        onLoad={handleLoad}
      />
    </div>
  )
})

export default SplineScene
