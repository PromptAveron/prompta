'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AdminHeader, adminButtonClass } from '@/components/admin/admin-header'
import { createClient } from '@/lib/supabase/client'

type CategoryRow = {
  id: string
  name: string
  slug: string
  sort_order: number
  prompts: { count: number }[] | null
}

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<CategoryRow[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    createClient()
      .from('categories')
      .select('id,name,slug,sort_order,prompts(count)')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data, error: requestError }) => {
        if (!active) return
        if (requestError) {
          setError('Could not load categories. Check your admin access and refresh.')
          return
        }
        setRows((data ?? []) as unknown as CategoryRow[])
      })
    return () => { active = false }
  }, [])

  return (
    <>
      <AdminHeader
        title="Categories"
        description={`${rows.length} ${rows.length === 1 ? 'category' : 'categories'}`}
        actions={<Link href="/admin/categories/new" className={adminButtonClass}><Plus className="size-4" aria-hidden="true" />New category</Link>}
      />
      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th scope="col" className="px-4 py-3 font-medium">Name</th><th scope="col" className="px-4 py-3 font-medium">Slug</th><th scope="col" className="px-4 py-3 font-medium">Prompts</th><th scope="col" className="px-4 py-3 font-medium">Order</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3"><Link href={`/admin/categories/edit?id=${row.id}`} className="font-medium hover:text-brand hover:underline">{row.name}</Link></td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.slug}</td>
                  <td className="px-4 py-3 tabular-nums">{row.prompts?.[0]?.count ?? 0}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{row.sort_order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : !error ? <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No categories yet.</p> : null}
    </>
  )
}
