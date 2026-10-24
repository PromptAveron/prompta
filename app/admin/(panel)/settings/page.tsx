'use client'

import { useEffect, useState } from 'react'
import { AdminHeader } from '@/components/admin/admin-header'
import { SettingsForm } from '@/components/admin/settings-form'
import { createClient } from '@/lib/supabase/client'
import { DEFAULT_SETTINGS, type SiteSettings } from '@/lib/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    createClient()
      .from('site_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error: requestError }) => {
        if (!active) return
        if (requestError) {
          setError('Could not load site settings. Check your admin access and refresh.')
          return
        }
        setSettings((data as SiteSettings | null) ?? DEFAULT_SETTINGS)
      })
    return () => { active = false }
  }, [])

  return (
    <>
      <AdminHeader title="Settings" description="Brand, SEO, analytics and advertising." />
      {error ? <p role="alert" className="mb-4 text-sm text-destructive">{error}</p> : null}
      {settings ? <SettingsForm key={settings.updated_at} settings={settings} /> : null}
    </>
  )
}
