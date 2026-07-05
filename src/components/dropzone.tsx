import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropzoneProps {
  onFiles: (files: File[]) => void
  accept?: Record<string, string[]>
  multiple?: boolean
  label?: string
}

export function Dropzone({ onFiles, accept, multiple = true, label }: DropzoneProps) {
  const onDrop = useCallback((accepted: File[]) => onFiles(accepted), [onFiles])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors',
        isDragActive && 'border-primary bg-primary/5',
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {label ?? 'Dateien hierher ziehen oder klicken zum Auswählen'}
      </p>
    </div>
  )
}
