import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-2xl font-semibold">Seite nicht gefunden</h1>
      <p className="text-sm text-muted-foreground">Die angeforderte Seite existiert nicht.</p>
      <Button asChild>
        <Link to="/">Zurück zum Dashboard</Link>
      </Button>
    </div>
  )
}
