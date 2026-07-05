import { create } from 'zustand'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  const stored = localStorage.getItem('doku:theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface UiState {
  theme: Theme
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  toggleTheme: () => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set, get) => ({
  theme: getInitialTheme(),
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('doku:theme', next)
    set({ theme: next })
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open: boolean) => set({ commandPaletteOpen: open }),
}))
