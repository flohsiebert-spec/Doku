import { useState, type FormEvent } from 'react'
import { ShieldCheck, Lock } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function UnlockScreen() {
  const hasMaster = useAuthStore((s) => s.hasMaster)
  const error = useAuthStore((s) => s.error)
  const setup = useAuthStore((s) => s.setup)
  const unlock = useAuthStore((s) => s.unlock)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (hasMaster) {
        await unlock(password)
      } else {
        if (password !== confirm) {
          useAuthStore.setState({ error: 'Passwörter stimmen nicht überein.' })
          return
        }
        await setup(password)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {hasMaster ? <Lock className="h-6 w-6" /> : <ShieldCheck className="h-6 w-6" />}
          </div>
          <CardTitle className="text-xl">IT-Doku</CardTitle>
          <CardDescription>
            {hasMaster
              ? 'Gib dein Master-Passwort ein, um die Dokumentation zu entsperren.'
              : 'Lege ein Master-Passwort fest, um deine Zugangsdaten zu verschlüsseln.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Master-Passwort</Label>
              <Input
                id="password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            {!hasMaster && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm">Passwort bestätigen</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            {!hasMaster && (
              <p className="text-xs text-muted-foreground">
                Achtung: Dieses Passwort kann nicht wiederhergestellt werden. Bei Verlust sind
                gespeicherte Zugangsdaten nicht mehr entschlüsselbar.
              </p>
            )}
            <Button type="submit" disabled={submitting} className="mt-2">
              {hasMaster ? 'Entsperren' : 'Master-Passwort festlegen'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
