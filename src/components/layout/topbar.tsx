import { Moon, Sun, PanelLeft, Lock } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'

export function Topbar() {
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const lock = useAuthStore((s) => s.lock)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} title="Sidebar umschalten">
        <PanelLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Dark Mode umschalten">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={lock} title="Sperren">
          <Lock className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
