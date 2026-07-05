import { Lock, Monitor, Moon, Sun, User } from 'lucide-react'
import { useUIStore } from '@/store/useUIStore'
import { useAuthStore } from '@/store/useAuthStore'
import { GlobalSearch } from './global-search'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const THEME_ICONS = { light: Sun, dark: Moon, system: Monitor }

export function TopBar() {
  const theme = useUIStore((s) => s.theme)
  const setTheme = useUIStore((s) => s.setTheme)
  const technicianName = useUIStore((s) => s.technicianName)
  const setTechnicianName = useUIStore((s) => s.setTechnicianName)
  const lock = useAuthStore((s) => s.lock)

  const ThemeIcon = THEME_ICONS[theme]

  return (
    <TooltipProvider delayDuration={300}>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
        <GlobalSearch />
        <div className="flex-1" />

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5">
              <User className="size-4 text-muted-foreground" />
              <Input
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="Angemeldet als…"
                className="h-8 w-40"
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>Ihr Name für Änderungs-/Aktivitätsprotokolle</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Design wählen">
              <ThemeIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="size-4" /> Hell
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="size-4" /> Dunkel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="size-4" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={lock} aria-label="Sperren">
              <Lock className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sperren</TooltipContent>
        </Tooltip>
      </header>
    </TooltipProvider>
  )
}
