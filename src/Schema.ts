import { z } from 'zod'

// ── Primitive schemas ────────────────────────────────────────────────────────

export const LinkItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
  order: z.number(),
})

export const BoardSchema = z.object({
  id: z.string(),
  pageId: z.string(),
  title: z.string(),
  order: z.number(),
  links: z.array(LinkItemSchema),
})

export const PageSchema = z.object({
  id: z.string(),
  name: z.string(),
  order: z.number(),
})

export const TodoSchema = z.object({
  id: z.string(),
  pageId: z.string().nullable(),
  text: z.string(),
  done: z.boolean(),
  order: z.number(),
})

export const TrashedItemSchema = z.object({
  id: z.string(),
  type: z.enum(['board', 'link', 'page', 'todo']),
  deletedAt: z.string(),
  payload: z.unknown(),
})

// ── App State schema ─────────────────────────────────────────────────────────

export const AppStateSchema = z.object({
  version: z.literal(1),
  theme: z.object({
    presetId: z.string(),
    custom: z.object({
      top: z.string(),
      middle: z.string(),
      bottom: z.string(),
    }),
  }),
  wallpaper: z.object({
    presetId: z.string(),
    customUrl: z.string().optional(),
    opacityMode: z.enum(['visible', 'semi-transparent']),
  }),
  searchEngine: z.string(),
  panelVisibility: z.enum(['visible', 'semi-visible', 'pure-transparent']),
  panelOpacity: z.number().min(0.05).max(1).default(0.48).optional(),
  glassEnabled: z.boolean().default(true),
  bookmarkDisplay: z.enum(['title-url', 'title-only']),
  labelColors: z.object({
    activePage: z.string(),
    linkButton: z.string(),
  }),
  collapsedSections: z.record(z.string(), z.boolean()).default({}),
  pages: z.array(PageSchema),
  boards: z.array(BoardSchema),
  todos: z.array(TodoSchema),
  trash: z.array(TrashedItemSchema),
})

// ── TypeScript types ─────────────────────────────────────────────────────────

export type LinkItem = z.infer<typeof LinkItemSchema>
export type Board = z.infer<typeof BoardSchema>
export type Page = z.infer<typeof PageSchema>
export type Todo = z.infer<typeof TodoSchema>
export type TrashedItem = z.infer<typeof TrashedItemSchema>
export type AppState = z.infer<typeof AppStateSchema>

// ── Default state ────────────────────────────────────────────────────────────

const defaultPageId = 'page-personal'
const defaultPageId2 = 'page-work'

export const DEFAULT_STATE: AppState = {
  version: 1,
  theme: {
    presetId: 'violet',
    custom: { top: '#312e81', middle: '#1e1b4b', bottom: '#0f0a1e' },
  },
  wallpaper: {
    presetId: 'none',
    opacityMode: 'visible',
  },
  searchEngine: 'google',
  panelVisibility: 'visible',
  panelOpacity: 0.48,
  glassEnabled: true,
  bookmarkDisplay: 'title-url',
  labelColors: {
    activePage: '#a78bfa',
    linkButton: '#7c3aed',
  },
  collapsedSections: {},
  pages: [
    { id: defaultPageId, name: 'Personal', order: 0 },
    { id: defaultPageId2, name: 'Work', order: 1 },
  ],
  boards: [
    {
      id: 'board-social',
      pageId: defaultPageId,
      title: 'Social',
      order: 0,
      links: [
        { id: 'link-gh', title: 'GitHub', url: 'https://github.com', order: 0 },
        { id: 'link-yt', title: 'YouTube', url: 'https://youtube.com', order: 1 },
        { id: 'link-tw', title: 'X / Twitter', url: 'https://x.com', order: 2 },
      ],
    },
    {
      id: 'board-tools',
      pageId: defaultPageId,
      title: 'Tools',
      order: 1,
      links: [
        { id: 'link-vscode', title: 'VS Code Online', url: 'https://vscode.dev', order: 0 },
        { id: 'link-figma', title: 'Figma', url: 'https://figma.com', order: 1 },
      ],
    },
    {
      id: 'board-work-research',
      pageId: defaultPageId2,
      title: 'Research',
      order: 0,
      links: [
        { id: 'link-mdm', title: 'MDN Docs', url: 'https://developer.mozilla.org', order: 0 },
        { id: 'link-so', title: 'Stack Overflow', url: 'https://stackoverflow.com', order: 1 },
      ],
    },
  ],
  todos: [
    { id: 'todo-1', pageId: defaultPageId, text: 'Set up Anchor as browser homepage', done: false, order: 0 },
    { id: 'todo-2', pageId: defaultPageId, text: 'Add favorite links', done: false, order: 1 },
  ],
  trash: [],
}

