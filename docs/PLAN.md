# Tanti — clothing store: frontend and backend plan

Tanti (তাঁতি, "weaver") is a working name for a single-brand online clothing store in Bangladesh.
The name, colours and logo live in one place each so they are easy to change.

## 1. Goals

- A storefront that looks like a modern fashion brand: editorial, calm, photo-led, fast on phones.
- Shoppers can browse, filter, pick colour and size, buy as a guest or with an account, pay cash on
  delivery or online, and track their order.
- The owner runs everything from an admin area: products, stock, orders, coupons, customers.

Out of scope for v1: multiple sellers, multiple currencies, a mobile app, live chat.

## 2. Assumptions (change any of these)

| Topic | Assumption |
|---|---|
| Market | Bangladesh, prices in taka (৳), whole taka only |
| Language | English storefront first; texts kept in one file so Bangla can be added |
| Payments | Cash on delivery + SSLCommerz (cards, bKash, Nagad). A fake gateway is used locally |
| Delivery | Two zones: inside Dhaka ৳70, outside Dhaka ৳130; free over ৳3,000 |
| Sign-in | Email or phone + password. Guests can check out with name, phone and address |
| Images | Uploaded through the admin, stored on disk (S3-compatible storage later) |

## 3. Architecture

```text
Browser ──► Next.js (frontend, :3000) ──► Spring Boot API (backend, :8080) ──► PostgreSQL
            server-renders pages            /api/v1/** JSON                     Flyway migrations
            forwards /api and /media        session cookie auth                 images on disk
```

- The browser talks only to Next.js. Next.js forwards `/api/v1/**` and `/media/**` to the backend,
  so cookies are first-party and there is no CORS.
- Catalog pages are server-rendered (good for SEO and first paint). Cart, wishlist and account
  screens are client components.
- Same tools as the other projects on this machine: Java 17, Spring Boot 4.1, PostgreSQL 18,
  embedded PostgreSQL for tests and local runs (no Docker needed), Next.js 16, React 19,
  Tailwind CSS 4, TypeScript.

## 4. Backend plan

### 4.1 Packages (one Spring Boot app, split by feature)

| Package | Owns |
|---|---|
| `catalog` | categories, collections, products, variants (colour × size), images, search and filters |
| `cart` | carts for guests (cookie token) and customers; merged on sign-in |
| `checkout` | delivery zones, coupons, price calculation, placing orders |
| `order` | orders, order items, status history, tracking |
| `payment` | payment attempts, SSLCommerz client, fake gateway for local runs |
| `customer` | accounts, sign-in, addresses, wishlist |
| `review` | product reviews from buyers who received the item |
| `admin` | admin-only endpoints that combine the above, dashboard numbers |
| `media` | image upload, resizing, serving `/media/**` |
| `notify` | order emails and SMS (written to the log locally) |
| `shared` | errors, money, slugs, clock, security config |

### 4.2 Data model (main tables)

```text
categories(id, parent_id, name, slug, position, image_url)
collections(id, name, slug, description, banner_url, position, active)
products(id, name, slug, description, details, fabric, care, fit, gender,
         category_id, base_price, compare_at_price, status[DRAFT|ACTIVE|ARCHIVED],
         featured, created_at, updated_at, search tsvector)
product_collections(product_id, collection_id)
product_colors(id, product_id, name, hex, position)
product_images(id, product_id, color_id?, url, alt, position)
variants(id, product_id, color_id, size, sku, stock, price_override?)
customers(id, name, email?, phone?, password_hash, role[CUSTOMER|ADMIN], created_at)
addresses(id, customer_id, label, name, phone, line1, area, city, zone[DHAKA|OUTSIDE], is_default)
wishlist_items(customer_id, product_id, created_at)
carts(id, token, customer_id?, updated_at)    cart_items(cart_id, variant_id, quantity)
coupons(id, code, kind[PERCENT|FIXED|FREE_SHIPPING], value, min_subtotal,
        starts_at, ends_at, usage_limit, used_count, active)
orders(id, number, customer_id?, email?, phone, ship_name, ship_line1, ship_area, ship_city,
       zone, subtotal, discount, shipping_fee, total, coupon_code?, payment_method[COD|ONLINE],
       payment_status[UNPAID|PAID|REFUNDED], status, note, created_at)
order_items(order_id, variant_id, product_name, color, size, sku, unit_price, quantity, image_url)
order_events(order_id, status, note, actor, created_at)
payments(id, order_id, gateway, tran_id, amount, status, raw_response, created_at)
reviews(id, product_id, customer_id, order_item_id, rating, title, body, status, created_at)
newsletter_subscribers(email, created_at)
```

