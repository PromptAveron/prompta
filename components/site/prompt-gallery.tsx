'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import type { PromptImageVariation } from '@/lib/types'

function GalleryArrow({
  direction,
  onClick,
}: {
  direction: 'previous' | 'next'
  onClick: () => void
}) {
  const Icon = direction === 'previous' ? ChevronLeft : ChevronRight
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'previous' ? 'Show previous image' : 'Show next image'}
      className={`absolute top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/60 text-white shadow-lg backdrop-blur transition-colors hover:bg-black/80 ${
        direction === 'previous' ? 'left-3' : 'right-3'
      }`}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  )
}

export function PromptGallery({
  images,
  title,
}: {
  images: PromptImageVariation[]
  title: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const activeImage = images[activeIndex]

  function move(step: number) {
    setActiveIndex((index) => (index + step + images.length) % images.length)
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setLightboxOpen(false)
      if (event.key === 'ArrowLeft') {
        setActiveIndex((index) => (index - 1 + images.length) % images.length)
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((index) => (index + 1) % images.length)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxOpen, images.length])

  if (!activeImage) return null

  return (
    <>
      <div className="space-y-3">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label={`View ${activeImage.alt || title} at full size`}
            className="relative block aspect-[4/3] w-full cursor-zoom-in sm:aspect-[16/10]"
          >
            <Image
              src={activeImage.url}
              alt={activeImage.alt || title}
              fill
              priority
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-contain"
            />
          </button>
          {images.length > 1 ? (
            <>
              <GalleryArrow direction="previous" onClick={() => move(-1)} />
              <GalleryArrow direction="next" onClick={() => move(1)} />
              <span className="absolute bottom-3 right-3 rounded-full bg-black/65 px-3 py-1 text-xs font-medium text-white">
                {activeIndex + 1} / {images.length}
              </span>
            </>
          ) : null}
        </div>
        {images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Prompt image variations">
            {images.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-pressed={activeIndex === index}
                className={`relative size-16 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-colors sm:size-20 ${
                  activeIndex === index ? 'border-brand' : 'border-border hover:border-foreground/40'
                }`}
              >
                <Image
                  src={image.url}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}
        <p className="text-center text-xs text-muted-foreground">
          Select the image to view it larger{images.length > 1 ? ` · ${images.length} images` : ''}
        </p>
      </div>

      {lightboxOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Image viewer: ${title}`}
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightboxOpen(false)
          }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8"
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close image viewer"
            className="absolute right-4 top-4 z-20 inline-flex size-11 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
          <div className="relative h-[min(82vh,900px)] w-full max-w-6xl">
            <Image
              src={activeImage.url}
              alt={activeImage.alt || title}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          {images.length > 1 ? (
            <>
              <GalleryArrow direction="previous" onClick={() => move(-1)} />
              <GalleryArrow direction="next" onClick={() => move(1)} />
            </>
          ) : null}
        </div>
      ) : null}
    </>
  )
}
