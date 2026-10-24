'use client'

import { Heart } from 'lucide-react'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'promptavero:liked-prompts'

function readLikes(): string[] {
  const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
}

export function PromptLikeButton({
  promptId,
  compact = false,
}: {
  promptId: string
  compact?: boolean
}) {
  const [liked, setLiked] = useState(false)
  const [storageError, setStorageError] = useState(false)

  useEffect(() => {
    try {
      setLiked(readLikes().includes(promptId))
    } catch {
      setStorageError(true)
    }
  }, [promptId])

  function toggleLike() {
    try {
      const likes = new Set(readLikes())
      if (likes.has(promptId)) likes.delete(promptId)
      else likes.add(promptId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...likes]))
      setLiked(likes.has(promptId))
      setStorageError(false)
    } catch {
      setStorageError(true)
    }
  }

  return (
    <div className="relative z-10">
      <button
        type="button"
        onClick={toggleLike}
        aria-pressed={liked}
        aria-label={liked ? 'Remove prompt from liked prompts' : 'Like this prompt'}
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card/95 font-medium text-foreground shadow-sm backdrop-blur transition-colors hover:border-brand hover:text-brand ${
          compact ? 'size-10' : 'h-10 px-4'
        }`}
      >
        <Heart className={`size-4 ${liked ? 'fill-current text-brand' : ''}`} aria-hidden="true" />
        {!compact ? <span>{liked ? 'Liked' : 'Like'}</span> : null}
      </button>
      {storageError ? (
        <span role="status" className="sr-only">
          Likes could not be saved in this browser.
        </span>
      ) : null}
    </div>
  )
}
