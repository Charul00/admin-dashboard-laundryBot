# Deploy Admin Dashboard to Vercel

Deploy the LaundryOps admin dashboard to [Vercel](https://vercel.com) so it runs on a public URL (e.g. `https://your-project.vercel.app`).

## Prerequisites

- GitHub repo with the admin dashboard code: [Charul00/admin-dashboard-laundryBot](https://github.com/Charul00/admin-dashboard-laundryBot)
- Supabase project URL and **service_role** key (same as your Telegram bot and local `.env.local`)

## Steps

### 1. Push the dashboard to GitHub (if not already)

```bash
cd admin-dashboard
git push -u origin main
```

### 2. Sign in to Vercel

- Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).

### 3. Import the project

1. Click **Add New…** → **Project**.
2. **Import** the repo `Charul00/admin-dashboard-laundryBot` (or your fork).
3. Vercel will detect **Next.js** and set:
   - **Framework Preset:** Next.js  
   - **Build Command:** `next build` (or leave default)  
   - **Output Directory:** (leave default for Next.js)  
   - **Install Command:** `npm install`  

4. Do **not** deploy yet — add env vars first.

### 4. Add environment variables

In the import screen (or later: **Project → Settings → Environment Variables**), add:

| Name | Value | Notes |
|------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | e.g. `https://xxxx.supabase.co` (same as bot) |
| `SUPABASE_SERVICE_KEY` | Your Supabase **service_role** key | From Supabase → Settings → API → service_role. **Keep secret.** |

- Use the **same** Supabase project as your Telegram bot so the dashboard shows the same orders, outlets, staff, and feedback.
- For **Environment**, enable **Production** (and optionally Preview if you use branches).

### 5. Deploy

1. Click **Deploy**.
2. Wait for the build to finish (a few minutes).
3. Vercel will give you a URL like `https://admin-dashboard-laundry-bot-xxx.vercel.app`.

### 6. Optional: custom domain

- In the project: **Settings → Domains**.
- Add your domain and follow Vercel’s DNS instructions.

## After deploy

- Open the deployment URL and check **Overview**, **Outlets**, **Orders**, **Staff**, **Feedback**.
- If you see “Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY” or no data, the env vars are missing or wrong — fix them in **Settings → Environment Variables** and **redeploy** (Deployments → ⋮ → Redeploy).

## Security note

- The dashboard has **no login** by default. Anyone with the URL can see data.
- For production, add auth (e.g. [Supabase Auth](https://supabase.com/docs/guides/auth) or a simple password) or restrict access (e.g. Vercel Password Protection on a paid plan).
