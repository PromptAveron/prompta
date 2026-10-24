'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { EmptyState, PageHeader } from '@/components/site/page-header'
import { Pagination } from '@/components/site/pagination'
import { PromptGrid } from '@/components/site/prompt-card'
import { SearchBox } from '@/components/site/search-box'
import { createPublicClient } from '@/lib/supabase/public'
import type { Category, PromptCardData } from '@/lib/types'

const PAGE_SIZE = 24
const SORTS = ['relevance', 'newest', 'oldest', 'title'] as const
type Sort = (typeof SORTS)[number]
type SearchRow = PromptCardData & { total_count: number }

export default function SearchPage() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [tag, setTag] = useState('')
  const [sort, setSort] = useState<Sort>('newest')
  const [page, setPage] = useState(1)
  const [categories, setCategories] = useState<Category[]>([])
  const [popularCategories, setPopularCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<{ tag: string; prompt_count: number }[]>([])
  const [items, setItems] = useState<PromptCardData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const filtered = Boolean(q || category || tag)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const query = (params.get('q') ?? '').trim().slice(0, 100)
    const categorySlug = (params.get('category') ?? '').trim().slice(0, 80)
    const searchTag = (params.get('tag') ?? '').trim().toLowerCase().slice(0, 60)
    const requestedSort = params.get('sort') as Sort | null
    const pageNumber = Math.max(Number.parseInt(params.get('page') ?? '1', 10) || 1, 1)
    setQ(query)
    setCategory(categorySlug)
    setTag(searchTag)
    setSort(SORTS.includes(requestedSort as Sort) ? requestedSort as Sort : query ? 'relevance' : 'newest')
    setPage(pageNumber)

    const client = createPublicClient()
    Promise.all([
      client.from('categories').select('*').order('sort_order').order('name'),
      client.rpc('category_prompt_counts'),
      client.rpc('list_tags', { p_limit: 16 }),
    ]).then(([categoryResult, countsResult, tagsResult]) => {
      if (categoryResult.error || countsResult.error || tagsResult.error) {
        setError('Search filters could not be loaded. Please refresh and try again.')
        return
      }
      const countRows = (countsResult.data ?? []) as { category_id: string; prompt_count: number }[]
      const counts = new Map<string, number>(countRows.map((row) => [row.category_id, Number(row.prompt_count)]))
      const allCategories = (categoryResult.data ?? []) as Category[]
      setCategories(allCategories)
      setPopularCategories(allCategories.filter((item) => (counts.get(item.id) ?? 0) > 0))
      setTags((tagsResult.data ?? []) as { tag: string; prompt_count: number }[])
    })
  }, [])

  useEffect(() => {
    if (!filtered) return
    let active = true
    setLoading(true)
    setError('')
    createPublicClient().rpc('search_prompts', {
      p_q: q || null,
      p_category: category || null,
      p_tag: tag || null,
      p_sort: sort,
      p_limit: PAGE_SIZE,
      p_offset: (page - 1) * PAGE_SIZE,
    }).then(({ data, error: requestError }) => {
      if (!active) return
      if (requestError) {
        setError('Search is unavailable right now. Please try again.')
        setItems([])
        setTotal(0)
        setLoading(false)
        return
      }
      const rows = (data ?? []) as SearchRow[]
      setItems(rows.map(({ total_count: _total, ...item }) => item))
      setTotal(rows.length ? Number(rows[0].total_count) : 0)
      setLoading(false)
    }, () => {
      if (!active) return
      setError('Search is unavailable right now. Please check your connection and try again.')
      setItems([])
      setTotal(0)
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [q, category, tag, sort, page, filtered])

  function hrefFor(nextPage: number) {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (category) params.set('category', category)
    if (tag) params.set('tag', tag)
    if (sort !== (q ? 'relevance' : 'newest')) params.set('sort', sort)
    if (nextPage > 1) params.set('page', String(nextPage))
    return `/search?${params}`
  }

  const selectClass = 'h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30'
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  return (
    <>
      <PageHeader
        title={q ? `Results for "${q}"` : 'Search prompts'}
        description="Search by subject, style, mood or tag."
        crumbs={[{ name: 'Home', path: '/' }, { name: 'Search', path: '/search' }]}
      >
        <SearchBox variant="hero" defaultValue={q} className="mt-8 max-w-2xl" />
      </PageHeader>
      <div className="container-page py-10">
        <form action={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/search`} method="get" className="mb-8 grid items-end gap-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <input type="hidden" name="q" value={q} />
          <div><label htmlFor="filter-category" className="mb-1.5 block text-sm font-medium">Category</label><select id="filter-category" name="category" defaultValue={category} className={selectClass}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></div>
          <div><label htmlFor="filter-tag" className="mb-1.5 block text-sm font-medium">Tag</label><input id="filter-tag" name="tag" defaultValue={tag} maxLength={60} placeholder="Any tag" className={selectClass} /></div>
          <div><label htmlFor="filter-sort" className="mb-1.5 block text-sm font-medium">Sort by</label><select id="filter-sort" name="sort" defaultValue={sort} className={selectClass}>{q ? <option value="relevance">Relevance</option> : null}<option value="newest">Newest</option><option value="oldest">Oldest</option><option value="title">Title A to Z</option></select></div>
          <button type="submit" className="h-10 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Apply</button>
        </form>
        {!filtered ? (
          <div className="space-y-10">
            <p className="text-muted-foreground">Enter a search above, or start from a category or tag.</p>
            {popularCategories.length ? <section><h2 className="eyebrow mb-3">Categories</h2><ul className="flex flex-wrap gap-2">{popularCategories.map((item) => <li key={item.id}><Link href={`/search?category=${item.slug}`} className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm hover:bg-muted">{item.name}</Link></li>)}</ul></section> : null}
            {tags.length ? <section><h2 className="eyebrow mb-3">Popular tags</h2><ul className="flex flex-wrap gap-2">{tags.map((item) => <li key={item.tag}><Link href={`/search?tag=${encodeURIComponent(item.tag)}`} className="inline-flex h-9 items-center rounded-full border border-border bg-card px-4 text-sm hover:bg-muted">{item.tag}</Link></li>)}</ul></section> : null}
          </div>
        ) : error ? <EmptyState title="Search unavailable">{error}</EmptyState> : loading ? <p className="py-8 text-sm text-muted-foreground" role="status">Searching…</p> : items.length ? (
          <>
            <p className="mb-6 text-sm text-muted-foreground" role="status">{total} {total === 1 ? 'result' : 'results'}{tag ? ` tagged "${tag}"` : ''}</p>
            <PromptGrid prompts={items} />
            <Pagination page={Math.min(page, pages)} totalPages={pages} hrefFor={hrefFor} />
          </>
        ) : <EmptyState title="No prompts matched your search"><p>Try fewer words, a different spelling, or clear the filters.</p><p className="mt-4"><Link href="/prompts" className="font-medium text-brand hover:underline">Explore all prompts</Link></p></EmptyState>}
      </div>
    </>
  )
}
