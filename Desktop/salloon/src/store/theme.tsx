import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'light' | 'dark'

const Ctx = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void } | null>(null)

function initial(): Theme {
  const saved = localStorage.getItem('salloon.theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    localStorage.setItem('salloon.theme', theme)
  }, [theme])

  return (
    <Ctx.Provider
      value={{
        theme,
        toggle: () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
        setTheme: setThemeState,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ThemeProvider missing')
  return ctx
}
