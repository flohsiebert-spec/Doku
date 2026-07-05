import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function MasterPasswordGate({ children }: { children: ReactNode }) {
  const { initialized, hasMasterPassword, unlocked, error, init, setup, unlock } = useAuthStore()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    void init()
  }, [init])

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Wird geladen…</p>
      </div>
    )
  }

  if (unlocked) return <>{children}</>

  const isSetup = !hasMasterPassword

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (isSetup) {
        if (password.length < 8) {
          useAuthStore.setState({ error: 'Das Master-Passwort muss mindestens 8 Zeichen lang sein.' })
          return
        }
        if (password !== confirm) {
          useAuthStore.setState({ error: 'Die Passwörter stimmen nicht überein.' })
          return
        }
        await setup(password)
      } else {
        await unlock(password)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-primary/10">
            {isSetup ? (
              <ShieldCheck className="size-6 text-primary" />
            ) : (
              <Lock className="size-6 text-primary" />
            )}
          </div>
          <CardTitle className="text-lg">
            {isSetup ? 'Master-Passwort einrichten' : 'Entsperren'}
          </CardTitle>
          <CardDescription>
            {isSetup
              ? 'Dieses Passwort verschlüsselt alle Zugangsdaten lokal in Ihrem Browser. Es wird nirgendwo gespeichert – bei Verlust sind Zugangsdaten nicht wiederherstellbar.'
              : 'Bitte geben Sie Ihr Master-Passwort ein, um die Zugangsdaten zu entschlüsseln.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="master-password">Master-Passwort</Label>
              <Input
                id="master-password"
                type="password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {isSetup && (
              <div className="space-y-1.5">
                <Label htmlFor="master-password-confirm">Passwort bestätigen</Label>
                <Input
                  id="master-password-confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {isSetup ? 'Einrichten & starten' : 'Entsperren'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
