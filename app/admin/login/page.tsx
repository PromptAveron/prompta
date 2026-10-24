import type { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/admin/login-form'
import { Logo } from '@/components/site/logo'

export const metadata: Metadata = { title: 'Sign in' }

export default function LoginPage() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="mb-6 mt-1 text-sm text-muted-foreground">Sign in to manage prompts and site settings.</p>
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:underline">Back to site</Link>
        </p>
      </div>
    </main>
  )
}
