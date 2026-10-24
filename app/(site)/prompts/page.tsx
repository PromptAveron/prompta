import type { Metadata } from 'next'
import { AdSlot } from '@/components/site/ad-slot'
import { JsonLd } from '@/components/site/json-ld'
import { EmptyState, PageHeader } from '@/components/site/page-header'
import { PromptGrid } from '@/components/site/prompt-card'
import { getPromptPage, getSettings } from '@/lib/data/public'
import { breadcrumbJsonLd, buildPageMetadata, collectionJsonLd } from '@/lib/seo'
import { getBaseUrl } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  return buildPageMetadata({
    title: 'Explore AI Image Prompts',
    description: 'Browse curated AI image-generation prompts. Copy a prompt, adapt it, and generate your own images.',
    path: '/prompts',
    settings,
  })
}

export default async function PromptsPage() {
  const [settings, { items, total }] = await Promise.all([getSettings(), getPromptPage(1)])
  const baseUrl = getBaseUrl(settings)
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Explore Prompts', path: '/prompts' }]

  return (
    <>
      <JsonLd data={[
        breadcrumbJsonLd(crumbs, baseUrl),
        collectionJsonLd({
          name: 'Explore AI Image Prompts',
          description: 'A curated library of AI image-generation prompts.',
          path: '/prompts',
          items,
          baseUrl,
        }),
      ]} />
      <PageHeader
        title="Explore prompts"
        description="Every prompt is written to be copied, adapted and run in the image model of your choice."
        crumbs={crumbs}
      />
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
          <EmptyState title="No prompts published yet">Check back soon for the first collection.</EmptyState>
        )}
      </div>
    </>
  )
}
