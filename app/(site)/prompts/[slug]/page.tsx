import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AdSlot } from '@/components/site/ad-slot'
import { Breadcrumbs } from '@/components/site/breadcrumbs'
import { CopyPrompt } from '@/components/site/copy-prompt'
import { JsonLd } from '@/components/site/json-ld'
import { PromptGallery } from '@/components/site/prompt-gallery'
import { PromptLikeButton } from '@/components/site/prompt-like-button'
import { PromptGrid } from '@/components/site/prompt-card'
import { getPromptBySlug, getRelatedPrompts, getSettings } from '@/lib/data/public'
import { createPublicClient } from '@/lib/supabase/public'
import { breadcrumbJsonLd, buildPageMetadata, promptJsonLd } from '@/lib/seo'
import { formatDate, getBaseUrl, truncate } from '@/lib/site'

type Props = { params: Promise<{ slug: string }> }

async function resolve(slug: string) {
  return getPromptBySlug(slug)
}

export async function generateStaticParams() {
  const { data, error } = await createPublicClient()
    .from('prompts')
    .select('slug')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
  if (error) throw new Error('Failed to load prompt pages for static export')
  return (data ?? []).map(({ slug }) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const [prompt, settings] = await Promise.all([resolve(slug), getSettings()])
  if (!prompt) return { title: 'Prompt not found', robots: { index: false, follow: false } }

  return buildPageMetadata({
    title: prompt.seo_title || prompt.title,
    description:
      prompt.seo_description || prompt.excerpt || truncate(prompt.prompt_text, 155),
    path: `/prompts/${prompt.slug}`,
    canonicalOverride: prompt.canonical_url,
    image: prompt.featured_image_url
      ? {
          url: prompt.featured_image_url,
          alt: prompt.featured_image_alt,
          width: prompt.image_width,
          height: prompt.image_height,
        }
      : null,
    type: 'article',
    publishedTime: prompt.published_at,
    modifiedTime: prompt.updated_at,
    settings,
  })
}

export default async function PromptPage({ params }: Props) {
  const { slug } = await params
  const prompt = await resolve(slug)
  if (!prompt) notFound()

  const [settings, related] = await Promise.all([
    getSettings(),
    getRelatedPrompts(prompt.id, 3).catch(() => []),
  ])
  const baseUrl = getBaseUrl(settings)
  const category = prompt.categories
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Explore Prompts', path: '/prompts' },
    { name: category.name, path: `/categories/${category.slug}` },
    { name: prompt.title, path: `/prompts/${prompt.slug}` },
  ]
  const description = prompt.seo_description || prompt.excerpt || truncate(prompt.prompt_text, 155)
  const galleryImages = [
    ...(prompt.featured_image_url
      ? [{
          url: prompt.featured_image_url,
          alt: prompt.featured_image_alt || prompt.title,
          width: prompt.image_width,
          height: prompt.image_height,
        }]
      : []),
    ...(prompt.image_variations ?? []),
  ]
  const wasUpdated =
    prompt.published_at &&
    new Date(prompt.updated_at).getTime() - new Date(prompt.published_at).getTime() > 24 * 60 * 60 * 1000

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd(crumbs, baseUrl),
          promptJsonLd({
            title: prompt.title,
            description,
            promptText: prompt.prompt_text,
            path: `/prompts/${prompt.slug}`,
            baseUrl,
            imageUrl: prompt.featured_image_url,
            categoryName: category.name,
            tags: prompt.tags,
            publishedAt: prompt.published_at,
            updatedAt: prompt.updated_at,
            settings,
          }),
        ]}
      />

      <article className="container-page py-8 sm:py-12">
        <Breadcrumbs items={crumbs} />

        <header className="mt-8 flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-4xl">
            <Link href={`/categories/${category.slug}`} className="eyebrow text-brand hover:underline">
              {category.name}
            </Link>
            <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
              {prompt.title}
            </h1>
            <p className="mt-4 text-sm text-muted-foreground">
              {prompt.published_at ? (
                <>
                  Published <time dateTime={prompt.published_at}>{formatDate(prompt.published_at)}</time>
                </>
              ) : null}
              {wasUpdated ? (
                <>
                  {' '}&middot; Updated <time dateTime={prompt.updated_at}>{formatDate(prompt.updated_at)}</time>
                </>
              ) : null}
            </p>
          </div>
          <PromptLikeButton promptId={prompt.id} />
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]">
          <div>
            {galleryImages.length ? (
              <PromptGallery images={galleryImages} title={prompt.title} />
            ) : (
              <div className="hairline-grid flex aspect-[4/3] items-end rounded-2xl border border-border bg-muted p-6 sm:aspect-[16/10]">
                <span className="eyebrow">{category.name} prompt</span>
              </div>
            )}
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="text-xl font-semibold tracking-tight">About this prompt</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {prompt.excerpt || category.description || `Explore this ${category.name.toLowerCase()} prompt and adapt it to your next AI image project.`}
              </p>
              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 border-t border-border pt-5 text-sm">
                <dt className="text-muted-foreground">Category</dt>
                <dd><Link href={`/categories/${category.slug}`} className="font-medium text-brand hover:underline">{category.name}</Link></dd>
                {prompt.tags.length ? (
                  <>
                    <dt className="text-muted-foreground">Topics</dt>
                    <dd className="flex flex-wrap gap-1.5">
                      {prompt.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/search?tag=${encodeURIComponent(tag)}`}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs hover:text-brand"
                        >
                          {tag}
                        </Link>
                      ))}
                    </dd>
                  </>
                ) : null}
                {galleryImages.length ? (
                  <>
                    <dt className="text-muted-foreground">Examples</dt>
                    <dd>{galleryImages.length} image{galleryImages.length === 1 ? '' : 's'}</dd>
                  </>
                ) : null}
              </dl>
            </section>
            <div className="rounded-2xl bg-brand-soft p-5 text-sm leading-relaxed text-accent-foreground">
              <h2 className="font-semibold">Make it your own</h2>
              <p className="mt-2">
                Copy the prompt below, then adjust its subject, style, lighting, or composition to suit your idea.
                Results can vary between AI image generators.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section id="prompt-text" aria-label="Copyable AI image prompt">
            <CopyPrompt text={prompt.prompt_text} />
          </section>
          <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-semibold tracking-tight">How to use this AI image prompt</h2>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <li><span className="font-medium text-foreground">1.</span> Copy the complete prompt text.</li>
              <li><span className="font-medium text-foreground">2.</span> Paste it into your preferred AI image generator.</li>
              <li><span className="font-medium text-foreground">3.</span> Refine details such as framing, color, or aspect ratio and generate again.</li>
            </ol>
            <p className="mt-4 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
              This {category.name.toLowerCase()} prompt is a starting point for original artwork. Use the description and
              {prompt.tags.length ? ` ${prompt.tags.slice(0, 3).join(', ')} ` : ' key visual details '}
              as inspiration, and tailor the wording for the image model you use.
            </p>
          </section>
        </div>

        <AdSlot placement="prompt" />
      </article>

      {related.length ? (
        <section className="container-page pb-4" aria-labelledby="related-heading">
          <div className="border-t border-border pt-12">
            <h2 id="related-heading" className="mb-8 text-2xl font-semibold tracking-tight">
              Related prompts
            </h2>
            <PromptGrid prompts={related} />
          </div>
        </section>
      ) : null}
    </>
  )
}
