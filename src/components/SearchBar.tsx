import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { useAnchorStore } from '../Store'
import { SEARCH_ENGINES } from '../Schema'
import { IconChevronDown, IconX, IconPlus, IconCheck } from './icons'
import { dropIn, springs } from '../lib/theme'

interface SearchBarProps {
  onAddBoard: () => void
}

interface NavDestination {
  title: string
  detail: string
  favicon: string
}

function getDestinationInfo(url: string, engineLabel: string, rawQuery: string): NavDestination {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, '')
    const isSearch =
      url.includes(hostname) && (url.includes('search') || url.includes('?q=') || url.includes('/?'))

    const favicon = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`

    if (isSearch) {
      return {
        title: `Searching ${engineLabel}`,
        detail: rawQuery,
        favicon,
      }
    }

    return {
      title: `Opening ${hostname}`,
      detail: parsed.pathname !== '/' ? parsed.pathname : '',
      favicon,
    }
  } catch {
    return {
      title: `Navigating…`,
      detail: rawQuery,
      favicon: '',
    }
  }
}

export function SearchBar({ onAddBoard }: SearchBarProps) {
  const searchEngine    = useAnchorStore(s => s.searchEngine)
  const setSearchEngine = useAnchorStore(s => s.setSearchEngine)

  const [query, setQuery]               = useState('')
  const [engineOpen, setEngineOpen]     = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [navInfo, setNavInfo]           = useState<NavDestination | null>(null)

  const inputRef     = useRef<HTMLInputElement>(null)
  const engineBtnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef  = useRef<HTMLDivElement>(null)
  const navTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clear pending navigation timer on unmount
  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current)
    }
  }, [])

  const engine = SEARCH_ENGINES.find(e => e.id === searchEngine) ?? SEARCH_ENGINES[0]

  // Global keybinds: '/' and 'Ctrl+K' (or Cmd+K) to focus the search bar, strictly overriding browser defaults
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      if (isNavigating) return

      const isCtrlK = (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')

      const activeEl = document.activeElement
      const isTypingInField =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
         activeEl.tagName === 'TEXTAREA' ||
         (activeEl as HTMLElement).isContentEditable)

      // Forward slash focuses search bar only when NOT already typing inside any input/textarea
      const isSlash = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !isTypingInField

      if (isCtrlK || isSlash) {
        // Strictly override browser default omnibox / in-page quick-find
        e.preventDefault()
        e.stopPropagation()

        if (inputRef.current) {
          inputRef.current.focus()
          inputRef.current.select()
        }
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, { capture: true })
  }, [isNavigating])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!engineOpen) return
    const handler = (e: MouseEvent) => {
      if (
        engineBtnRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setEngineOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [engineOpen])

  // Reset navigation overlay if user returns via browser back button (bfcache or reload)
  useEffect(() => {
    const handlePageShow = () => {
      setIsNavigating(false)
      setNavInfo(null)
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  function navigate() {
    const q = query.trim()
    if (!q || isNavigating) return

    const url = /^https?:\/\//.test(q) || /^[\w-]+\.\w{2,}(\/|$)/.test(q)
      ? (q.startsWith('http') ? q : `https://${q}`)
      : engine.url.replace('{q}', encodeURIComponent(q))

    const info = getDestinationInfo(url, engine.label, q)
    setNavInfo(info)
    setIsNavigating(true)
    setEngineOpen(false)

    // Smooth transitional animation before opening in the same tab
    if (navTimerRef.current) clearTimeout(navTimerRef.current)
    navTimerRef.current = setTimeout(() => {
      window.location.href = url
    }, 320)
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') navigate()
    if (e.key === 'Escape') {
      setEngineOpen(false)
      inputRef.current?.blur()
    }
  }

  return (
    /* Relative container so the dropdown is anchored to this top bar */
    <div className="relative flex items-center gap-2.5 px-5 pt-5 pb-0 shrink-0" role="search">

      {/* ── Search glass pill ── */}
      <div
        className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface-1 border transition-all duration-200 ${
          isNavigating
            ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/40 shadow-[0_0_25px_color-mix(in_srgb,var(--accent)_30%,transparent)]'
            : 'border-default focus-within:border-emphasis focus-within:bg-surface-2'
        }`}
      >

        {/* Engine toggle button */}
        <button
          ref={engineBtnRef}
          id="search-engine-btn"
          disabled={isNavigating}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-2 text-secondary text-[11.5px] font-semibold tracking-wide hover:bg-surface-2 hover:text-primary transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          onClick={() => setEngineOpen(v => !v)}
          aria-expanded={engineOpen}
          aria-label={`Search engine: ${engine.label}`}
        >
          {engine.label}
          <IconChevronDown
            size={12}
            className={`transition-transform duration-150 ${engineOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Divider */}
        <div className="w-px h-4 bg-[var(--border-default)] shrink-0" />

        <input
          ref={inputRef}
          id="search-input"
          type="text"
          placeholder="Search or type a URL…"
          value={query}
          disabled={isNavigating}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKey}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-transparent outline-none text-primary text-[13.5px] placeholder:text-ghost disabled:opacity-60"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        />

        {/* Keyboard shortcut affordance badge (visible when query is empty) */}
        {!query && !isNavigating && (
          <div className="flex items-center gap-1 shrink-0 select-none text-ghost pointer-events-none">
            <kbd className="px-1.5 py-0.5 rounded-md bg-surface-2 border border-default text-[10px] font-mono font-medium shadow-xs">
              /
            </kbd>
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md bg-surface-2 border border-default text-[10px] font-mono font-medium shadow-xs">
              Ctrl K
            </kbd>
          </div>
        )}

        {/* Clear query button */}
        <AnimatePresence>
          {query && !isNavigating && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="text-tertiary hover:text-secondary transition-colors shrink-0 cursor-pointer"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Clear search"
            >
              <IconX size={12} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Search button */}
      <button
        id="search-submit-btn"
        disabled={isNavigating}
        className={`px-4 py-2 rounded-2xl border text-[13px] font-semibold transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
          isNavigating
            ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md'
            : 'bg-surface-1 border-default text-secondary hover:bg-surface-2 hover:text-primary hover:border-emphasis'
        }`}
        onClick={navigate}
      >
        {isNavigating ? (
          <span className="flex items-center gap-1.5">
            <svg className="w-3 h-3 animate-spin text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Opening…
          </span>
        ) : (
          'Search'
        )}
      </button>

      {/* +Board button */}
      <button
        id="add-board-top-btn"
        disabled={isNavigating}
        className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-surface-1 border border-default text-secondary text-[13px] font-semibold hover:bg-surface-2 hover:text-primary hover:border-emphasis transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
        onClick={onAddBoard}
      >
        <IconPlus size={12} />
        Board
      </button>

      {/* ── Engine dropdown — anchored to the top-bar wrapper ── */}
      <AnimatePresence>
        {engineOpen && (
          <motion.div
            variants={dropIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={springs.snappy}
            ref={dropdownRef}
            className="absolute top-[calc(100%-2px)] left-5 z-500 w-40 flex flex-col glass-card rounded-xl shadow-2xl overflow-hidden"
            role="listbox"
            aria-label="Choose search engine"
          >
            <div className="px-3 py-2 border-b border-subtle">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-tertiary">Search engine</p>
            </div>
            <div className="p-1 flex flex-col gap-px">
              {SEARCH_ENGINES.map(e => (
                <button
                  key={e.id}
                  className={`
                    flex items-center justify-between px-3 py-1.5 rounded-lg text-[13px] font-medium
                    transition-all duration-100 text-left cursor-pointer
                    ${e.id === searchEngine
                      ? 'bg-accent-muted text-accent'
                      : 'text-secondary hover:bg-surface-1 hover:text-primary'
                    }
                  `}
                  role="option"
                  aria-selected={e.id === searchEngine}
                  onClick={() => { setSearchEngine(e.id); setEngineOpen(false) }}
                >
                  {e.label}
                  {e.id === searchEngine && (
                    <IconCheck size={12} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Same-tab navigation smooth transition portal ── */}
      {isNavigating && navInfo && typeof document !== 'undefined' && createPortal(
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[99999] pointer-events-auto flex flex-col items-center justify-center bg-black/60 backdrop-blur-md select-none"
        >
          {/* Glowing accent laser beam across the top */}
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute top-0 left-0 right-0 h-[2.5px] bg-[var(--accent)] origin-left shadow-[0_0_16px_var(--accent),0_0_8px_#ffffff]"
          />

          {/* Center frosted launch card */}
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3.5 px-5 py-3 rounded-2xl glass-overlay border border-white/15 shadow-2xl backdrop-blur-2xl max-w-sm mx-4"
          >
            {/* Favicon container */}
            <div className="relative w-8 h-8 rounded-xl bg-surface-2 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {navInfo.favicon ? (
                <img
                  src={navInfo.favicon}
                  alt=""
                  className="w-4 h-4 object-contain"
                  onError={e => { (e.currentTarget as HTMLElement).style.display = 'none' }}
                />
              ) : (
                <div className="w-2.5 h-2.5 rounded-full bg-[var(--accent)]" />
              )}
              <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
            </div>

            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-semibold text-primary truncate">
                  {navInfo.title}
                </span>
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]" />
                </span>
              </div>
              {navInfo.detail && (
                <span className="text-[11.5px] font-normal text-tertiary truncate max-w-[220px]">
                  {navInfo.detail}
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>,
        document.body
      )}
    </div>
  )
}
