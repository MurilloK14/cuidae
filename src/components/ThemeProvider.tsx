'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Inicializa tema a partir do localStorage ou preferência do sistema
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cuidae_theme') as Theme | null
      const initialTheme = saved || 'light'
      setThemeState(initialTheme)

      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const active = initialTheme === 'system' ? (systemDark ? 'dark' : 'light') : initialTheme

      setResolvedTheme(active)
      if (active === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch (_) {
      // ignore
    }
    setMounted(true)
  }, [])

  const applyTheme = (newTheme: Theme) => {
    try {
      localStorage.setItem('cuidae_theme', newTheme)
    } catch (_) {}

    setThemeState(newTheme)

    const systemDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    const active = newTheme === 'system' ? (systemDark ? 'dark' : 'light') : newTheme

    setResolvedTheme(active)

    if (active === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const toggleTheme = () => {
    const next = resolvedTheme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
  }

  const setTheme = (t: Theme) => {
    applyTheme(t)
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    // Fallback gracioso se usado fora do provider
    return {
      theme: 'light' as Theme,
      resolvedTheme: 'light' as 'light' | 'dark',
      toggleTheme: () => {},
      setTheme: () => {},
    }
  }
  return context
}
