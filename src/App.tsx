import { useEffect } from 'react'
import { useAnchorStore } from './Store'
import { THEME_PRESETS, WALLPAPER_PRESETS } from './Schema'
import { Sidebar } from './components/Sidebar'
import { BoardsArea } from './components/BoardsArea'

function App() {
  const theme           = useAnchorStore(s => s.theme)
  const wallpaper       = useAnchorStore(s => s.wallpaper)
  const labelColors     = useAnchorStore(s => s.labelColors)
  const glassEnabled    = useAnchorStore(s => s.glassEnabled)
  const panelVisibility    = useAnchorStore(s => s.panelVisibility)
  const panelOpacity       = useAnchorStore(s => s.panelOpacity)
  const availableWallpapers = useAnchorStore(s => s.availableWallpapers)
  const loadWallpapers      = useAnchorStore(s => s.loadWallpapers)

  /* Automatically load available wallpapers from GitHub on mount */
  useEffect(() => {
    loadWallpapers()
  }, [loadWallpapers])

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
    const rawAccent = labelColors.activePage
    const isTooDark = !rawAccent || rawAccent === '#000000' || rawAccent.toLowerCase() === '#0a0a0f'
    const safeAccent = isTooDark ? '#818cf8' : rawAccent
    root.style.setProperty('--accent',     safeAccent)
    root.style.setProperty('--accent-btn', labelColors.linkButton || '#6366f1')
  }, [theme, labelColors, glassEnabled, panelVisibility, panelOpacity])

  /* Wallpaper URL (supports images and animated GIFs) */
  let wallpaperUrl = ''
  if (wallpaper.presetId === 'custom') {
    wallpaperUrl = wallpaper.customUrl ?? ''
  } else if (wallpaper.presetId !== 'none') {
    wallpaperUrl = availableWallpapers.find(w => w.id === wallpaper.presetId)?.url
      ?? WALLPAPER_PRESETS.find(w => w.id === wallpaper.presetId)?.url
      ?? ''
  }

  return (
    <div className="relative w-full h-screen overflow-hidden py-0 md:p-2">
      {/* Gradient background */}
      <div className="fixed inset-0 z-0 app-gradient transition-all duration-700" aria-hidden="true" />

      {/* Optional wallpaper layer (Image / animated GIF) */}
      {wallpaperUrl && (
        <div
          key={wallpaperUrl}
          className={`fixed inset-0 z-1 bg-cover bg-center transition-opacity duration-700 ${
            wallpaper.opacityMode === 'semi-transparent' ? 'opacity-45' : 'opacity-100'
          }`}
          style={{ backgroundImage: `url(${wallpaperUrl})` }}
          aria-hidden="true"
        />
      )}

      {/* App shell */}
      <div className="relative z-10 flex w-full h-full overflow-hidden" id="app-shell">
        <Sidebar />

        <main id="main-content" role="main" className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <BoardsArea />
        </main>
      </div>
    </div>
  )
}

export default App