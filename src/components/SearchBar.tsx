import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAnchorStore } from '../Store'
import { SEARCH_ENGINES } from '../Schema'
import { IconChevronDown, IconX, IconPlus, IconCheck } from './icons'
import { dropIn, springs } from '../lib/theme'

interface SearchBarProps {
  onAddBoard: () => void
}

export function SearchBar({ onAddBoard }: SearchBarProps) {
  const searchEngine    = useAnchorStore(s => s.searchEngine)
  const setSearchEngine = useAnchorStore(s => s.setSearchEngine)

  const [query, setQuery]           = useState('')
  const [engineOpen, setEngineOpen] = useState(false)
  const engineBtnRef = useRef<HTMLButtonElement>(null)
  const dropdownRef  = useRef<HTMLDivElement>(null)

  const engine = SEARCH_ENGINES.find(e => e.id === searchEngine) ?? SEARCH_ENGINES[0]

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

  function navigate() {
    const q = query.trim()
    if (!q) return
    const url = /^https?:\/\//.test(q) || /^[\w-]+\.\w{2,}(\/|$)/.test(q)
      ? (q.startsWith('http') ? q : `https://${q}`)
      : engine.url.replace('{q}', encodeURIComponent(q))
    window.open(url, '_blank', 'noopener,noreferrer')
    setQuery('')
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') navigate()
    if (e.key === 'Escape') setEngineOpen(false)
  }

  return (
    /* Relative container so the dropdown is anchored to this top bar */
    <div className="relative flex items-center gap-2.5 px-5 pt-5 pb-0 shrink-0" role="search">

      {/* ── Search glass pill ── */}
      <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface-1 border border-default transition-all duration-150 focus-within:border-emphasis focus-within:bg-surface-2">

        {/* Engine toggle button */}
        <button
          ref={engineBtnRef}
          id="search-engine-btn"
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-2 text-secondary text-[11.5px] font-semibold tracking-wide hover:bg-surface-2 hover:text-primary transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
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
          id="search-input"
          type="text"
          placeholder="Search or type a URL…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKey}
          autoComplete="off"
          spellCheck={false}
          className="flex-1 min-w-0 bg-transparent outline-none text-primary text-[13.5px] placeholder:text-ghost"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        />

        <AnimatePresence>
          {query && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="text-tertiary hover:text-secondary transition-colors shrink-0 cursor-pointer"
              onClick={() => setQuery('')}
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
        className="px-4 py-2 rounded-2xl bg-surface-1 border border-default text-secondary text-[13px] font-semibold hover:bg-surface-2 hover:text-primary hover:border-emphasis transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
        onClick={navigate}
      >
        Search
      </button>

      {/* +Board button */}
      <button
        id="add-board-top-btn"
        className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-surface-1 border border-default text-secondary text-[13px] font-semibold hover:bg-surface-2 hover:text-primary hover:border-emphasis transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer"
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
    </div>
  )
}
