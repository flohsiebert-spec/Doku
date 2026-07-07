import { Moon, Sun, PanelLeft, LogOut } from 'lucide-react'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { USER_ROLES } from '@/types'

export function Topbar() {
  const theme = useUiStore((s) => s.theme)
  const toggleTheme = useUiStore((s) => s.toggleTheme)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const logout = useAuthStore((s) => s.logout)
  const currentUser = useAuthStore((s) => s.currentUser)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} title="Sidebar umschalten">
        <PanelLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-3">
        {currentUser && (
          <div className="flex items-center gap-2 text-sm">
            <span>{currentUser.displayName}</span>
            <Badge variant="outline">{USER_ROLES.find((r) => r.value === currentUser.role)?.label}</Badge>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Dark Mode umschalten">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={logout} title="Abmelden">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
