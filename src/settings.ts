import { books } from './vocabulary'
import type { Book } from './vocabulary'

export type ThemePreference = 'system' | 'light' | 'dark'

export interface Settings {
  schemaVersion: 1
  theme: ThemePreference
  books: Book[]
}

export const settingsStorageKey = 'ourlingo.settings.v1'
export const themePreferences: ThemePreference[] = ['system', 'light', 'dark']

export function defaultSettings(): Settings {
  return { schemaVersion: 1, theme: 'system', books: [...books] }
}

// Keeps known values, drops unknown books, and falls back to defaults so a
// damaged or older settings entry never hides the whole library.
export function normalizeSettings(value: unknown): Settings {
  const defaults = defaultSettings()
  if (!value || typeof value !== 'object') return defaults
  const saved = value as Partial<Record<keyof Settings, unknown>>
  const theme = themePreferences.includes(saved.theme as ThemePreference)
    ? (saved.theme as ThemePreference)
    : defaults.theme
  const savedBooks = Array.isArray(saved.books) ? saved.books : []
  const preferred = books.filter((book) => savedBooks.includes(book))
  return {
    schemaVersion: 1,
    theme,
    books: preferred.length ? preferred : defaults.books,
  }
}

export function loadSettings(): Settings {
  try {
    const saved = localStorage.getItem(settingsStorageKey)
    return normalizeSettings(saved ? JSON.parse(saved) : null)
  } catch {
    return defaultSettings()
  }
}

export function saveSettings(settings: Settings): boolean {
  try {
    localStorage.setItem(settingsStorageKey, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}

declare global {
  interface Window {
    // Provided by the Android app so system bar icons match the chosen theme.
    OurLingoAndroid?: { setDarkTheme(dark: boolean): void }
  }
}

const darkQuery = '(prefers-color-scheme: dark)'

export function resolveTheme(theme: ThemePreference): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return window.matchMedia?.(darkQuery).matches ? 'dark' : 'light'
}

export function applyTheme(theme: ThemePreference): void {
  const resolved = resolveTheme(theme)
  document.documentElement.dataset.theme = resolved
  window.OurLingoAndroid?.setDarkTheme(resolved === 'dark')
}

// Re-applies the system theme when the device appearance changes.
export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia?.(darkQuery)
  if (!query) return () => {}
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
