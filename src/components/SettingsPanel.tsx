import { useState, useRef, useEffect, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion, LayoutGroup } from 'framer-motion'
import { useAnchorStore } from '../Store'
import { SEARCH_ENGINES } from '../Schema'
import { isVideoUrl } from '../lib/wallpapers'
import { IconX } from './icons'
import { springs } from '../lib/theme'

interface ToggleOption {
  label: string
  value: string
}

interface ToggleGroupProps {
  id: string
  options: ToggleOption[]
  value: string
  onChange: (v: string) => void
}

function SectionTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-0.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{children}</span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  )
}

function ToggleGroup({ id, options, value, onChange }: ToggleGroupProps) {
  return (
    <LayoutGroup id={id}>
      <div className="relative flex bg-black/40 border border-white/[0.08] rounded-xl p-1 gap-1">
        {options.map(opt => {
          const isActive = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              className={`relative flex-1 py-1.5 px-2 rounded-lg text-[12px] font-medium text-center transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'text-white font-semibold'
                  : 'text-white/45 hover:text-white/80'
              }`}
              onClick={() => onChange(opt.value)}
            >
              {isActive && (
                <motion.div
                  layoutId={`toggle-indicator-${id}`}
                  className="absolute inset-0 bg-white/[0.14] border border-white/[0.12] rounded-lg shadow-xs"
                  transition={springs.snappy}
                  style={{ zIndex: 0 }}
                />
              )}
              <span className="relative z-10">{opt.label}</span>
            </button>
          )
        })}
      </div>
    </LayoutGroup>
  )
}

