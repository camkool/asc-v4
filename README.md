# Ascendancy V4 — Vercel + Supabase Starter (Free tier)

This is a minimal starter for your V4 MVP. It includes:
- Next.js 14 (App Router)
- Supabase client setup (email sign-in)
- A **Planet** onboarding page
- Daily tick API (`/api/tick`) + **Vercel Cron** (`vercel.json`)

## 0) Prereqs
- Supabase project (copy your Project URL, anon key, and service role key)
- Vercel account

## 1) Local env (optional)
Create `.env.local` from `.env.example` and fill in the values.

## 2) Deploy on Vercel (recommended)
- Push this repo to GitHub
- Import into Vercel → add env vars:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY` (server only)
  - `TICK_SECRET`
- Deploy. Cron will appear in Settings → Cron Jobs.

## 3) Supabase schema
Use the `supabase-schema.sql` file in this repo. Paste it in Supabase → SQL Editor → Run.
If you get an error about `gen_random_uuid`, run:
```
create extension if not exists "pgcrypto";
```
then run the full script again.

## 4) Test the tick
Visit: `https://YOUR-DEPLOY.vercel.app/api/tick?secret=YOUR_TICK_SECRET`

## 5) Use it
- Go to `/login` to sign in by email magic link.
- Go to `/planet` to create your planet.
