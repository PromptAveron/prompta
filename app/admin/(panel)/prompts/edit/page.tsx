'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AdminHeader, adminGhostButtonClass } from '@/components/admin/admin-header'
import { DeleteButton } from '@/components/admin/delete-button'
import { PromptForm } from '@/components/admin/prompt-form'
import { deletePromptAction } from '@/lib/admin/actions'
import { createClient } from '@/lib/supabase/client'
import type { PromptRecord } from '@/lib/types'

type CategoryOption = { id: string; name: string }

export default function EditPromptPage() {
  const [prompt, setPrompt] = useState<PromptRecord | null>(null)
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const params = new URLSearchParams(window.location.search)
    const id = params.get('id')
    if (params.get('created') === '1') setMessage('Prompt created.')
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      setError('A valid prompt ID is required.')
      return () => { active = false }
    }
    const supabase = createClient()
    Promise.all([
      supabase.from('prompts').select('*').eq('id', id).maybeSingle(),
      supabase.from('categories').select('id,name').order('sort_order').order('name'),
    ]).then(([promptResult, categoriesResult]) => {
      if (!active) return
      if (promptResult.error || categoriesResult.error) {
        setError('Could not load this prompt. Check your admin access and refresh.')
        return
      }
      if (!promptResult.data) {
        setError('This prompt no longer exists.')
        return
      }
      setPrompt(promptResult.data as PromptRecord)
      setCategories(categoriesResult.data ?? [])
    })
    return () => { active = false }
  }, [])

  const live = prompt?.status === 'published' && prompt.published_at && new Date(prompt.published_at) <= new Date()
  return (
    <>
      <AdminHeader
        title="Edit prompt"
        description={message || undefined}
        actions={live ? (
          <Link href={`/prompts/${prompt.slug}`} target="_blank" rel="noopener" className={adminGhostButtonClass}>
            View live <ExternalLink className="size-4" aria-hidden="true" /><span className="sr-only">(opens in a new tab)</span>
          </Link>
        ) : null}
      />
      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      {prompt ? (
        <>
          <PromptForm key={prompt.updated_at} categories={categories} prompt={prompt} />
          <div className="mt-10 border-t border-border pt-6">
            <DeleteButton action={deletePromptAction} id={prompt.id} label="Delete prompt" warning="This permanently removes the prompt and its redirects. This cannot be undone." />
          </div>
        </>
      ) : null}
    </>
  )
}
