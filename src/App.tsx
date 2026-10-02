import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnchorStore } from './Store'
import { THEME_PRESETS } from './Schema'
import { resolveWallpaperUrl, isVideoUrl } from './lib/wallpapers'
import { Sidebar } from './components/Sidebar'
import { BoardsArea } from './components/BoardsArea'

function App() {
  const theme               = useAnchorStore(s => s.theme)
  const wallpaper           = useAnchorStore(s => s.wallpaper)
  const labelColors         = useAnchorStore(s => s.labelColors)
  const glassEnabled        = useAnchorStore(s => s.glassEnabled)
  const panelVisibility     = useAnchorStore(s => s.panelVisibility)
  const panelOpacity        = useAnchorStore(s => s.panelOpacity)
  const availableWallpapers = useAnchorStore(s => s.availableWallpapers)
  const loadWallpapers      = useAnchorStore(s => s.loadWallpapers)

  const [isLoaded, setIsLoaded] = useState(false)
  const [wallpaperLoaded, setWallpaperLoaded] = useState(false)

  /* Automatically load available wallpapers from GitHub on mount */
  useEffect(() => {
    loadWallpapers()
  }, [loadWallpapers])

  /* Smooth entrance animation on initial mount and when returning via back/forward navigation */
  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | null = null

    // Initial entrance trigger
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 40)

    const handlePageShow = () => {
      // Smoothly re-reveal when returning from another site or bfcache
      setIsLoaded(false)
      if (showTimer) clearTimeout(showTimer)
      showTimer = setTimeout(() => {
        setIsLoaded(true)
      }, 50)
    }

    window.addEventListener('pageshow', handlePageShow)
    return () => {
      clearTimeout(timer)
      if (showTimer) clearTimeout(showTimer)
      window.removeEventListener('pageshow', handlePageShow)
    }
  }, [])

  /* Apply CSS custom properties + glass attribute for runtime theming */
  useEffect(() => {
    const root = document.documentElement

    // Glass toggle
    root.setAttribute('data-glass', String(glassEnabled))

    // Panel visibility attribute and dynamic surface opacities
    root.setAttribute('data-panel-visibility', panelVisibility)
    const opacity = panelOpacity ?? (
      panelVisibility === 'visible' ? 0.82 :
      panelVisibility === 'pure-transparent' ? 0.18 :
      0.48
    )
    root.style.setProperty('--panel-opacity', String(opacity))

    if (glassEnabled) {
      root.style.setProperty('--surface-0', `rgba(10, 10, 14, ${(opacity * 0.82).toFixed(3)})`)
      root.style.setProperty('--surface-1', `rgba(14, 14, 18, ${opacity.toFixed(3)})`)
      root.style.setProperty('--surface-2', `rgba(20, 20, 26, ${Math.min(0.95, opacity * 1.25).toFixed(3)})`)
      root.style.setProperty('--surface-3', 'rgba(12, 12, 16, 0.82)')
    } else {
      root.style.setProperty('--surface-0', `rgba(12, 12, 16, ${Math.max(0.2, opacity).toFixed(3)})`)
      root.style.setProperty('--surface-1', `rgba(18, 18, 22, ${Math.max(0.25, opacity).toFixed(3)})`)
      root.style.setProperty('--surface-2', `rgba(24, 24, 30, ${Math.max(0.3, opacity).toFixed(3)})`)
      root.style.setProperty('--surface-3', '#16161c')
    }

    // Gradient theme
    let colors = theme.custom
    if (theme.presetId !== 'custom') {
      const preset = THEME_PRESETS.find(p => p.id === theme.presetId)
      if (preset) colors = { top: preset.top, middle: preset.middle, bottom: preset.bottom }
    }
    root.style.setProperty('--color-top',    colors.top)
    root.style.setProperty('--color-middle', colors.middle)
    root.style.setProperty('--color-bottom', colors.bottom)

    // Accent colors (derivatives auto-computed via color-mix in CSS)
    const activeColor = labelColors.activePage || '#a78bfa'
    const btnColor = labelColors.linkButton || '#7c3aed'
    root.style.setProperty('--accent',     activeColor)
    root.style.setProperty('--accent-btn', btnColor)
  }, [theme, labelColors, glassEnabled, panelVisibility, panelOpacity])

  /* Wallpaper URL (supports images, animated GIFs, and video wallpapers) */
  let wallpaperUrl = ''
  if (wallpaper.presetId === 'custom') {
    wallpaperUrl = wallpaper.customUrl ?? ''
  } else if (wallpaper.presetId !== 'none') {
    wallpaperUrl = resolveWallpaperUrl(wallpaper.presetId, availableWallpapers)
  }

  const isVideo = isVideoUrl(wallpaperUrl)

  /* Preload wallpaper image to avoid visual snapping / popping */
  useEffect(() => {
    if (!wallpaperUrl) {
      setWallpaperLoaded(true)
      return
    }
    if (isVideo) {
      // Video elements handle readiness via onCanPlay / onLoadedData
      setWallpaperLoaded(false)
      return
    }
    setWallpaperLoaded(false)
    let cancelled = false
    const img = new Image()
    img.onload = () => {
      if (!cancelled) setWallpaperLoaded(true)
    }
    img.onerror = () => {
      if (!cancelled) setWallpaperLoaded(true)
    }
    img.src = wallpaperUrl

    return () => {
      cancelled = true
      img.onload = null
      img.onerror = null
    }
  }, [wallpaperUrl, isVideo])

  return (
    <div className="relative w-full h-screen overflow-hidden py-0 md:p-2 bg-[#09090b]">
      {/* ── Gradient background layer ── */}
      <div
        className={`fixed inset-0 z-0 app-gradient transition-opacity duration-700 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        aria-hidden="true"
      />

      {/* ── Wallpaper layer with smooth scale & blur cross-fade ── */}
      {wallpaperUrl && (
        isVideo ? (
          <video
            key={wallpaperUrl}
            src={wallpaperUrl}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setWallpaperLoaded(true)}
            onCanPlay={() => setWallpaperLoaded(true)}
            onError={() => setWallpaperLoaded(true)}
            ref={el => {
              if (el) {
                el.defaultMuted = true
                el.muted = true
                el.play().catch(() => {})
                if (el.readyState >= 2) {
                  setWallpaperLoaded(true)
                }
              }
            }}
            className={`fixed inset-0 z-1 w-full h-full object-cover pointer-events-none transition-all duration-700 ease-out ${
              wallpaperLoaded && isLoaded
                ? (wallpaper.opacityMode === 'semi-transparent' ? 'opacity-45 scale-100 blur-0' : 'opacity-100 scale-100 blur-0')
                : 'opacity-0 scale-[1.02] blur-[6px]'
            }`}
            aria-hidden="true"
          />
        ) : (
          <div
            key={wallpaperUrl}
            className={`fixed inset-0 z-1 bg-cover bg-center transition-all duration-700 ease-out ${
              wallpaperLoaded && isLoaded
                ? (wallpaper.opacityMode === 'semi-transparent' ? 'opacity-45 scale-100 blur-0' : 'opacity-100 scale-100 blur-0')
                : 'opacity-0 scale-[1.02] blur-[6px]'
            }`}
            style={{ backgroundImage: `url(${wallpaperUrl})` }}
            aria-hidden="true"
          />
        )
      )}

      {/* ── Main App Shell with Spring Entrance ── */}
      <motion.div
        id="app-shell"
        initial={{ opacity: 0, y: 8, scale: 0.995 }}
        animate={{
          opacity: isLoaded ? 1 : 0,
          y: isLoaded ? 0 : 8,
          scale: isLoaded ? 1 : 0.995,
        }}
        transition={{
          duration: 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
        className="relative z-10 flex w-full h-full overflow-hidden"
      >
        <Sidebar />

        <main id="main-content" role="main" className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <BoardsArea />
        </main>
      </motion.div>

      {/* ── Silky Page Reveal Shimmer Beam ── */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[99999] pointer-events-none flex flex-col items-center justify-center bg-[#09090b]/50 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-0 left-0 right-0 h-[2px] bg-[var(--accent)] origin-left shadow-[0_0_12px_var(--accent)]"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App