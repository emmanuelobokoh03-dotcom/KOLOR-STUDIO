import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { settingsApi } from '../services/api'

interface BrandTheme {
  primaryColor: string
  accentColor: string
  fontFamily: string
  logoUrl: string | null
}

interface BrandThemeContextValue extends BrandTheme {
  refresh: () => Promise<void>
}

const CACHE_KEY = 'kolor_brand_theme'

const defaults: BrandTheme = {
  primaryColor: '#A855F7',
  accentColor: '#EC4899',
  fontFamily: 'Inter',
  logoUrl: null,
}

function loadCached(): BrandTheme {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      // Validate hex colors
      if (parsed.primaryColor && /^#[0-9A-Fa-f]{6}$/.test(parsed.primaryColor)) {
        return { ...defaults, ...parsed }
      }
    }
  } catch {}
  return defaults
}

function saveCache(theme: BrandTheme) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(theme))
  } catch {}
}

const BrandThemeContext = createContext<BrandThemeContextValue>({
  ...defaults,
  refresh: async () => {},
})

function hexToRGB(hex: string): [number, number, number] {
  const num = parseInt(hex.replace('#', ''), 16)
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
}

function adjustBrightness(hex: string, amt: number): string {
  const [r, g, b] = hexToRGB(hex)
  const nr = Math.min(255, Math.max(0, r + amt))
  const ng = Math.min(255, Math.max(0, g + amt))
  const nb = Math.min(255, Math.max(0, b + amt))
  return '#' + ((nr << 16) | (ng << 8) | nb).toString(16).padStart(6, '0')
}

function applyToDOM(theme: BrandTheme) {
  const root = document.documentElement
  const pDark = adjustBrightness(theme.primaryColor, -30)
  const pLight = adjustBrightness(theme.primaryColor, 40)
  const aDark = adjustBrightness(theme.accentColor, -30)
  const aLight = adjustBrightness(theme.accentColor, 40)

  // RGB channels for Tailwind opacity support
  root.style.setProperty('--color-brand-primary-rgb', hexToRGB(theme.primaryColor).join(' '))
  root.style.setProperty('--color-brand-primary-dark-rgb', hexToRGB(pDark).join(' '))
  root.style.setProperty('--color-brand-primary-light-rgb', hexToRGB(pLight).join(' '))
  root.style.setProperty('--color-brand-accent-rgb', hexToRGB(theme.accentColor).join(' '))
  root.style.setProperty('--color-brand-accent-dark-rgb', hexToRGB(aDark).join(' '))
  root.style.setProperty('--color-brand-accent-light-rgb', hexToRGB(aLight).join(' '))
  root.style.setProperty('--font-brand', theme.fontFamily)
}

export function BrandThemeProvider({ children }: { children: ReactNode }) {
  // Initialize from cache for instant render
  const [theme, setTheme] = useState<BrandTheme>(loadCached)

  const refresh = useCallback(async () => {
    const res = await settingsApi.getBrand()
    if (res.data?.brand) {
      const t: BrandTheme = {
        primaryColor: res.data.brand.primaryColor || defaults.primaryColor,
        accentColor: res.data.brand.accentColor || defaults.accentColor,
        fontFamily: res.data.brand.fontFamily || defaults.fontFamily,
        logoUrl: res.data.brand.logoUrl || null,
      }
      setTheme(t)
      applyToDOM(t)
      saveCache(t)
    }
  }, [])

  // Apply cached theme immediately on mount, then fetch from API
  useEffect(() => {
    const cached = loadCached()
    applyToDOM(cached)
    const token = localStorage.getItem('token')
    if (token) refresh()
  }, [refresh])

  return (
    <BrandThemeContext.Provider value={{ ...theme, refresh }}>
      {children}
    </BrandThemeContext.Provider>
  )
}

export function useBrandTheme() {
  return useContext(BrandThemeContext)
}
