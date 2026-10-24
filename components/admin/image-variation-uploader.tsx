'use client'

import { ImageUp, Loader2, X } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PromptImageVariation } from '@/lib/types'

const ACCEPTED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}
const MAX_BYTES = 8 * 1024 * 1024

async function readDimensions(file: File): Promise<{ width: number; height: number } | null> {
  try {
    const bitmap = await createImageBitmap(file)
    const dimensions = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return dimensions
  } catch {
    return null
  }
}

export function ImageVariationUploader({
  value,
  onChange,
  error,
}: {
  value: PromptImageVariation[]
  onChange: (images: PromptImageVariation[]) => void
  error?: string
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setProblem(null)
    if (value.length >= 5) {
      setProblem('You can add up to 5 image variations.')
      return
    }
    if (!Object.hasOwn(ACCEPTED, file.type)) {
      setProblem('Use a JPEG, PNG, WebP or AVIF image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setProblem('Images must be 8 MB or smaller.')
      return
    }

    setBusy(true)
    try {
      const dimensions = await readDimensions(file)
      const path = `prompts/${crypto.randomUUID()}.${ACCEPTED[file.type]}`
      const supabase = createClient()
      const { error: uploadError } = await supabase.storage.from('prompt-images')
        .upload(path, file, { contentType: file.type, cacheControl: '31536000', upsert: false })
      if (uploadError) {
        setProblem('The upload failed. Check that you are signed in and try again.')
        return
      }
      const { data } = supabase.storage.from('prompt-images').getPublicUrl(path)
      onChange([
        ...value,
        {
          url: data.publicUrl,
          alt: '',
          width: dimensions?.width ?? null,
          height: dimensions?.height ?? null,
        },
      ])
    } catch {
      setProblem('The upload failed. Please try again.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const message = error || problem

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Add up to 5 alternate images to show different results or styles.</p>
      <ul className="space-y-3">
        {value.map((image, index) => (
          <li key={image.url} className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of an uploaded image */}
            <img src={image.url} alt="" className="size-20 shrink-0 rounded-md border border-border object-cover" />
            <div className="min-w-0 flex-1 space-y-2">
              <label htmlFor={`${id}-alt-${index}`} className="block text-xs font-medium">
                Image description (optional)
              </label>
              <input
                id={`${id}-alt-${index}`}
                value={image.alt}
                maxLength={300}
                onChange={(event) =>
                  onChange(value.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, alt: event.target.value } : item,
                  ))
                }
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
              <button
                type="button"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                className="inline-flex items-center gap-1 text-sm font-medium text-destructive hover:underline"
              >
                <X className="size-3.5" aria-hidden="true" />
                Remove variation
              </button>
            </div>
          </li>
        ))}
      </ul>
      {value.length < 5 ? (
        <div>
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept={Object.keys(ACCEPTED).join(',')}
            disabled={busy}
            onChange={(event) => handleFile(event.target.files?.[0])}
            className="sr-only"
          />
          <label
            htmlFor={id}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-input bg-card px-4 text-sm font-medium transition-colors hover:bg-muted has-[:focus-visible]:ring-2"
          >
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ImageUp className="size-4" aria-hidden="true" />}
            {busy ? 'Uploading' : `Add image variation (${value.length}/5)`}
          </label>
        </div>
      ) : null}
      {message ? <p role="alert" className="text-xs font-medium text-destructive">{message}</p> : null}
    </div>
  )
}
