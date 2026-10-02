import { useMemo } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/shallow'
import { nanoid } from './lib/nanoid'
import {
  type AppState,
  AppStateSchema,
  type Board,
  DEFAULT_STATE,
  type LinkItem,
  type Page,
  type Todo,
  type TrashedItem,
  type WallpaperPreset,
  WALLPAPER_PRESETS,
} from './Schema'
import { fetchGitHubWallpapers } from './lib/wallpapers'

// ── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEY = 'anchor-v1'

function loadFromStorage(): AppState {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return DEFAULT_STATE
    const parsed = JSON.parse(raw)
    const result = AppStateSchema.safeParse(parsed)
    if (result.success) return result.data
    console.warn('[Anchor] Stored state failed validation, using default', result.error)
    return DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
function saveToStorage(state: AppState) {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  }, 300)
}

// ── Store types ──────────────────────────────────────────────────────────────

interface AnchorStore extends AppState {
  collapsedSections: Record<string, boolean>
  toggleSection: (section: string) => void

  activePageId: string
  setActivePage: (id: string) => void
  addPage: (name: string) => void
  renamePage: (id: string, name: string) => void
  deletePage: (id: string) => void
  reorderPages: (orderedIds: string[]) => void

  // Board actions
  addBoard: (title: string) => void
  renameBoard: (id: string, title: string) => void
  deleteBoard: (id: string) => void
  reorderBoards: (pageId: string, orderedIds: string[]) => void

  // Link actions
  addLink: (boardId: string, title: string, url: string) => void
  editLink: (boardId: string, linkId: string, title: string, url: string) => void
  deleteLink: (boardId: string, linkId: string) => void
  reorderLinks: (boardId: string, orderedIds: string[]) => void
  moveLinkToBoard: (fromBoardId: string, toBoardId: string, linkId: string, afterId?: string) => void

  // Todo actions
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  reorderTodos: (pageId: string | null, orderedIds: string[]) => void

  // Theming
  applyThemePreset: (presetId: string) => void
  setCustomTheme: (top: string, middle: string, bottom: string) => void

  // Wallpaper
  availableWallpapers: WallpaperPreset[]
  wallpapersLoading: boolean
  loadWallpapers: (force?: boolean) => Promise<void>
  setWallpaperPreset: (presetId: string) => void
  setCustomWallpaper: (url: string) => void
  setWallpaperOpacity: (mode: 'visible' | 'semi-transparent') => void

  // Settings
  setSearchEngine: (id: string) => void
  setPanelVisibility: (mode: AppState['panelVisibility']) => void
  setPanelOpacity: (opacity: number) => void
  setGlassEnabled: (enabled: boolean) => void
  setBookmarkDisplay: (mode: AppState['bookmarkDisplay']) => void
  setLabelColor: (key: keyof AppState['labelColors'], color: string) => void

  // Trash & restore
  restoreLatest: () => void
  emptyTrash: () => void

  // Export / Import
  exportState: () => void
  importState: (jsonStr: string) => { success: boolean; error?: string }
}

// ── Store factory helper ─────────────────────────────────────────────────────

function persist(get: () => AnchorStore) {
  const { activePageId, ...state } = get() // eslint-disable-line @typescript-eslint/no-unused-vars
  saveToStorage(state as AppState)
}

// ── Zustand store ─────────────────────────────────────────────────────────────

