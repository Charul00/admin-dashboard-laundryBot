# LaundryOps Admin Dashboard

Owner and Manager dashboard for LaundryOps: track outlets, staff, orders, and analytics. Uses the same Supabase database as the Telegram bot.

## Login (Owner & Manager)

- **Owner login**: Sees all outlets; can select an outlet in the sidebar to view that outlet’s data only. CRUD (update status, activate/maintenance outlet, staff) is scoped to the selected outlet (or all when “All outlets” is selected).
- **Manager login**: During login, select **Manager** and choose an **outlet**. Manager sees only that outlet’s data and can perform CRUD for that outlet (orders status, outlet maintenance, staff).

**Default credentials (run migration first):**

- Owner: `owner@laundryops.com` / `owner123`
- Manager: `manager@laundryops.com` + select outlet / `manager123`

## Features

- **Overview**: KPIs (orders, revenue, customers, outlets, express count, feedback), line chart (orders & revenue last 7 days), pie chart (orders by status), bar chart (orders & revenue by outlet), recent orders table. Scoped by selected outlet (owner) or manager’s outlet.
- **Outlets**: List outlets (one for manager; all or selected for owner) with orders count, revenue, delivered count, monitoring. Toggle outlet active/maintenance.
- **Orders**: Table of orders with customer, outlet, status, priority, total, payment, date. **Update order status** via dropdown (Received, In Progress, Ready, Out for Delivery, Delivered, Cancelled). Scoped by outlet.
- **Staff**: List and add staff; activate/deactivate; edit. Scoped by outlet.
- **Feedback**: Average rating and list; scoped by outlet.

## Setup

1. **Environment**

   Copy `.env.local.example` to `.env.local` and set:

   - `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL (same as telegram-bot).
   - `SUPABASE_SERVICE_KEY` – Supabase **service_role** key (same as telegram-bot). Keep this secret.

2. **Run**

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Bot and dashboard in sync

The dashboard and Telegram bot **share the same Supabase project** (same URL and service key in `.env.local` for the dashboard and `.env` for the bot). So:

- **Bookings** created via the bot appear in the dashboard (Orders, Overview).
- **Outlet maintenance** (Set to maintenance / Activate) in the dashboard is respected by the bot: the bot will not assign maintenance outlets and will tell the customer.
- **Staff** added or deactivated in the dashboard is the same data the bot’s backend uses.
- **Feedback** (ratings) given in the bot after a booking appear in the dashboard (Feedback page).

Use the **same** Supabase project for both; otherwise data will not match.

## Database

Uses the same Supabase project as the Telegram bot. Tables used:

- `outlets`, `orders`, `customers`, `feedback`, `services`
- Optional: `staff` (if present, Staff page shows data; otherwise shows a short note).
- **Login**: `dashboard_users` (run `telegram-bot/supabase_migrations/011_dashboard_users.sql` in Supabase → SQL Editor to create the table and seed one owner + one manager per outlet).

## Troubleshooting

- **Only 3 outlets showing**  
  Run `telegram-bot/supabase_migrations/007_outlets_one_per_area.sql` in Supabase → SQL Editor. It creates one outlet per area (Kothrud, FC Road, Kondhwa, etc.). Refresh the dashboard.

- **Staff page empty or “No staff records”**  
  1. Click **Staff** in the left sidebar (between Orders and Feedback).  
  2. Run `telegram-bot/supabase_migrations/008_staff_table_and_seed.sql` in Supabase → SQL Editor to create the `staff` table and seed one manager + one washer per outlet.  
  3. Refresh the Staff page.

- **Dashboard shows no data**  
  Ensure `.env.local` uses the **same** Supabase project (same URL and service key) as where you ran the migrations and where the Telegram bot points.

## Deploy to Vercel

1. Push the dashboard to GitHub: [admin-dashboard-laundryBot](https://github.com/Charul00/admin-dashboard-laundryBot).
2. In [Vercel](https://vercel.com), **Add New… → Project** and import that repo.
3. Add **Environment Variables** (same as local):
   - `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL (same as Telegram bot).
   - `SUPABASE_SERVICE_KEY` – Supabase **service_role** key (keep secret).
4. Click **Deploy**. Vercel will build and give you a URL (e.g. `https://admin-dashboard-laundry-bot.vercel.app`).

Full steps: **[docs/DEPLOY_VERCEL.md](docs/DEPLOY_VERCEL.md)**.

Login is already in place (owner/manager with outlet scope). For production, use stronger passwords and consider bcrypt instead of the dev SHA-256 hashing.
