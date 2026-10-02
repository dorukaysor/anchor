import { useRef, type ChangeEvent } from 'react'
import { motion, LayoutGroup } from 'framer-motion'
import { useAnchorStore } from '../Store'
import { THEME_PRESETS, SEARCH_ENGINES } from '../Schema'
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
  const store     = useAnchorStore()
  const importRef = useRef<HTMLInputElement>(null)

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex justify-end bg-black/35 backdrop-blur-[3px]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={springs.snappy}
        className="h-full w-full max-w-[420px] flex flex-col shadow-2xl border-l border-white/[0.08]"
        style={{
          background: 'rgba(13, 13, 17, 0.86)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        }}
      >

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-white/[0.08] sticky top-0 z-10 backdrop-blur-md bg-black/25">
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

          {/* Theme Presets */}
          <section className="flex flex-col gap-3">
            <SectionTitle>Theme Presets</SectionTitle>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Theme presets">
              {THEME_PRESETS.map(p => {
                const isSelected = store.theme.presetId === p.id;
                return (
                  <button
                    key={p.id}
                    id={`theme-${p.id}`}
                    title={p.label}
                    aria-label={p.label}
                    aria-pressed={isSelected}
                    className={`group relative flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-white/[0.10] border-white/30 shadow-sm'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12]'
                    }`}
                    onClick={() => store.applyThemePreset(p.id)}
                  >
                    <div
                      className="w-full h-6 rounded-md shadow-xs transition-transform group-hover:scale-102"
                      style={{ background: `linear-gradient(135deg, ${p.top}, ${p.middle}, ${p.bottom})` }}
                    />
                    <span className={`text-[10.5px] font-medium truncate w-full text-center ${isSelected ? 'text-white font-semibold' : 'text-white/50 group-hover:text-white/80'}`}>
                      {p.label}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Custom Theme Gradient */}
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07] mt-1">
              <span className="text-[11.5px] text-white/70 font-medium">Custom Gradient</span>
              <div className="flex items-center gap-3">
                {(['top', 'middle', 'bottom'] as const).map(k => (
                  <div key={k} className="flex-1 flex flex-col gap-1 items-center">
                    <label className="text-[9.5px] font-semibold uppercase tracking-wider text-white/40">{k}</label>
                    <div className="relative w-full h-8 rounded-lg overflow-hidden border border-white/15 cursor-pointer hover:border-white/35 transition-colors">
                      <input
                        type="color"
                        id={`custom-color-${k}`}
                        value={store.theme.custom[k]}
                        onChange={e => {
                          const c = { ...store.theme.custom, [k]: e.target.value }
                          store.setCustomTheme(c.top, c.middle, c.bottom)
                        }}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer opacity-0"
                      />
                      <div className="w-full h-full" style={{ backgroundColor: store.theme.custom[k] }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Wallpaper */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">Wallpaper</span>
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

            <div className="grid grid-cols-3 gap-2">
              {store.availableWallpapers.map(wp => (
                <button
                  key={wp.id}
                  id={`wallpaper-${wp.id}`}
                  title={wp.label}
                  aria-label={wp.label}
                  aria-pressed={store.wallpaper.presetId === wp.id}
                  className={`h-14 rounded-xl flex items-center justify-center text-[10.5px] font-semibold text-white/70 bg-white/[0.04] border-2 transition-all duration-150 cursor-pointer overflow-hidden ${
                    store.wallpaper.presetId === wp.id ? 'border-white shadow-md' : 'border-transparent hover:border-white/20'
                  }`}
                  style={wp.url ? { backgroundImage: `url(${wp.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  onClick={() => store.setWallpaperPreset(wp.id)}
                >
                  {wp.id === 'none' && <span className="text-white/45">None (Gradient)</span>}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                id="custom-wallpaper-input"
                className="flex-1 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[13px] placeholder:text-white/25 outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all font-sans"
                placeholder="https://… custom image or GIF URL"
                defaultValue={store.wallpaper.customUrl ?? ''}
                onBlur={e => { if (e.target.value.trim()) store.setCustomWallpaper(e.target.value.trim()) }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim()
                    if (val) store.setCustomWallpaper(val)
                  }
                }}
              />
              <button
                className="px-3.5 py-2 rounded-xl bg-white/[0.08] border border-white/[0.10] text-white/80 hover:bg-white/[0.16] hover:text-white text-[12px] font-semibold transition-all cursor-pointer shrink-0"
                onClick={() => {
                  const el = document.getElementById('custom-wallpaper-input') as HTMLInputElement
                  if (el?.value.trim()) store.setCustomWallpaper(el.value.trim())
                }}
              >Apply</button>
            </div>

            <p className="text-[10px] text-white/35 px-0.5 leading-normal">
              Images added to <code className="text-white/60 bg-white/[0.06] px-1 py-0.5 rounded text-[9.5px]">assets/wallpapers/</code> in <span className="text-white/60">dorukaysor/anchor</span> sync automatically.
            </p>

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
                  store.setLabelColor('activePage', '#818cf8')
                  store.setLabelColor('linkButton', '#6366f1')
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
        </div>
      </motion.div>
    </motion.div>
  )
}
