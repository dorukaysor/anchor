import { type WallpaperPreset, WALLPAPER_PRESETS } from '../Schema'

const GITHUB_REPO = 'dorukaysor/anchor'
const GITHUB_BRANCH = 'main'
const GITHUB_PATHS = ['assets/wallpapers', 'wallpapers']
const CACHE_KEY = 'anchor_github_wallpapers_cache'
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

interface CachedWallpapers {
  timestamp: number
  presets: WallpaperPreset[]
}

const SUPPORTED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'])

export function formatWallpaperName(filename: string): string {
  // Strip extension
  const base = filename.replace(/\.[^/.]+$/, '')
  // Replace dashes and underscores with spaces
  const spaced = base.replace(/[-_]+/g, ' ').trim()
  // Capitalize each word
  return spaced
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Fetches the list of wallpapers dynamically from the GitHub repository `dorukaysor/anchor`.
 * Checks `assets/wallpapers/` and `wallpapers/` on the `main` branch.
 * Caches results in localStorage for 15 minutes to avoid GitHub rate limits.
 */
export async function fetchGitHubWallpapers(forceRefresh = false): Promise<WallpaperPreset[]> {
  // 1. Check local cache first (unless forceRefresh is requested)
  if (!forceRefresh) {
    try {
      const cachedRaw = localStorage.getItem(CACHE_KEY)
      if (cachedRaw) {
        const cached: CachedWallpapers = JSON.parse(cachedRaw)
        if (Date.now() - cached.timestamp < CACHE_TTL_MS && Array.isArray(cached.presets) && cached.presets.length > 0) {
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
      const res = await fetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      })

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

      // Build presets
      const githubPresets: WallpaperPreset[] = [
        { id: 'none', label: 'None', url: '' },
        ...validFiles.map(f => {
          const rawUrl = f.download_url || `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}/${encodeURIComponent(f.name)}`
          return {
            id: `gh-${f.name}`,
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
    } catch {
      // Network failure, try next path or fall back
    }
  }

  // 3. Fallback: If repo is not yet created, return built-in defaults + any cached items
  try {
    const cachedRaw = localStorage.getItem(CACHE_KEY)
    if (cachedRaw) {
      const cached: CachedWallpapers = JSON.parse(cachedRaw)
      if (Array.isArray(cached.presets) && cached.presets.length > 0) {
        return cached.presets
      }
    }
  } catch {
    // Ignore
  }

  return WALLPAPER_PRESETS
}
