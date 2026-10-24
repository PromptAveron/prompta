'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AdminHeader, adminButtonClass } from '@/components/admin/admin-header'
import { createClient } from '@/lib/supabase/client'

type RecentPrompt = { id: string; title: string; status: string; updated_at: string }

export default function AdminDashboard() {
  const [stats, setStats] = useState<number[] | null>(null)
  const [recent, setRecent] = useState<RecentPrompt[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      const supabase = createClient()
      const now = new Date().toISOString()
      const [total, live, drafts, categories, recentResult] = await Promise.all([
        supabase.from('prompts').select('id', { count: 'exact', head: true }),
        supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('status', 'published').lte('published_at', now),
        supabase.from('prompts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('prompts').select('id,title,status,updated_at').order('updated_at', { ascending: false }).limit(6),
      ])
      const failure = total.error || live.error || drafts.error || categories.error || recentResult.error
      if (failure) {
        if (active) setError('Could not load dashboard data. Please refresh and try again.')
        return
      }
      if (active) {
        setStats([total.count ?? 0, live.count ?? 0, drafts.count ?? 0, categories.count ?? 0])
        setRecent((recentResult.data ?? []) as RecentPrompt[])
      }
    }
    void load()
    return () => { active = false }
  }, [])

  const labels = ['Total prompts', 'Live', 'Drafts', 'Categories']
  return (
    <>
      <AdminHeader
        title="Dashboard"
        description="An overview of your prompt library."
        actions={<Link href="/admin/prompts/new" className={adminButtonClass}><Plus className="size-4" aria-hidden="true" />New prompt</Link>}
      />
      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {labels.map((label, index) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{stats?.[index] ?? '—'}</dd>
          </div>
        ))}
      </dl>
      <section aria-labelledby="recent-heading" className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-heading" className="text-base font-semibold">Recently edited</h2>
          <Link href="/admin/prompts" className="text-sm font-medium text-brand hover:underline">View all</Link>
        </div>
        {recent.length ? (
          <ul className="divide-y divide-border rounded-xl border border-border bg-card">
            {recent.map((prompt) => (
              <li key={prompt.id}>
                <Link href={`/admin/prompts/edit?id=${prompt.id}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-muted/50">
                  <span className="truncate font-medium">{prompt.title}</span>
                  <span className="flex shrink-0 items-center gap-3 text-muted-foreground">
                    <span className="capitalize">{prompt.status}</span>
                    <time dateTime={prompt.updated_at} className="hidden sm:inline">{new Date(prompt.updated_at).toLocaleDateString('en-US', { dateStyle: 'medium' })}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : stats && !error ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No prompts yet. Create your first one to get started.</p>
        ) : null}
      </section>
    </>
  )
}
