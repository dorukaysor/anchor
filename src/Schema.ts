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
  customWallpapers: z.array(z.string()).default([]),
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
    presetId: 'carbon',
    custom: { top: '#1c1c1c', middle: '#111111', bottom: '#080808' },
  },
  wallpaper: {
    presetId: '0021.jpg',
    opacityMode: 'visible',
  },
  customWallpapers: [],
  searchEngine: 'google',
  panelVisibility: 'pure-transparent',
  panelOpacity: 0.48,
  glassEnabled: true,
  bookmarkDisplay: 'title-url',
  labelColors: {
    activePage: '#FFFFFF',
    linkButton: '#262626',
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
      title: 'Developer',
      order: 0,
      links: [
        { id: 'link-gh', title: 'Developer: Doruk Aysor', url: 'https://github.com/dorukaysor/', order: 0 },
        { id: 'link-gh2', title: 'Repository: Anchor', url: 'https://github.com/dorukaysor/anchor', order: 1 },
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
    { id: 'todo-3', pageId: defaultPageId, text: 'Add a new Board', done: false, order: 2 },
    { id: 'todo-4', pageId: defaultPageId, text: 'Add/Remove a Todo task', done: false, order: 3 },
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
  { id: 'forest',   label: 'Forest',   top: '#14532d', middle: '#052e16', bottom: '#010e07' }
]

// ── Wallpaper presets ─────────────────────────────────────────────────────────

export interface WallpaperPreset {
  id: string
  label: string
  url: string
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  { id: 'none', label: 'None', url: '' },
  { id: '0001.jpg', label: 'Wallpaper 1', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0001.jpg' },
  { id: '0002.jpg', label: 'Wallpaper 2', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0002.jpg' },
  { id: '0003.jpg', label: 'Wallpaper 3', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0003.jpg' },
  { id: '0004.jpg', label: 'Wallpaper 4', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0004.jpg' },
  { id: '0005.jpg', label: 'Wallpaper 5', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0005.jpg' },
  { id: '0006.jpg', label: 'Wallpaper 6', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0006.jpg' },
  { id: '0007.jpg', label: 'Wallpaper 7', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0007.jpg' },
  { id: '0008.jpg', label: 'Wallpaper 8', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0008.jpg' },
  { id: '0009.jpg', label: 'Wallpaper 9', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0009.jpg' },
  { id: '0010.jpg', label: 'Wallpaper 10', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0010.jpg' },
  { id: '0011.jpg', label: 'Wallpaper 11', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0011.jpg' },
  { id: '0012.jpg', label: 'Wallpaper 12', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0012.jpg' },
  { id: '0013.jpg', label: 'Wallpaper 13', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0013.jpg' },
  { id: '0014.jpg', label: 'Wallpaper 14', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0014.jpg' },
  { id: '0015.jpg', label: 'Wallpaper 15', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0015.jpg' },
  { id: '0016.jpg', label: 'Wallpaper 16', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0016.jpg' },
  { id: '0017.jpg', label: 'Wallpaper 17', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0017.jpg' },
  { id: '0018.jpg', label: 'Wallpaper 18', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0018.jpg' },
  { id: '0019.jpg', label: 'Wallpaper 19', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0019.jpg' },
  { id: '0020.jpg', label: 'Wallpaper 20', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0020.jpg' },
  { id: '0021.jpg', label: 'Wallpaper 21', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0021.jpg' },
  { id: '0022.jpg', label: 'Wallpaper 22', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0022.jpg' },
  { id: '0023.jpg', label: 'Wallpaper 23', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0023.jpg' },
  { id: '0024.jpg', label: 'Wallpaper 24', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0024.jpg' },
  { id: '0025.jpg', label: 'Wallpaper 25', url: 'https://raw.githubusercontent.com/dorukaysor/anchor/main/wallpapers/0025.jpg' },
]

// ── Search engines ────────────────────────────────────────────────────────────

export interface SearchEngine {
  id: string
  label: string
  url: string
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'google',     label: 'Google',     url: 'https://www.google.com/search?q={q}' },
  { id: 'bing',       label: 'Bing',       url: 'https://www.bing.com/search?q={q}' },
  { id: 'duckduckgo', label: 'DuckDuckGo', url: 'https://duckduckgo.com/?q={q}' },
  { id: 'brave',      label: 'Brave',      url: 'https://search.brave.com/search?q={q}' },
  { id: 'perplexity', label: 'Perplexity', url: 'https://www.perplexity.ai/search?q={q}' },
]