Prices are stored as whole taka (`integer`). Order items copy name, colour, size and price, so old
orders never change when a product is edited.

### 4.3 Order statuses

```text
PENDING_PAYMENT ──paid──► PLACED ──► CONFIRMED ──► SHIPPED ──► DELIVERED
      │ (online only,        │            │
      │  expires in 30 min)  └────────────┴──► CANCELLED (stock goes back)
      └──expired/failed──► CANCELLED
COD orders start at PLACED.
```

Stock is taken when the order is placed (or when online payment starts) and returned on cancel or
payment expiry, so two shoppers can never buy the last item.

### 4.4 API (all under `/api/v1`)

Public catalog
- `GET /categories` — tree with product counts
- `GET /collections`, `GET /collections/{slug}`
- `GET /products?category=&collection=&q=&size=&color=&minPrice=&maxPrice=&sort=&page=` —
  page of product cards plus facets (sizes, colours, price range with counts)
- `GET /products/{slug}` — product with colours, images, variants and stock
- `GET /products/{slug}/related`, `GET /products/{slug}/reviews`
- `GET /home` — hero, featured categories, new arrivals, best sellers in one call

Cart and checkout
- `GET /cart`, `POST /cart/items`, `PATCH /cart/items/{variantId}`, `DELETE /cart/items/{variantId}`
- `POST /cart/coupon`, `DELETE /cart/coupon`
- `POST /checkout/quote` — totals for an address zone and coupon
- `POST /checkout` — places the order; returns order number, and a payment URL for online pay
- `GET /orders/track?number=&phone=` — guest tracking

Account
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
- `GET/POST/PUT/DELETE /account/addresses`
- `GET /account/orders`, `GET /account/orders/{number}`, `POST /account/orders/{number}/cancel`
- `GET/POST/DELETE /account/wishlist`
- `POST /products/{slug}/reviews`

Payments
- `POST /payments/sslcommerz/ipn` (server to server), success / fail / cancel return URLs

Admin (role ADMIN)
- `GET /admin/dashboard` — sales today / 7 days / 30 days, orders by status, low stock, top sellers
- products: list, create, update, archive, variants and stock, image upload and ordering
- categories and collections: CRUD and ordering
- orders: list with filters, detail, change status, add note, print invoice
- coupons: CRUD; customers: list and detail; reviews: approve or hide

### 4.5 Cross-cutting

- Security: session cookie (stored in PostgreSQL), CSRF token, BCrypt passwords, rate limits on
  sign-in and checkout, admin routes need role ADMIN.
- Errors: one JSON shape `{code, message, fields}`; codes like `cart.out_of_stock`.
- Validation: Bangladeshi phone numbers (`01XXXXXXXXX`), required address fields.
- Tests: integration tests against embedded PostgreSQL for every endpoint and the order rules.
- Demo data: categories, ~30 products with colours and sizes, coupons, an admin account.

## 5. Frontend plan

### 5.1 Look and feel

- Editorial fashion style: warm off-white background, near-black text, one clay accent colour,
  generous white space, large product images with a 3:4 crop, thin lines instead of boxes.
