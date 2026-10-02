import { type WallpaperPreset, WALLPAPER_PRESETS } from '../Schema'

export const GITHUB_REPO = 'dorukaysor/anchor'
export const GITHUB_BRANCH = 'main'
export const GITHUB_PATHS = [
  'wallpapers',
  'assets/wallpapers',
  'anchor/wallpapers',
  'anchor/assets/wallpapers',
]
const CACHE_KEY = 'anchor_github_wallpapers_cache'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

interface CachedWallpapers {
  timestamp: number
  presets: WallpaperPreset[]
}

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

export const LEGACY_WALLPAPER_MAP: Record<string, string> = {
  w1: '0001.jpg',
  w2: '0002.jpg',
  w3: '0011.jpg',
  w4: '0013.jpg',
  w5: '0016.jpg',
  w6: '0017.jpg',
  w7: '0021.jpg',
  w8: '0022.jpg',
}

export function formatWallpaperName(filename: string): string {
  const base = filename.replace(/\.[^/.]+$/, '')
  // If pure digits like "0001" or "0014"
  if (/^\d+$/.test(base)) {
    return `Wallpaper ${parseInt(base, 10)}`
  }
  const spaced = base.replace(/[-_]+/g, ' ').trim()
  return spaced
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

export function resolveWallpaperUrl(presetId: string, available: WallpaperPreset[] = []): string {
  if (!presetId || presetId === 'none') return ''
  const targetId = LEGACY_WALLPAPER_MAP[presetId] ?? presetId

  const found =
    available.find(w => w.id === targetId || w.id === presetId || w.id === `gh-${targetId}` || w.url.includes(targetId)) ??
    WALLPAPER_PRESETS.find(w => w.id === targetId || w.id === presetId || w.url.includes(targetId))

  return found?.url ?? ''
}

/**
 * Fetches the complete list of wallpapers dynamically from GitHub `dorukaysor/anchor`.
 * 1. Checks localStorage cache (unless forceRefresh is true).
 * 2. Queries GitHub Contents API for directory files (without custom headers to avoid CORS preflight failures).
 * 3. If rate-limited (403) or offline, falls back to built-in presets and probes raw CDN for new sequential uploads.
 */
export async function fetchGitHubWallpapers(forceRefresh = false): Promise<WallpaperPreset[]> {
  // 1. Check local cache first (unless forceRefresh is requested)
  if (!forceRefresh) {
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY)
      if (cachedRaw) {
        const cached: CachedWallpapers = JSON.parse(cachedRaw)
        if (
          Date.now() - cached.timestamp < CACHE_TTL_MS &&
          Array.isArray(cached.presets) &&
          cached.presets.length > 1
        ) {
          return cached.presets
        }
      }
    } catch {
      // Ignore cache parse errors
    }
  }

  // 2. Query GitHub Contents API
  for (const path of GITHUB_PATHS) {
    try {
      const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`
      // Omit custom Accept header so the browser sends a CORS simple GET request
      const res = await fetch(apiUrl)

      if (res.status === 403) {
        console.warn('[Anchor] GitHub API unauthenticated rate limit reached (60 req/hr). Falling back to CDN probe.')
        break
      }

      if (!res.ok) {
        continue // Try next path if 404
      }

      const files = await res.json()
      if (!Array.isArray(files)) {
        continue
      }

      // Filter for image/gif files
      const validFiles = files.filter(f => {
        if (f.type !== 'file') return false
        const ext = '.' + f.name.split('.').pop()?.toLowerCase()
        return SUPPORTED_EXTENSIONS.has(ext)
      })

      if (validFiles.length === 0) {
        continue
      }

      // Sort files naturally (0001, 0002 ... 0010, 0025, etc.)
      validFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

      // Build presets
      const githubPresets: WallpaperPreset[] = [
        { id: 'none', label: 'None', url: '' },
        ...validFiles.map(f => {
          const rawUrl =
            f.download_url ||
            `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}/${encodeURIComponent(f.name)}`
          return {
            id: f.name,
            label: formatWallpaperName(f.name),
            url: rawUrl,
          }
        }),
      ]

      // Save to localStorage cache
      try {
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            presets: githubPresets,
          } satisfies CachedWallpapers)
        )
      } catch {
        // LocalStorage full or blocked
      }

      return githubPresets
    } catch (err) {
      console.warn(`[Anchor] Failed to fetch wallpapers from ${path}:`, err)
    }
  }

  // 3. Resilient Fallback: Start with known presets and probe sequential raw URLs for any additions
  const presets: WallpaperPreset[] = [...WALLPAPER_PRESETS]
  const knownIds = new Set(presets.map(p => p.id))

  // Find highest numbered preset currently known (e.g. 25)
  let highestNum = 0
  for (const p of presets) {
    const m = p.id.match(/^(\d+)\./)
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > highestNum) highestNum = n
    }
  }

  // Probe sequential numbers on raw.githubusercontent.com (which has NO rate limits)
  let probeNum = highestNum + 1
  while (probeNum <= highestNum + 20) {
    const padded = String(probeNum).padStart(4, '0')
    const filename = `${padded}.jpg`
    if (knownIds.has(filename)) {
      probeNum++
      continue
    }

    const testUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/wallpapers/${filename}`
    try {
      const probeRes = await fetch(testUrl, { method: 'HEAD' })
      if (probeRes.ok) {
        presets.push({
          id: filename,
          label: `Wallpaper ${probeNum}`,
          url: testUrl,
        })
        knownIds.add(filename)
        probeNum++
      } else {
        break // Stop at first missing number
      }
    } catch {
      break
    }
  }

  // Cache resilient presets
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        presets,
      } satisfies CachedWallpapers)
    )
  } catch {
    // Ignore
  }

  return presets
}
