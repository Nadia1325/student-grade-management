import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../../store/theme'
import { Button } from './Button'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const nextTheme = theme === 'dark' ? 'light' : 'dark'
  return (
    <Button
      tone="soft"
      className="h-10 w-10 rounded-full p-0"
      onClick={toggle}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === 'dark'}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  )
}
