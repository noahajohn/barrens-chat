import { Sun, Moon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { useTheme } from './ThemeProvider'

export const ThemeToggle = () => {
  const { isDark, setTheme } = useTheme()

  return (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'Switch to Day mode' : 'Switch to Night mode'}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
