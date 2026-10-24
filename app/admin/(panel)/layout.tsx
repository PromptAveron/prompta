'use client'

import { AuthSessionMissingError } from '@supabase/supabase-js'
import { ExternalLink, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { AdminNav } from '@/components/admin/admin-nav'
import { Logo } from '@/components/site/logo'
import { signOutAction } from '@/lib/admin/actions'
import { createClient } from '@/lib/supabase/client'

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error && !(error instanceof AuthSessionMissingError)) {
        if (active) setStatus('error')
        return
      }
      if (!user) {
        router.replace('/admin/login')
        return
      }
      const { data: isAdmin, error: adminError } = await supabase.rpc('is_admin')
      if (adminError) {
        if (active) setStatus('error')
        return
      }
      if (isAdmin !== true) {
        await supabase.auth.signOut()
        router.replace('/admin/login')
        return
      }
      if (active) {
        setEmail(user.email ?? '')
        setStatus('ready')
      }
    }
    void checkAdmin()
    return () => { active = false }
  }, [router])

  if (status === 'loading') {
    return <main className="flex min-h-dvh items-center justify-center p-8 text-sm text-muted-foreground">Checking admin access…</main>
  }
  if (status === 'error') {
    return <main className="flex min-h-dvh items-center justify-center p-8 text-sm text-destructive">Could not verify admin access. Check your connection and reload.</main>
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-[1400px] flex-col lg:flex-row">
      <aside className="border-b border-border p-4 lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0 lg:border-r lg:border-b-0 lg:p-5">
        <div className="mb-4 flex items-center justify-between lg:mb-8 lg:block">
          <Link href="/admin" aria-label="Admin dashboard">
            <Logo />
          </Link>
          <Link
            href="/"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground lg:mt-3"
          >
            View site
            <ExternalLink className="size-3" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </Link>
        </div>
        <AdminNav />
        <div className="mt-4 hidden border-t border-border pt-4 lg:block">
          <p className="truncate text-xs text-muted-foreground" title={email}>
            {email}
          </p>
          <button
            type="button"
            onClick={() => void signOutAction()}
            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>
      <main id="main" tabIndex={-1} className="min-w-0 flex-1 p-4 outline-none sm:p-8">
        {children}
        <button
          type="button"
          onClick={() => void signOutAction()}
          className="mt-10 inline-flex items-center gap-2 border-t border-border pt-4 text-sm font-medium text-muted-foreground lg:hidden"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sign out
        </button>
      </main>
    </div>
  )
}