// ── Theme presets ────────────────────────────────────────────────────────────

export interface ThemePreset {
  id: string
  label: string
  top: string
  middle: string
  bottom: string
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'obsidian', label: 'Obsidian',  top: '#1e1b4b', middle: '#0f0d2e', bottom: '#08081a' },
  { id: 'slate',    label: 'Slate',    top: '#334155', middle: '#1e293b', bottom: '#020617' },
  { id: 'violet',   label: 'Violet',   top: '#4c1d95', middle: '#2e1065', bottom: '#0f0a1e' },
  { id: 'emerald',  label: 'Emerald',  top: '#064e3b', middle: '#022c22', bottom: '#010f0a' },
  { id: 'graphite', label: 'Graphite', top: '#27272a', middle: '#18181b', bottom: '#09090b' },
  { id: 'carbon',   label: 'Carbon',   top: '#1c1c1c', middle: '#111111', bottom: '#080808' },
  { id: 'rose',     label: 'Rose',     top: '#881337', middle: '#4c0519', bottom: '#1a000a' },
  { id: 'ocean',    label: 'Ocean',    top: '#0c4a6e', middle: '#082f49', bottom: '#020f18' },
  { id: 'midnight', label: 'Midnight', top: '#0f1729', middle: '#080f1f', bottom: '#040810' },
  { id: 'sunset',   label: 'Sunset',   top: '#7c2d12', middle: '#431407', bottom: '#150500' },
  { id: 'forest',   label: 'Forest',   top: '#14532d', middle: '#052e16', bottom: '#010e07' },
  { id: 'rainbow',  label: 'Gay',  top: '#ff0000', middle: '#00ff00', bottom: '#0000ff' }
]

// ── Wallpaper presets ─────────────────────────────────────────────────────────

export interface WallpaperPreset {
  id: string
  label: string
  url: string
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  { id: 'none', label: 'None', url: '' },
  { id: 'w1', label: '', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0001.jpg?w=1920&q=80&auto=format&fit=crop' },
  { id: 'w2', label: '', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0002.jpg?w=1920&q=80&auto=format&fit=crop' },
  { id: 'w3', label: '', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0011.jpg?w=1920&q=80&auto=format&fit=crop' },
  { id: 'w4', label: '', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0013.jpg?w=1920&q=80&auto=format&fit=crop' },
  { id: 'w5', label: '', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0016.jpg?w=1920&q=80&auto=format&fit=crop' },
  { id: 'w6', label: '', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0017.jpg?w=1920&q=80&auto=format&fit=crop' },
  { id: 'w7', label: '', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0021.jpg?w=1920&q=80&auto=format&fit=crop' },
  { id: 'w8', label: '', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0022.jpg?w=1920&q=80&auto=format&fit=crop' },
]

// ── Search engines ────────────────────────────────────────────────────────────

export interface SearchEngine {
  id: string
  label: string
  url: string // {q} will be replaced with the search term
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google',     label: 'Google',     url: 'https://www.google.com/search?q={q}' },
  { id: 'bing',       label: 'Bing',       url: 'https://www.bing.com/search?q={q}' },
  { id: 'duckduckgo', label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={q}' },
  { id: 'brave',      label: 'Brave',      url: 'https://search.brave.com/search?q={q}' },
  { id: 'perplexity', label: 'Perplexity', url: 'https://www.perplexity.ai/search?q={q}' },
]
