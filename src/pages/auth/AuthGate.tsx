import { useState, type FormEvent, type ReactNode } from 'react'
import { ShieldCheck, LogIn, ArrowRightLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function AuthShell({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
          <CardTitle className="text-xl">IT-Doku</CardTitle>
          <CardDescription>{description}</CardDescription>
          <p className="sr-only">{title}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}

function SetupScreen() {
  const createFirstAdmin = useAuthStore((s) => s.createFirstAdmin)
  const error = useAuthStore((s) => s.error)
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      useAuthStore.setState({ error: 'Passwörter stimmen nicht überein.' })
      return
    }
    setSubmitting(true)
    try {
      await createFirstAdmin(username.trim(), displayName.trim(), password)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      icon={<ShieldCheck className="h-6 w-6" />}
      title="Einrichtung"
      description="Lege den ersten Administrator-Account an. Alle Zugangsdaten werden mit diesem Konto verschlüsselt."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-username">Benutzername</Label>
          <Input id="setup-username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-displayname">Anzeigename</Label>
          <Input id="setup-displayname" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={username} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-password">Passwort</Label>
          <Input id="setup-password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-confirm">Passwort bestätigen</Label>
          <Input id="setup-confirm" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">
          Achtung: Dieses Passwort kann nicht wiederhergestellt werden. Bei Verlust (ohne weiteren
          Admin-Account) sind gespeicherte Zugangsdaten nicht mehr entschlüsselbar.
        </p>
        <Button type="submit" disabled={submitting} className="mt-2">
          Administrator anlegen
        </Button>
      </form>
    </AuthShell>
  )
}

function MigrationScreen() {
  const migrateAndCreateFirstAdmin = useAuthStore((s) => s.migrateAndCreateFirstAdmin)
  const error = useAuthStore((s) => s.error)
  const [legacyPassword, setLegacyPassword] = useState('')
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await migrateAndCreateFirstAdmin(legacyPassword, username.trim(), displayName.trim(), password)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      icon={<ArrowRightLeft className="h-6 w-6" />}
      title="Migration"
      description="Es wurde ein bestehendes Master-Passwort gefunden. Diese Version nutzt stattdessen Benutzerkonten mit Rollen. Richte deinen ersten Admin-Account ein, um fortzufahren."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="legacy-password">Bisheriges Master-Passwort</Label>
          <Input
            id="legacy-password"
            type="password"
            autoFocus
            value={legacyPassword}
            onChange={(e) => setLegacyPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mig-username">Neuer Benutzername (Admin)</Label>
          <Input id="mig-username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mig-displayname">Anzeigename</Label>
          <Input id="mig-displayname" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={username} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="mig-password">Neues Passwort</Label>
          <Input id="mig-password" type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="mt-2">
          Migrieren &amp; Admin anlegen
        </Button>
      </form>
    </AuthShell>
  )
}

function LoginScreen() {
  const login = useAuthStore((s) => s.login)
  const error = useAuthStore((s) => s.error)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(username.trim(), password)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell icon={<LogIn className="h-6 w-6" />} title="Anmelden" description="Melde dich mit deinem Benutzerkonto an.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-username">Benutzername</Label>
          <Input id="login-username" autoFocus value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-password">Passwort</Label>
          <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting} className="mt-2">
          Anmelden
        </Button>
      </form>
    </AuthShell>
  )
}

export function AuthGate() {
  const needsSetup = useAuthStore((s) => s.needsSetup)
  const needsMigration = useAuthStore((s) => s.needsMigration)

  if (needsMigration) return <MigrationScreen />
  if (needsSetup) return <SetupScreen />
  return <LoginScreen />
}
