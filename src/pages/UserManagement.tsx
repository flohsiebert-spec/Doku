import { useState, type FormEvent } from 'react'
import { Plus, ShieldAlert, Trash2, KeyRound, Users as UsersIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { canManageUsers } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from '@/store/toastStore'
import { formatDate } from '@/lib/utils'
import { USER_ROLES, type User, type UserRole } from '@/types'

export default function UserManagement() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const users = useAuthStore((s) => s.users)
  const createUser = useAuthStore((s) => s.createUser)
  const updateUserRole = useAuthStore((s) => s.updateUserRole)
  const resetUserPassword = useAuthStore((s) => s.resetUserPassword)
  const deleteUser = useAuthStore((s) => s.deleteUser)

  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ username: '', displayName: '', password: '', role: 'technician' as UserRole })
  const [resetTarget, setResetTarget] = useState<User | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)

  if (!canManageUsers(currentUser?.role)) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nur Administratoren können Benutzer verwalten.</p>
      </div>
    )
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault()
    const ok = await createUser(form.username.trim(), form.displayName.trim(), form.password, form.role)
    if (ok) {
      toast({ title: 'Benutzer angelegt', variant: 'success' })
      setForm({ username: '', displayName: '', password: '', role: 'technician' })
      setCreateOpen(false)
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault()
    if (!resetTarget) return
    await resetUserPassword(resetTarget.id, resetPassword)
    toast({ title: 'Passwort zurückgesetzt', variant: 'success' })
    setResetTarget(null)
    setResetPassword('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Benutzerverwaltung</h1>
          <p className="text-sm text-muted-foreground">Lokale Benutzerkonten mit Rollen.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Benutzer anlegen
        </Button>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
            <UsersIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Keine Benutzer gefunden.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => (
            <div key={u.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{u.displayName}</span>
                  <span className="text-xs text-muted-foreground">@{u.username}</span>
                  {u.id === currentUser?.id && <Badge variant="secondary">Du</Badge>}
                </div>
                <span className="text-xs text-muted-foreground">Angelegt: {formatDate(u.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Select value={u.role} onValueChange={(v) => updateUserRole(u.id, v as UserRole)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" title="Passwort zurücksetzen" onClick={() => setResetTarget(u)}>
                  <KeyRound className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="Benutzer löschen"
                  disabled={u.id === currentUser?.id}
                  onClick={() => setDeleteTarget(u)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neuer Benutzer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-username">Benutzername</Label>
              <Input
                id="user-username"
                autoFocus
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-displayname">Anzeigename</Label>
              <Input
                id="user-displayname"
                value={form.displayName}
                onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                placeholder={form.username}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user-password">Passwort</Label>
              <Input
                id="user-password"
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Rolle</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Anlegen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Passwort zurücksetzen für {resetTarget?.displayName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="reset-password">Neues Passwort</Label>
              <Input
                id="reset-password"
                type="password"
                autoFocus
                minLength={8}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">Zurücksetzen</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Benutzer löschen"
        description={`Der Benutzer "${deleteTarget?.displayName}" wird unwiderruflich gelöscht.`}
        onConfirm={async () => {
          if (!deleteTarget) return
          const ok = await deleteUser(deleteTarget.id)
          if (!ok) toast({ title: 'Löschen nicht möglich', description: 'Es muss mindestens ein Admin verbleiben.', variant: 'destructive' })
        }}
      />
    </div>
  )
}
