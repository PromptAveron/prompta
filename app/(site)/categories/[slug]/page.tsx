import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdSlot } from '@/components/site/ad-slot'
import { JsonLd } from '@/components/site/json-ld'
import { EmptyState, PageHeader } from '@/components/site/page-header'
import { PromptGrid } from '@/components/site/prompt-card'
import { getCategoryBySlug, getCategories, getPromptPage, getSettings } from '@/lib/data/public'
import { breadcrumbJsonLd, buildPageMetadata, collectionJsonLd } from '@/lib/seo'
import { getBaseUrl } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const categories = await getCategories()
  return categories.map(({ slug }) => ({ slug }))
}

async function resolve(slug: string) {
  return getCategoryBySlug(slug)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, settings] = await Promise.all([params, getSettings()])
  const category = await resolve(slug)
  if (!category) return { title: 'Category not found', robots: { index: false, follow: false } }
  return buildPageMetadata({
    title: category.seo_title || `${category.name} AI Image Prompts`,
    description: category.seo_description || category.description || `Browse curated ${category.name} prompts for AI image generation.`,
    path: `/categories/${category.slug}`,
    settings,
  })
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = await resolve(slug)
  if (!category) notFound()
  const [settings, { items, total }] = await Promise.all([getSettings(), getPromptPage(1, category.slug)])
  const baseUrl = getBaseUrl(settings)
  const path = `/categories/${category.slug}`
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: category.name, path },
  ]

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd(crumbs, baseUrl),
        collectionJsonLd({
          name: `${category.name} AI Image Prompts`,
          description: category.description,
          path,
          items,
          baseUrl,
        }),
      ]} />
      <PageHeader title={category.name} description={category.description} eyebrow="Category" crumbs={crumbs} />
      <div className="container-page py-12">
        {items.length ? (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              Showing {items.length} of {total} {total === 1 ? 'prompt' : 'prompts'}. Use search to find more.
            </p>
            <PromptGrid prompts={items} priorityCount={3} />
            <AdSlot placement="listing" />
          </>
        ) : (
          <EmptyState title="No prompts in this category yet">Prompts for {category.name} are coming soon.</EmptyState>
        )}
      </div>
    </>
  )
}