export function SettingsPanel({ onClose }: { onClose: () => void }) {
  const store        = useAnchorStore()
  const importRef    = useRef<HTMLInputElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function handleImport(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const result = store.importState(ev.target?.result as string)
      if (result.success) { alert('✅ Imported successfully!'); onClose() }
      else alert(`❌ Import failed:\n${result.error}`)
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const currentOpacity = store.panelOpacity ?? (
    store.panelVisibility === 'visible' ? 0.82 :
    store.panelVisibility === 'pure-transparent' ? 0.18 :
    0.48
  )

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="fixed inset-0 z-[100] flex justify-end bg-black/45"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="h-full w-full max-w-[420px] flex flex-col shadow-2xl border-l border-white/[0.08]"
        style={{
          background: 'rgba(13, 13, 17, 0.94)',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          willChange: 'transform',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.08] sticky top-0 z-10 bg-[#0d0d11]/92 backdrop-blur-xs">
          <div>
            <h2 id="settings-title" className="text-[16px] font-bold text-white tracking-tight">Settings</h2>
            <p className="text-[11.5px] text-white/40 mt-0.5">Customize your workspace</p>
          </div>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/[0.08] text-white/50 hover:bg-white/[0.12] hover:text-white transition-all duration-150 cursor-pointer"
            onClick={onClose}
            aria-label="Close settings"
          >
            <IconX size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">

          {/* Wallpaper */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Wallpaper</span>
                <span className="text-[10px] font-mono text-white/40 bg-white/[0.06] px-1.5 py-0.2 rounded-md">
                  {store.availableWallpapers.filter(w => w.id !== 'none').length}
                </span>
              </div>
              <button
                onClick={() => store.loadWallpapers(true)}
                disabled={store.wallpapersLoading}
                title="Fetch latest wallpapers from GitHub (dorukaysor/anchor)"
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-[10px] font-medium text-white/50 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer disabled:opacity-50"
              >
                <svg
                  className={`w-2.5 h-2.5 ${store.wallpapersLoading ? 'animate-spin text-white' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{store.wallpapersLoading ? 'Syncing…' : 'Sync GitHub'}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {store.availableWallpapers.map(wp => {
                const isSelected =
                  store.wallpaper.presetId === wp.id ||
                  (store.wallpaper.presetId === 'w1' && wp.id === '0001.jpg') ||
                  (store.wallpaper.presetId === 'w2' && wp.id === '0002.jpg') ||
                  (store.wallpaper.presetId === 'w3' && wp.id === '0011.jpg') ||
                  (store.wallpaper.presetId === 'w4' && wp.id === '0013.jpg') ||
                  (store.wallpaper.presetId === 'w5' && wp.id === '0016.jpg') ||
                  (store.wallpaper.presetId === 'w6' && wp.id === '0017.jpg') ||
                  (store.wallpaper.presetId === 'w7' && wp.id === '0021.jpg') ||
                  (store.wallpaper.presetId === 'w8' && wp.id === '0022.jpg') ||
                  Boolean(wp.url && store.wallpaper.customUrl && wp.url === store.wallpaper.customUrl)

                return (
                  <button
                    key={wp.id}
                    id={`wallpaper-${wp.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`}
                    title={wp.label || wp.id}
                    aria-label={wp.label || wp.id}
                    aria-pressed={isSelected}
                    className={`group relative h-14 rounded-xl flex items-center justify-center text-[10.5px] font-semibold text-white/70 bg-white/[0.04] border-2 transition-colors duration-150 cursor-pointer overflow-hidden ${
                      isSelected ? 'border-white shadow-md' : 'border-transparent hover:border-white/20'
                    }`}
                    onClick={() => store.setWallpaperPreset(wp.id)}
                  >
                    {wp.url && (
                      <img
                        src={wp.url}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                      />
                    )}
                    {wp.id === 'none' ? (
                      <span className="relative z-10 text-white/45">None</span>
                    ) : (
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute inset-0 z-10 bg-black/75 flex items-center justify-center text-[9.5px] font-medium text-white px-1 text-center">
                        {wp.label}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Custom wallpaper input */}
            <div className="flex flex-col gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Add Custom Wallpaper</span>
              <div className="flex gap-2">
                <input
                  id="custom-wallpaper-input"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/25 outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all font-sans"
                  placeholder="Paste image, GIF, or video URL (.mp4, .webm)…"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      const input = e.target as HTMLInputElement
                      const val = input.value.trim()
                      if (val) {
                        store.addCustomWallpaper(val)
                        input.value = ''
                      }
                    }
                  }}
                />
                <button
                  className="px-3.5 py-2 rounded-md bg-white/[0.08] border border-white/[0.10] text-white/80 hover:bg-white/[0.16] hover:text-white text-[12px] font-semibold transition-all cursor-pointer shrink-0"
                  onClick={() => {
                    const el = document.getElementById('custom-wallpaper-input') as HTMLInputElement
                    const val = el?.value.trim()
                    if (val) {
                      store.addCustomWallpaper(val)
                      el.value = ''
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Custom Wallpapers Grid (under default wallpapers grid) */}
            {store.customWallpapers && store.customWallpapers.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Custom Wallpapers</span>
                    <span className="text-[10px] font-mono text-white/40 bg-white/[0.06] px-1.5 py-0.2 rounded-md">
                      {store.customWallpapers.length}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                  {store.customWallpapers.map((url, idx) => {
                    const isSelected =
                      store.wallpaper.presetId === 'custom' &&
                      store.wallpaper.customUrl === url
                    const isVideo = isVideoUrl(url)

                    return (
                      <div
                        key={url + '-' + idx}
                        className="group relative h-14 rounded-xl overflow-hidden"
                      >
                        <button
                          title={url}
                          aria-label={`Custom wallpaper ${idx + 1}`}
                          aria-pressed={isSelected}
                          className={`w-full h-full rounded-xl flex items-center justify-center text-[10.5px] font-semibold text-white/70 bg-white/[0.04] border-2 transition-colors duration-150 cursor-pointer overflow-hidden ${
                            isSelected ? 'border-white shadow-md' : 'border-transparent hover:border-white/20'
                          }`}
                          onClick={() => store.setCustomWallpaper(url)}
                        >
                          {isVideo ? (
                            <video
                              src={url}
                              muted
                              loop
                              autoPlay
                              playsInline
                              ref={el => {
                                if (el) {
                                  el.defaultMuted = true
                                  el.muted = true
                                  el.play().catch(() => {})
                                }
                              }}
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />
                          ) : (
                            <img
                              src={url}
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                            />
                          )}
                          {isVideo && (
                            <span className="absolute top-1 left-1 z-10 px-1 py-0.2 rounded bg-black/60 text-[8px] font-mono font-bold text-white/80">
                              VIDEO
                            </span>
                          )}
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute inset-0 z-10 bg-black/75 flex items-center justify-center text-[9.5px] font-medium text-white px-1 text-center">
                            Custom {idx + 1}
                          </span>
                        </button>

                        {/* Delete button on hover */}
                        <button
                          title="Remove custom wallpaper"
                          aria-label="Remove custom wallpaper"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute top-1 right-1 w-5 h-5 rounded-md bg-black/70 hover:bg-red-500/90 text-white/80 hover:text-white flex items-center justify-center cursor-pointer shadow-md z-10"
                          onClick={e => {
                            e.stopPropagation()
                            store.deleteCustomWallpaper(url)
                          }}
                        >
                          <IconX size={10} />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40 mb-1.5">Wallpaper Opacity</p>
              <ToggleGroup
                id="wallpaper-opacity"
                value={store.wallpaper.opacityMode}
                onChange={v => store.setWallpaperOpacity(v as 'visible' | 'semi-transparent')}
                options={[{ label: 'Pure visible', value: 'visible' }, { label: 'Semi transparent', value: 'semi-transparent' }]}
              />
            </div>
          </section>

          {/* Panel visibility */}
          <section className="flex flex-col gap-3">
            <SectionTitle>Panel Visibility</SectionTitle>
            <ToggleGroup
              id="panel-visibility"
              value={store.panelVisibility}
              onChange={v => store.setPanelVisibility(v as 'visible' | 'semi-visible' | 'pure-transparent')}
              options={[
                { label: 'Visible', value: 'visible' },
                { label: 'Semi', value: 'semi-visible' },
                { label: 'Transparent', value: 'pure-transparent' },
              ]}
            />

            {/* Precision transparency slider */}
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-white/70 font-medium">Surface Opacity</span>
                <span className="text-[11px] font-mono font-semibold text-white bg-white/[0.10] px-2 py-0.5 rounded-md border border-white/[0.10]">
                  {Math.round(currentOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.95"
                step="0.01"
                value={currentOpacity}
                onChange={e => store.setPanelOpacity(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-white [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-neutral-900 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                aria-label="Panel transparency slider"
              />
              <div className="flex justify-between text-[10px] text-white/35 font-medium px-0.5">
                <span>10% Silky</span>
                <span>48% Balanced</span>
                <span>95% Solid</span>
              </div>
            </div>
          </section>
          
          {/* Effects */}
          <section className="flex flex-col gap-3">
            <SectionTitle>Effects</SectionTitle>
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
              <div>
                <p className="text-[13px] text-white/85 font-medium">Glassmorphism</p>
                <p className="text-[11px] text-white/40 mt-0.5">Frosted blur effects on cards and panels</p>
              </div>
              <button
                className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer p-0.5 ${
                  store.glassEnabled ? 'bg-white' : 'bg-white/15'
                }`}
                onClick={() => store.setGlassEnabled(!store.glassEnabled)}
                role="switch"
                aria-checked={store.glassEnabled}
                aria-label="Toggle glassmorphism"
              >
                <motion.div
                  className={`w-5 h-5 rounded-full shadow-sm ${store.glassEnabled ? 'bg-black' : 'bg-white'}`}
                  animate={{ x: store.glassEnabled ? 20 : 0 }}
                  transition={springs.snappy}
                />
              </button>
            </div>
          </section>

          {/* Bookmark display */}
          <section className="flex flex-col gap-3">
            <SectionTitle>Bookmark Display</SectionTitle>
            <ToggleGroup
              id="bookmark-display"
              value={store.bookmarkDisplay}
              onChange={v => store.setBookmarkDisplay(v as 'title-url' | 'title-only')}
              options={[{ label: 'Title + URL', value: 'title-url' }, { label: 'Title only', value: 'title-only' }]}
            />
          </section>

          {/* Label colors */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Accents</span>
              <button
                onClick={() => {
                  store.setLabelColor('activePage', '#a78bfa')
                  store.setLabelColor('linkButton', '#7c3aed')
                }}
                className="text-[10.5px] font-medium text-white/45 hover:text-white/85 transition-colors cursor-pointer"
              >
                Reset to defaults
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {([
                ['color-active-page', 'Active page accent', 'activePage' as const],
                ['color-link-btn', 'Button accent', 'linkButton' as const],
              ] as [string, string, 'activePage' | 'linkButton'][]).map(([id, label, key]) => (
                <div key={id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                  <label htmlFor={id} className="text-[13px] text-white/70 font-medium">{label}</label>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[11px] font-mono text-white/45 uppercase">{store.labelColors[key]}</span>
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-white/20 shadow-sm cursor-pointer hover:border-white/50 transition-colors">
                      <input
                        type="color"
                        id={id}
                        value={store.labelColors[key]}
                        onChange={e => store.setLabelColor(key, e.target.value)}
                        className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer opacity-0"
                      />
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: store.labelColors[key] }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Search engine */}
          <section className="flex flex-col gap-3">
            <SectionTitle>Search Engine</SectionTitle>
            <select
              id="search-engine-select"
              value={store.searchEngine}
              onChange={e => store.setSearchEngine(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[13px] font-sans outline-none cursor-pointer appearance-none focus:border-white/30 transition-all"
            >
              {SEARCH_ENGINES.map(e => <option key={e.id} value={e.id} className="bg-neutral-900 text-white">{e.label}</option>)}
            </select>
          </section>

          {/* Data export/import */}
          <section className="flex flex-col gap-3">
            <SectionTitle>Data Backup</SectionTitle>
            <div className="flex gap-2 flex-wrap">
              <button
                id="export-btn"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/75 text-[12.5px] font-semibold hover:bg-white/[0.12] hover:text-white transition-all cursor-pointer text-center"
                onClick={store.exportState}
              >↓ Export JSON</button>
              <button
                id="import-btn"
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/75 text-[12.5px] font-semibold hover:bg-white/[0.12] hover:text-white transition-all cursor-pointer text-center"
                onClick={() => importRef.current?.click()}
              >↑ Import JSON</button>
              <input ref={importRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} />
            </div>
            <p className="text-[11px] text-white/35 leading-relaxed">
              Export your configuration as a portable JSON file. Import validates the schema before replacing your data.
            </p>
          </section>

          {/* Danger Zone */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center gap-2 pt-1 pb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-400/90">Danger</span>
              <div className="flex-1 h-px bg-red-500/20" />
            </div>

            {confirmReset ? (
              <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-500/10 flex flex-col gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="text-base leading-none mt-0.5">⚠️</span>
                  <div>
                    <p className="text-[13px] font-bold text-red-100">Confirm Reset</p>
                    <p className="text-[11.5px] text-white/60 mt-1 leading-relaxed">
                      Are you sure? This will delete all custom pages, boards, and links stored in <code className="text-white/80 bg-white/10 px-1 py-0.5 rounded text-[10.5px]">anchor-data</code>. Cached wallpapers will not be affected.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    id="cancel-reset-btn"
                    className="flex-1 py-2 px-3 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-white/80 text-[12px] font-medium transition-colors cursor-pointer text-center"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    id="confirm-reset-btn"
                    className="flex-1 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold shadow-md transition-colors cursor-pointer text-center"
                    onClick={() => {
                      store.resetToDefaults()
                      setConfirmReset(false)
                      onClose()
                    }}
                  >
                    Yes, Reset Everything
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl border border-red-500/25 bg-red-500/[0.05] flex flex-col gap-3">
                <div>
                  <p className="text-[13px] font-semibold text-red-200">Reset to Defaults</p>
                  <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">
                    Permanently deletes all pages, boards, links, and preferences stored in <code className="text-white/60 bg-white/[0.06] px-1 py-0.5 rounded text-[10px]">anchor-data</code>. Cached wallpapers from GitHub will be preserved.
                  </p>
                </div>

                <button
                  id="reset-to-defaults-btn"
                  type="button"
                  className="w-full py-2.5 px-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white hover:border-red-500 text-[12.5px] font-semibold transition-all duration-150 cursor-pointer text-center"
                  onClick={() => setConfirmReset(true)}
                >
                  Reset to Defaults
                </button>
              </div>
            )}
          </section>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
