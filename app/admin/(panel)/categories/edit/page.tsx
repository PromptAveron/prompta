'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { CategoryForm } from '@/components/admin/category-form'
import { DeleteButton } from '@/components/admin/delete-button'
import { deleteCategoryAction } from '@/lib/admin/actions'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/lib/types'

export default function EditCategoryPage() {
  const [category, setCategory] = useState<Category | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const id = new URLSearchParams(window.location.search).get('id')
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      setError('A valid category ID is required.')
      return () => { active = false }
    }
    createClient().from('categories').select('*').eq('id', id).maybeSingle().then(({ data, error: requestError }) => {
      if (!active) return
      if (requestError) {
        setError('Could not load this category. Check your admin access and refresh.')
        return
      }
      if (!data) {
        setError('This category no longer exists.')
        return
      }
      setCategory(data as Category)
    })
    return () => { active = false }
  }, [])

  return (
    <>
      <AdminHeader title="Edit category" />
      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      {category ? (
        <>
          <CategoryForm key={category.updated_at} category={category} />
          <div className="mt-10 max-w-2xl border-t border-border pt-6">
            <DeleteButton action={deleteCategoryAction} id={category.id} label="Delete category" warning="A category that still contains prompts cannot be deleted. Move or delete its prompts first." />
          </div>
        </>
      ) : null}
    </>
  )
}
