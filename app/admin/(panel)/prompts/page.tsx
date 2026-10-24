'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AdminHeader, adminButtonClass, adminGhostButtonClass } from '@/components/admin/admin-header'
import { inputClass } from '@/components/admin/field'
import { createClient } from '@/lib/supabase/client'

type Row = {
  id: string
  title: string
  slug: string
  status: 'draft' | 'published'
  featured: boolean
  published_at: string | null
  updated_at: string
  categories: { name: string } | { name: string }[] | null
}

const PER_PAGE = 20

export default function AdminPromptsPage() {
  const [query, setQuery] = useState({ q: '', status: '', page: 1 })
  const [term, setTerm] = useState('')
  const [status, setStatus] = useState('')
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const page = Math.max(Number.parseInt(params.get('page') ?? '1', 10) || 1, 1)
    const q = (params.get('q') ?? '').trim().replace(/[%_\\,()]/g, ' ').slice(0, 80).trim()
    const currentStatus = params.get('status') ?? ''
    setQuery({ q, status: currentStatus, page })
    setTerm(q)
    setStatus(currentStatus)
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      const supabase = createClient()
      let request = supabase
        .from('prompts')
        .select('id,title,slug,status,featured,published_at,updated_at,categories(name)', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range((query.page - 1) * PER_PAGE, query.page * PER_PAGE - 1)
      if (query.q) request = request.ilike('title', `%${query.q}%`)
      if (query.status === 'draft' || query.status === 'published') request = request.eq('status', query.status)
      const { data, count, error: requestError } = await request
      if (!active) return
      if (requestError) {
        setError('Could not load prompts. Check your admin access and refresh.')
        return
      }
      setError('')
      setRows((data ?? []) as unknown as Row[])
      setTotal(count ?? 0)
    }
    void load()
    return () => { active = false }
  }, [query])

  const pages = Math.max(Math.ceil(total / PER_PAGE), 1)
  function href(page: number) {
    const params = new URLSearchParams()
    if (query.q) params.set('q', query.q)
    if (query.status) params.set('status', query.status)
    if (page > 1) params.set('page', String(page))
    return `/admin/prompts${params.size ? `?${params}` : ''}`
  }

  return (
    <>
      <AdminHeader
        title="Prompts"
        description={`${total} ${total === 1 ? 'prompt' : 'prompts'}`}
        actions={<Link href="/admin/prompts/new" className={adminButtonClass}><Plus className="size-4" aria-hidden="true" />New prompt</Link>}
      />
      <form method="get" role="search" className="mb-4 flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">Search prompts by title</label>
        <input id="q" name="q" type="search" value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search by title" className={`${inputClass} max-w-xs`} />
        <label htmlFor="status" className="sr-only">Filter by status</label>
        <select id="status" name="status" value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClass} w-auto`}>
          <option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option>
        </select>
        <button type="submit" className={adminGhostButtonClass}>Filter</button>
      </form>
      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th scope="col" className="px-4 py-3 font-medium">Title</th><th scope="col" className="px-4 py-3 font-medium">Category</th><th scope="col" className="px-4 py-3 font-medium">Status</th><th scope="col" className="px-4 py-3 font-medium">Updated</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => {
                const category = Array.isArray(row.categories) ? row.categories[0] : row.categories
                const label = row.status === 'draft' ? 'Draft' : row.published_at && new Date(row.published_at) > new Date() ? 'Scheduled' : 'Published'
                return (
                  <tr key={row.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3"><Link href={`/admin/prompts/edit?id=${row.id}`} className="font-medium hover:text-brand hover:underline">{row.title}</Link>{row.featured ? <span className="ml-2 rounded bg-brand-soft px-1.5 py-0.5 text-[11px] font-medium text-accent-foreground">Featured</span> : null}</td>
                    <td className="px-4 py-3 text-muted-foreground">{category?.name ?? 'None'}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{label}</span></td>
                    <td className="px-4 py-3 text-muted-foreground"><time dateTime={row.updated_at}>{new Date(row.updated_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</time></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : !error ? <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">{query.q || query.status ? 'No prompts match those filters.' : 'No prompts yet. Create your first one.'}</p> : null}
      {pages > 1 ? (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          {query.page > 1 ? <Link href={href(query.page - 1)} className={adminGhostButtonClass}>Previous</Link> : <span />}
          <span className="text-muted-foreground">Page {query.page} of {pages}</span>
          {query.page < pages ? <Link href={href(query.page + 1)} className={adminGhostButtonClass}>Next</Link> : <span />}
        </nav>
      ) : null}
    </>
  )
}
