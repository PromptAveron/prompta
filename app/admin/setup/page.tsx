import type { Metadata } from 'next'
import Link from 'next/link'
import { Logo } from '@/components/site/logo'

export const metadata: Metadata = { title: 'Set up admin' }

export default function SetupPage() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Set up an administrator</h1>
          <ol className="my-5 list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
            <li>Create the user in Supabase Authentication and set their password.</li>
            <li>Grant admin access by inserting that account&apos;s UUID into <code>public.admin_users</code> in SQL Editor.</li>
          </ol>
          <Link
            href="/admin/login"
            className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </main>
  )
}