- Type: a high-contrast serif for headings (Fraunces) and a clean sans for everything else (Inter).
- Motion: image swap on hover, smooth drawers, skeleton loaders; respects reduced motion.
- Mobile first: bottom-sheet filters, sticky "Add to bag", thumb-friendly targets.
- Accessible: real buttons and labels, visible focus, colour contrast AA.

### 5.2 Pages

Storefront
| Route | Content |
|---|---|
| `/` | hero, category tiles, new arrivals rail, editorial banner, best sellers, promises strip, newsletter |
| `/shop`, `/c/[...slug]`, `/collections/[slug]` | product grid, filters (size, colour, price), sort, load more |
| `/search?q=` | same grid with the search text |
| `/p/[slug]` | gallery, colour swatches, size picker with stock, size guide, add to bag, wishlist, details accordion, reviews, related |
| `/cart` + cart drawer | items, quantities, coupon, totals, free delivery progress bar |
| `/checkout` | contact, address, delivery zone, payment method, order summary — one page |
| `/order/[number]` | thank-you and order summary |
| `/track` | track with order number + phone |
| `/login`, `/register` | sign in and create account |
| `/account`, `/account/orders/[n]`, `/account/addresses`, `/account/wishlist` | customer area |
| `/pages/[slug]` | about, contact, shipping & returns, size guide, FAQ, privacy, terms |

Admin (`/admin`, own layout with a sidebar)
| Route | Content |
|---|---|
| `/admin` | sales numbers, orders to handle, low stock, top products |
| `/admin/products`, `/admin/products/[id]` | table with search; editor with colours, sizes, stock grid and images |
| `/admin/orders`, `/admin/orders/[n]` | filters by status; detail with timeline, status buttons, invoice |
| `/admin/categories`, `/admin/collections`, `/admin/coupons`, `/admin/customers`, `/admin/reviews` | management screens |

### 5.3 Structure

```text
frontend/src/
  app/(shop)/...        storefront routes      app/admin/...   admin routes
  components/ui/        buttons, inputs, sheets, accordions, badges
  components/shop/      header, mega menu, product card, filters, gallery, cart drawer
  lib/api.ts            typed fetch helpers (server and client)
  lib/money.ts          ৳ formatting
  config/site.ts        brand name, contact, delivery fees shown in copy
```

State: the cart lives on the server; the browser keeps a small React context that re-reads it.
No extra state library.

## 6. Delivery phases

Each phase ends with passing tests, a commit and a short note of what changed.

| # | Phase | Contents | Status |
|---|---|---|---|
| 0 | Plan and skeleton | this plan, backend and frontend projects, README | done |
| 1 | Catalog backend | schema, catalog API with filters and facets, home endpoint, demo data, tests | done |
| 2 | Storefront | design system, header/footer, home, listing with filters, product page | done |
| 3 | Cart and checkout | cart API and drawer, coupons, delivery fee, COD orders, thank-you page, tracking | done |
| 4 | Accounts | register/sign in, cart merge, addresses, order history, wishlist | |
| 5 | Online payment | SSLCommerz with fake local gateway, payment expiry job | |
| 6 | Admin | dashboard, products editor with images, orders, categories, collections, coupons, customers | |
| 7 | Reviews, notifications, SEO | reviews, order emails/SMS, metadata, sitemap, Open Graph images | |
| 8 | Launch readiness | Docker, Caddy, backups, CI, real payment credentials, content pages | |

### Notes from building

- The bag is kept on the server, keyed by an http-only `tanti_cart` cookie (60 days). The bag id is
  random, so guessing another shopper's bag is not practical.
- Guests open their thank-you page with a random token in the link; tracking needs the order
  number plus the phone number used.
- The home page is built at `next build` time and refreshed every 30 s, so the backend must be
  reachable during a production build (phase 8 deals with this in the deploy setup).
- Footer links to `/pages/*` and the header account and wishlist icons lead nowhere until phases 4 and 7.