export const useAnchorStore = create<AnchorStore>()((set, get) => {
  const initial = loadFromStorage()

  return {
    ...initial,
    activePageId: initial.pages[0]?.id ?? '',

    // ── Page actions ────────────────────────────────────────────────────────

    toggleSection(section) {
      set(s => ({ collapsedSections: { ...s.collapsedSections, [section]: !s.collapsedSections[section] } }))
      persist(get)
    },

    setActivePage(id) {
      set({ activePageId: id })
    },

    addPage(name) {
      const id = `page-${nanoid()}`
      set(s => ({
        pages: [...s.pages, { id, name: name.trim(), order: s.pages.length }],
        activePageId: id,
      }))
      persist(get)
    },

    renamePage(id, name) {
      set(s => ({ pages: s.pages.map(p => p.id === id ? { ...p, name: name.trim() } : p) }))
      persist(get)
    },

    reorderPages(orderedIds) {
      set(s => ({
        pages: s.pages.map(p => ({ ...p, order: orderedIds.indexOf(p.id) }))
      }))
      persist(get)
    },

    deletePage(id) {
      const s = get()
      const page = s.pages.find(p => p.id === id)
      if (!page) return

      const trashedBoards: TrashedItem[] = s.boards
        .filter(b => b.pageId === id)
        .map(b => ({ id: nanoid(), type: 'board' as const, deletedAt: new Date().toISOString(), payload: b }))

      const newTrash: TrashedItem[] = [
        { id: nanoid(), type: 'page', deletedAt: new Date().toISOString(), payload: page },
        ...trashedBoards,
        ...s.trash,
      ]

      const newPages = s.pages.filter(p => p.id !== id).map((p, i) => ({ ...p, order: i }))
      const newBoards = s.boards.filter(b => b.pageId !== id)

      const newActiveId = s.activePageId === id
        ? (newPages[0]?.id ?? '')
        : s.activePageId

      set({ pages: newPages, boards: newBoards, trash: newTrash, activePageId: newActiveId })
      persist(get)
    },

    // ── Board actions ───────────────────────────────────────────────────────

    addBoard(title) {
      const { activePageId, boards } = get()
      const pageBoards = boards.filter(b => b.pageId === activePageId)
      const board: Board = {
        id: `board-${nanoid()}`,
        pageId: activePageId,
        title: title.trim(),
        order: pageBoards.length,
        links: [],
      }
      set(s => ({ boards: [...s.boards, board] }))
      persist(get)
    },

    renameBoard(id, title) {
      set(s => ({ boards: s.boards.map(b => b.id === id ? { ...b, title: title.trim() } : b) }))
      persist(get)
    },

    deleteBoard(id) {
      const s = get()
      const board = s.boards.find(b => b.id === id)
      if (!board) return
      const trashItem: TrashedItem = { id: nanoid(), type: 'board', deletedAt: new Date().toISOString(), payload: board }
      set({ boards: s.boards.filter(b => b.id !== id), trash: [trashItem, ...s.trash] })
      persist(get)
    },

    reorderBoards(pageId, orderedIds) {
      set(s => ({
        boards: s.boards.map(b =>
          b.pageId === pageId ? { ...b, order: orderedIds.indexOf(b.id) } : b
        ),
      }))
      persist(get)
    },

    // ── Link actions ────────────────────────────────────────────────────────

    addLink(boardId, title, url) {
      set(s => ({
        boards: s.boards.map(b => {
          if (b.id !== boardId) return b
          const link: LinkItem = {
            id: `link-${nanoid()}`,
            title: title.trim(),
            url: url.trim(),
            order: b.links.length,
          }
          return { ...b, links: [...b.links, link] }
        }),
      }))
      persist(get)
    },

    editLink(boardId, linkId, title, url) {
      set(s => ({
        boards: s.boards.map(b => {
          if (b.id !== boardId) return b
          return { ...b, links: b.links.map(l => l.id === linkId ? { ...l, title: title.trim(), url: url.trim() } : l) }
        }),
      }))
      persist(get)
    },

    deleteLink(boardId, linkId) {
      const s = get()
      const board = s.boards.find(b => b.id === boardId)
      const link = board?.links.find(l => l.id === linkId)
      if (!link) return
      const trashItem: TrashedItem = {
        id: nanoid(),
        type: 'link',
        deletedAt: new Date().toISOString(),
        payload: { ...link, boardId },
      }
      set({
        boards: s.boards.map(b =>
          b.id === boardId ? { ...b, links: b.links.filter(l => l.id !== linkId) } : b
        ),
        trash: [trashItem, ...s.trash],
      })
      persist(get)
    },

    reorderLinks(boardId, orderedIds) {
      set(s => ({
        boards: s.boards.map(b =>
          b.id === boardId
            ? { ...b, links: b.links.map(l => ({ ...l, order: orderedIds.indexOf(l.id) })) }
            : b
        ),
      }))
      persist(get)
    },

    moveLinkToBoard(fromBoardId, toBoardId, linkId, afterId) {
      const s = get()
      const fromBoard = s.boards.find(b => b.id === fromBoardId)
      const link = fromBoard?.links.find(l => l.id === linkId)
      if (!link) return

      set({
        boards: s.boards.map(b => {
          if (b.id === fromBoardId) {
            return { ...b, links: b.links.filter(l => l.id !== linkId).map((l, i) => ({ ...l, order: i })) }
          }
          if (b.id === toBoardId) {
            const newLinks = [...b.links]
            const insertAt = afterId ? newLinks.findIndex(l => l.id === afterId) + 1 : newLinks.length
            newLinks.splice(insertAt, 0, link)
            return { ...b, links: newLinks.map((l, i) => ({ ...l, order: i })) }
          }
          return b
        }),
      })
      persist(get)
    },

    // ── Todo actions ────────────────────────────────────────────────────────

    addTodo(text) {
      const { activePageId, todos } = get()
      const pageTodos = todos.filter(t => t.pageId === activePageId)
      const todo: Todo = {
        id: `todo-${nanoid()}`,
        pageId: activePageId,
        text: text.trim(),
        done: false,
        order: pageTodos.length,
      }
      set(s => ({ todos: [...s.todos, todo] }))
      persist(get)
    },

    toggleTodo(id) {
      set(s => ({ todos: s.todos.map(t => t.id === id ? { ...t, done: !t.done } : t) }))
      persist(get)
    },

    deleteTodo(id) {
      const s = get()
      const todo = s.todos.find(t => t.id === id)
      if (!todo) return
      const trashItem: TrashedItem = { id: nanoid(), type: 'todo', deletedAt: new Date().toISOString(), payload: todo }
      set({ todos: s.todos.filter(t => t.id !== id), trash: [trashItem, ...s.trash] })
      persist(get)
    },

    reorderTodos(pageId, orderedIds) {
      set(s => ({
        todos: s.todos.map(t =>
          t.pageId === pageId ? { ...t, order: orderedIds.indexOf(t.id) } : t
        ),
      }))
      persist(get)
    },

    // ── Theming ─────────────────────────────────────────────────────────────

    applyThemePreset(presetId) {
      set(s => ({ theme: { ...s.theme, presetId } }))
      persist(get)
    },

    setCustomTheme(top, middle, bottom) {
      set(() => ({ theme: { presetId: 'custom', custom: { top, middle, bottom } } }))
      persist(get)
    },

    // ── Wallpaper ────────────────────────────────────────────────────────────

    availableWallpapers: WALLPAPER_PRESETS,
    wallpapersLoading: false,

    async loadWallpapers(force = false) {
      set({ wallpapersLoading: true })
      try {
        const presets = await fetchGitHubWallpapers(force)
        set({ availableWallpapers: presets, wallpapersLoading: false })
      } catch {
        set({ wallpapersLoading: false })
      }
    },

    setWallpaperPreset(presetId) {
      set(s => ({ wallpaper: { ...s.wallpaper, presetId } }))
      persist(get)
    },

    setCustomWallpaper(url) {
      set(s => ({ wallpaper: { ...s.wallpaper, presetId: 'custom', customUrl: url } }))
      persist(get)
    },

    setWallpaperOpacity(mode) {
      set(s => ({ wallpaper: { ...s.wallpaper, opacityMode: mode } }))
      persist(get)
    },

    // ── Settings ─────────────────────────────────────────────────────────────

    setSearchEngine(id) {
      set({ searchEngine: id })
      persist(get)
    },

    setPanelVisibility(mode) {
      const opacity = mode === 'visible' ? 0.82 : mode === 'semi-visible' ? 0.48 : 0.18
      set({ panelVisibility: mode, panelOpacity: opacity })
      persist(get)
    },

    setPanelOpacity(opacity) {
      const clamped = Math.max(0.08, Math.min(0.95, opacity))
      const mode = clamped >= 0.65 ? 'visible' : clamped <= 0.28 ? 'pure-transparent' : 'semi-visible'
      set({ panelOpacity: clamped, panelVisibility: mode })
      persist(get)
    },

    setGlassEnabled(enabled) {
      set({ glassEnabled: enabled })
      persist(get)
    },

    setBookmarkDisplay(mode) {
      set({ bookmarkDisplay: mode })
      persist(get)
    },

    setLabelColor(key, color) {
      set(s => ({ labelColors: { ...s.labelColors, [key]: color } }))
      persist(get)
    },

    // ── Trash & restore ──────────────────────────────────────────────────────

    restoreLatest() {
      const s = get()
      if (s.trash.length === 0) return
      const [latest, ...rest] = s.trash
      const item = latest.payload as Page & Board & Todo & LinkItem & { boardId?: string }

      if (latest.type === 'page') {
        set(s2 => ({ pages: [...s2.pages, item as Page].sort((a, b) => a.order - b.order), trash: rest }))
      } else if (latest.type === 'board') {
        const board = item as Board
        set(s2 => ({ boards: [...s2.boards, board], trash: rest }))
      } else if (latest.type === 'todo') {
        set(s2 => ({ todos: [...s2.todos, item as Todo], trash: rest }))
      } else if (latest.type === 'link') {
        const { boardId, ...link } = item as LinkItem & { boardId: string }
        set(s2 => ({
          boards: s2.boards.map(b => b.id === boardId ? { ...b, links: [...b.links, link as LinkItem] } : b),
          trash: rest,
        }))
      }
      persist(get)
    },

    emptyTrash() {
      set({ trash: [] })
      persist(get)
    },

    // ── Export / Import ──────────────────────────────────────────────────────

    exportState() {
      const { activePageId, ...state } = get() // eslint-disable-line @typescript-eslint/no-unused-vars
      const json = JSON.stringify(state, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anchor-export-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(url)
    },

    importState(jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr)
        const result = AppStateSchema.safeParse(parsed)
        if (!result.success) {
          return { success: false, error: `Invalid state format: ${result.error.issues[0]?.message ?? 'Unknown error'}` }
        }
        set({ ...result.data, activePageId: result.data.pages[0]?.id ?? '' })
        persist(get)
        return { success: true }
      } catch (err) {
        return { success: false, error: `JSON parse error: ${(err as Error).message}` }
      }
    },
  }
})

