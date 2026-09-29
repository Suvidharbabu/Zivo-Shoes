# Zivo — Shoe Store

A complete e-commerce store for sneakers, running shoes and boots.

- **Frontend:** Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Backend / Auth / Database / Storage:** Supabase (Row Level Security on every table)
- **Payments:** Razorpay (INR), with server-side order creation, signature verification and a webhook
- **Emails:** Resend (order confirmations, with a "resend email" button)
- **Hosting:** Vercel

👉 **New here? Follow [SETUP.md](./SETUP.md) step by step.**

## Features

**Customers:** home page (hero, categories, featured), category pages, product pages with size and stock, search with price filters and sorting, a cart that persists for logged-in users (guest carts merge in on login), checkout with Razorpay, an order confirmation page and email, My Orders, and sign up, log in and password reset.

**Admins** (`/admin`, admin role only): dashboard, add/edit/delete products with stock per size, an image manager (upload, replace, describe, reorder, set primary, delete), orders with status updates, and resending confirmation emails.

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the dev server on http://localhost:3000
npm run build    # production build (also type-checks)
npm run lint     # ESLint
npm start        # run the production build
```

## Project structure

```
supabase/          schema.sql (run first) and seed.sql (run second)
public/products/   the 9 sample product images used by seed.sql
src/app/           pages and API routes (App Router)
  api/razorpay/    create-order, verify, webhook
  admin/           admin dashboard (guarded in admin/layout.tsx)
src/actions/       server actions (account, admin, order email)
src/components/    UI, layout, product, cart, checkout, orders, admin
src/lib/           Supabase clients, auth helpers, queries, Razorpay, email, pricing
src/proxy.ts       refreshes the session and protects /account, /checkout and /admin
```

## Security notes

- Razorpay orders are created on the server, and amounts are always computed from the database.
- Payments are marked paid only after HMAC signature verification (checkout callback) or a verified webhook. Both paths use one idempotent SQL function.
- `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` and `RESEND_API_KEY` are used only in `server-only` modules and never reach the browser.
- Admin access is checked three times: the page guard, every server action, and RLS and Storage policies in the database.
