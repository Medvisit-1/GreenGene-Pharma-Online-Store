# GreenGene Pharma — Online Store

A fully custom e-commerce store + admin panel for GreenGene Pharma (South Africa).
Built with **Next.js 16, TypeScript, Tailwind CSS, Prisma**.

> Deploys automatically to Railway on every push to `main`.

## Getting started

```bash
npm install
npx prisma generate      # generate the database client
npx prisma db push       # create the SQLite database
node prisma/seed.mjs     # load sample categories + products
npm run dev              # start the dev server → http://localhost:3000
```

## Tech stack

- **Next.js 16** (App Router) — storefront, admin & API in one codebase, server-rendered for SEO
- **TypeScript** + **Tailwind CSS v4** + **shadcn-style UI** components
- **Prisma** ORM — SQLite for development (`prisma/dev.db`). For production, change
  `provider` in `prisma/schema.prisma` to `postgresql` and update `DATABASE_URL`.
- **Zustand** — cart state (persisted to `localStorage`)
- Prices are stored in **cents** (ZAR). Use `formatPrice()` from `src/lib/utils.ts`.

## Project structure

```
src/
  app/
    page.tsx              Home page
    products/             Product listing + [slug] detail
    cart/                 Shopping cart
    checkout/             Checkout (placeholder — Phase 3)
    promotions/           Deals & discount codes
    contact/              Contact form
    api/                  Route handlers
  components/             UI + storefront components
  lib/                    prisma client, cart store, utils
prisma/
  schema.prisma           Database models
  seed.mjs                Sample data
```

## Build roadmap

1. ✅ **Foundation + Catalog** — schema, theme, storefront, products
2. **Cart + Basket** — (cart store + cart page already in place)
3. **Checkout + Invoices**
4. **Payment gateways** — PayFast / Yoco / Peach (APIs pending)
5. **Admin panel** — product/order/inventory/promotion management
6. **Extras** — accounts, notifications, polish

## Notes

- Replace the placeholder logo in `src/components/logo.tsx` with your real logo
  (drop the file in `/public` and swap the `<svg>` for an `<Image>`).
- Sample product images use `picsum.photos` placeholders — replace via the admin panel (Phase 5).
