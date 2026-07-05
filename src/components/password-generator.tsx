import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { generatePassword } from '@/lib/crypto'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface PasswordGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUse: (password: string) => void
}

export function PasswordGeneratorDialog({ open, onOpenChange, onUse }: PasswordGeneratorDialogProps) {
  const [length, setLength] = useState(20)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [password, setPassword] = useState(() =>
    generatePassword({ length: 20, uppercase: true, lowercase: true, numbers: true, symbols: true }),
  )

  function regenerate(opts?: Partial<{ length: number; uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }>) {
    const next = {
      length: opts?.length ?? length,
      uppercase: opts?.uppercase ?? uppercase,
      lowercase: opts?.lowercase ?? lowercase,
      numbers: opts?.numbers ?? numbers,
      symbols: opts?.symbols ?? symbols,
    }
    setPassword(generatePassword(next))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Passwortgenerator</DialogTitle>
          <DialogDescription>Erstelle ein sicheres, zufälliges Passwort.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input readOnly value={password} className="font-mono" />
            <Button type="button" variant="outline" size="icon" onClick={() => regenerate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>Länge: {length}</Label>
              <input
                type="range"
                min={8}
                max={64}
                value={length}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setLength(v)
                  regenerate({ length: v })
                }}
                className="w-40 accent-primary"
              />
            </div>
            {[
              { label: 'Großbuchstaben (A-Z)', value: uppercase, set: setUppercase, key: 'uppercase' as const },
              { label: 'Kleinbuchstaben (a-z)', value: lowercase, set: setLowercase, key: 'lowercase' as const },
              { label: 'Zahlen (0-9)', value: numbers, set: setNumbers, key: 'numbers' as const },
              { label: 'Sonderzeichen (!@#…)', value: symbols, set: setSymbols, key: 'symbols' as const },
            ].map((opt) => (
              <div key={opt.key} className="flex items-center justify-between">
                <Label>{opt.label}</Label>
                <Switch
                  checked={opt.value}
                  onCheckedChange={(v) => {
                    opt.set(v)
                    regenerate({ [opt.key]: v })
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() => {
              onUse(password)
              onOpenChange(false)
            }}
          >
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