// ── Selector helpers ─────────────────────────────────────────────────────────
// Use primitive selectors + useMemo to avoid the getSnapshot infinite-loop
// (React 19 + useSyncExternalStore requires stable snapshot references).

export function usePage() {
  return useAnchorStore(
    useShallow(s => ({
      pages: s.pages,
      activePageId: s.activePageId,
      setActivePage: s.setActivePage,
      addPage: s.addPage,
      renamePage: s.renamePage,
      deletePage: s.deletePage,
      reorderPages: s.reorderPages,
    }))
  )
}

export function useActivePageBoards() {
  // Selecting stable primitives — Zustand returns the SAME reference
  // when the slice hasn't changed, so useMemo only recomputes when needed.
  const boards       = useAnchorStore(s => s.boards)
  const activePageId = useAnchorStore(s => s.activePageId)
  return useMemo(
    () => boards.filter(b => b.pageId === activePageId).sort((a, b) => a.order - b.order),
    [boards, activePageId],
  )
}

export function useActiveTodos() {
  const todos        = useAnchorStore(s => s.todos)
  const activePageId = useAnchorStore(s => s.activePageId)
  return useMemo(
    () => todos.filter(t => t.pageId === activePageId).sort((a, b) => a.order - b.order),
    [todos, activePageId],
  )
}
