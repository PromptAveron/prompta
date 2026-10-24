'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { PromptForm } from '@/components/admin/prompt-form'
import { createClient } from '@/lib/supabase/client'

type CategoryOption = { id: string; name: string }

export default function NewPromptPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    createClient()
      .from('categories')
      .select('id,name')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error: requestError }) => {
        if (!active) return
        if (requestError) {
          setError('Could not load categories. Refresh and try again.')
          return
        }
        setCategories(data ?? [])
      })
    return () => { active = false }
  }, [])

  return (
    <>
      <AdminHeader title="New prompt" />
      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      {categories.length ? (
        <PromptForm categories={categories} />
      ) : !error ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground">
          Create a category first.{' '}
          <Link href="/admin/categories/new" className="font-medium text-brand hover:underline">Add a category</Link>.
        </p>
      ) : null}
    </>
  )
}
