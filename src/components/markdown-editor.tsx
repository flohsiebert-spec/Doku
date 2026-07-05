import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

export function MarkdownEditor({ value, onChange, rows = 10, placeholder }: MarkdownEditorProps) {
  return (
    <Tabs defaultValue="edit">
      <TabsList>
        <TabsTrigger value="edit">Bearbeiten</TabsTrigger>
        <TabsTrigger value="preview">Vorschau</TabsTrigger>
      </TabsList>
      <TabsContent value="edit">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder ?? 'Markdown unterstützt: **fett**, - Listen, - [ ] Aufgaben, ```code```…'}
          className="font-mono text-sm"
        />
      </TabsContent>
      <TabsContent value="preview">
        <div className="prose prose-sm dark:prose-invert min-h-32 max-w-none rounded-md border border-input bg-background p-3">
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <p className="text-sm text-muted-foreground">Keine Vorschau verfügbar.</p>
          )}
        </div>
      </TabsContent>
    </Tabs>
  )
}
