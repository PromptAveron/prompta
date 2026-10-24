'use client'

import { useActionState } from 'react'
import { Field, FormMessage, SubmitButton, inputClass } from '@/components/admin/field'
import { signInAction } from '@/lib/admin/actions'

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signInAction, {})
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <FormMessage state={state} />
      <Field label="Email" htmlFor="email">
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          defaultValue={state.values?.email ?? ''}
          className={inputClass}
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </Field>
      <SubmitButton className="w-full">Sign in</SubmitButton>
    </form>
  )
}
