# PromptAvero on GitHub Pages

This project is exported as a static Next.js site and deployed to GitHub Pages by `.github/workflows/deploy-pages.yml`. GitHub Pages does not run a Next.js server, API routes, middleware, or server actions.

## Configure deployment

1. In the GitHub repository, open **Settings → Secrets and variables → Actions → Variables**.
2. Add these repository variables from Supabase **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the publishable key or legacy `anon` key)
3. Under **Settings → Pages**, select **GitHub Actions** as the build and deployment source.
4. Run **Actions → Build and deploy GitHub Pages → Run workflow**, or push to `main`.

The site is built for `https://promptaveron.github.io` from the `PromptAveron/PromptAveron.github.io` repository. The public Supabase key is included in browser code by design; keep Supabase Row Level Security enabled. **Never add a Supabase secret/service-role key to GitHub variables, workflow files, or this static site.**

## Admin and content publishing

The admin panel at `/admin` uses Supabase Auth and sends content changes directly from the browser with the public key. Supabase RLS and the `public.is_admin()` function enforce administrator access. To grant an administrator, first create their account in Supabase Authentication, then insert their Auth user UUID into `public.admin_users` using the Supabase SQL Editor.

Prompt, category, and site-setting changes are saved to Supabase immediately. Since the public site is static, the generated public pages, metadata, sitemap, and prompt/category routes update when the GitHub Pages workflow runs again. After content changes—especially creating or renaming a prompt/category—run that workflow manually so the public pages are regenerated.

The admin interface and search query Supabase at runtime. Image uploads go directly to the existing `prompt-images` bucket and remain subject to its admin-only storage policies. Public page HTML and SEO metadata are snapshots from the last successful Pages build.
