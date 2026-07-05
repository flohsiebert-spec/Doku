import { useState } from 'react'
import { RefreshCw, Wand2 } from 'lucide-react'
import { generatePassword } from '@/crypto/crypto'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'

interface PasswordGeneratorPopoverProps {
  onGenerate: (password: string) => void
}

export function PasswordGeneratorPopover({ onGenerate }: PasswordGeneratorPopoverProps) {
  const [length, setLength] = useState(20)
  const [uppercase, setUppercase] = useState(true)
  const [lowercase, setLowercase] = useState(true)
  const [numbers, setNumbers] = useState(true)
  const [symbols, setSymbols] = useState(true)
  const [preview, setPreview] = useState('')

  function regenerate() {
    const pw = generatePassword({ length, uppercase, lowercase, numbers, symbols })
    setPreview(pw)
    return pw
  }

  return (
    <Popover
      onOpenChange={(open) => {
        if (open) regenerate()
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="icon" title="Passwort generieren">
          <Wand2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Input readOnly value={preview} className="font-mono text-sm" />
          <Button type="button" variant="outline" size="icon" onClick={regenerate}>
            <RefreshCw className="size-4" />
          </Button>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="pw-length">Länge: {length}</Label>
          </div>
          <input
            id="pw-length"
            type="range"
            min={8}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={uppercase} onCheckedChange={setUppercase} /> Großbuchstaben
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={lowercase} onCheckedChange={setLowercase} /> Kleinbuchstaben
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={numbers} onCheckedChange={setNumbers} /> Zahlen
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={symbols} onCheckedChange={setSymbols} /> Sonderzeichen
          </label>
        </div>
        <Button type="button" className="w-full" onClick={() => onGenerate(preview || regenerate())}>
          Übernehmen
        </Button>
      </PopoverContent>
    </Popover>
  )
}
