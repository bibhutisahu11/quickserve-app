# Hotel QR Code Ordering System

A full-stack QR code ordering system for hotels and restaurants. Customers scan a QR code at their table to browse the menu and place dine-in orders, or visit a shareable URL to place parcel/takeaway orders.

## Features

- **Table Orders** — Each table has a unique QR code. Customers scan it to open the menu directly for their table.
- **Parcel Orders** — A shareable URL (`/menu/parcel`) lets walk-in customers place takeaway orders.
- **Live Order Tracking** — Customers see real-time status: Pending → Preparing → Ready → Done.
- **Kitchen Dashboard** — Staff see all active orders, update status with one click, auto-refreshes every 15s.
- **Menu Management** — Add, edit, toggle availability, and delete menu items with categories.
- **QR Code Generator** — Create tables and download print-ready QR PNGs from the admin panel.
- **Admin Auth** — Secure login for staff/admin.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS
- **Prisma 7** + PostgreSQL
- **NextAuth.js** for admin authentication
- **qrcode** npm package for QR generation
- Deployed on **Vercel** with **Vercel Postgres**

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment
```bash
cp .env.example .env
# Edit .env and set your DATABASE_URL
```

### 3. Run database migrations
```bash
npx prisma migrate dev --name init
```

### 4. Seed the database (creates demo admin + menu)
```bash
npm run db:seed
```
Default admin: `admin@hotel.com` / `admin123`

### 5. Start dev server
```bash
npm run dev
```

Visit `http://localhost:3000`

## Pages

| URL | Description |
|-----|-------------|
| `/menu/parcel` | Parcel / takeaway order page (public) |
| `/menu/[qrToken]` | Table order page — opened when QR is scanned |
| `/order/[orderId]` | Order confirmation & live status tracker |
| `/admin` | Admin login |
| `/admin/dashboard` | Kitchen order queue |
| `/admin/menu` | Menu management |
| `/admin/tables` | Table management + QR download |

## Deploying to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. In the Vercel dashboard, go to **Storage** → **Create** → **Postgres** (free tier)
4. Connect the Postgres database to your project
5. Add these environment variables:
   - `DATABASE_URL` — from Vercel Postgres (auto-added when you connect the DB)
   - `NEXTAUTH_SECRET` — run `openssl rand -base64 32` to generate one
   - `NEXTAUTH_URL` — your Vercel deployment URL, e.g. `https://my-hotel.vercel.app`
6. Set the build command to: `prisma migrate deploy && next build`
7. Deploy!
8. After first deploy, create your admin by calling:
   ```
   POST https://your-app.vercel.app/api/admin/setup
   Body: { "email": "you@hotel.com", "password": "yourpassword", "name": "Admin" }
   ```

## QR Code Workflow

1. Log in to `/admin`
2. Go to **Tables & QR** → Add tables (e.g. "Table 1", "Table 2", "VIP Room")
3. Click **Download QR** for each table → print and place on table
4. Customers scan the QR → they land on the menu → add items → checkout

## Project Structure

```
hotel-qr-system/
├── prisma/
│   ├── schema.prisma       # DB models
│   └── seed.ts             # Demo data seed
├── src/
│   ├── app/
│   │   ├── menu/           # Customer-facing menu pages
│   │   ├── order/          # Order status page
│   │   ├── admin/          # Admin pages (login, dashboard, menu, tables)
│   │   └── api/            # REST API routes
│   ├── components/         # Shared React components
│   ├── lib/                # Prisma client, auth config
│   └── types/              # TypeScript types
└── prisma.config.ts        # Prisma 7 datasource config
```
