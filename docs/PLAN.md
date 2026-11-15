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
| 4 | Accounts | register/sign in, cart merge, addresses, order history, wishlist | done |
| 5 | Online payment | SSLCommerz with fake local gateway, payment expiry job | done |
| 6 | Admin | dashboard, products editor with images, orders, categories, collections, coupons, customers | done |
| 7 | Reviews, notifications, SEO | reviews, order emails/SMS, metadata, sitemap, Open Graph images | |
| 8 | Launch readiness | Docker, Caddy, backups, CI, real payment credentials, content pages | |

### Notes from building

- The bag is kept on the server, keyed by an http-only `tanti_cart` cookie (60 days). The bag id is
  random, so guessing another shopper's bag is not practical.
- Guests open their thank-you page with a random token in the link; tracking needs the order
  number plus the phone number used.
- The home page is built at `next build` time and refreshed every 30 s, so the backend must be
  reachable during a production build (phase 8 deals with this in the deploy setup).
- Footer links to `/pages/*` lead nowhere until phase 7.

### Notes from phase 4 (accounts)

- Ported from the tree shop's (Shobuj's) account code, adapted to colour × size and restyled in
  Tanti's look. **Sign-in is by mobile number and password, not email** (a change from section 2:
  almost every shopper here has a mobile number, and texts are how orders get confirmed). Passwords
  use BCrypt; sessions live in PostgreSQL and the session id changes at sign-in; 6 wrong passwords
  for a number in 15 minutes pause sign-in.
- **Sign-up needs a 6-digit code texted to the number**, so numbers are proven from the start.
  Codes last 10 minutes, allow 5 tries, one per minute and 5 per hour per number. Because the number
  is proven, earlier guest orders placed with it join the new account. "Forgot password" uses the
  same codes and signs out other devices. Texts go through an outbox in the database;
  `SMS_DRIVER=log` (the default) only logs them, and local runs show them at
  http://localhost:8080/api/v1/test-texts. The SSL Wireless sender is included but unverified
  (phase 7 adds order texts on top of it).
- One bag per customer, shared across devices; at sign-in the guest bag joins it (larger quantity
  wins, at most 10 per line; a coupon carries over). Signing out leaves the bag with the account.
- Saved addresses (up to 10, one default) with inside/outside Dhaka for the delivery fee. Checkout
  picks the default and can save a new one.
- Order history with **Order again**: each piece goes back in the bag in the same colour and size,
  raised to the earlier quantity within stock; sold-out ones are listed and the bag only opens when
  something is in it.
- **Wishlist**: a heart on every product card (beside the card link, not inside it) and on the
  product page. Signed-out shoppers are sent to sign in. The header shows how many are saved.

### Notes from phase 5 (online payment)

- Ported from the tree shop's payment code (itself from Haat's tested version). An online order waits
  as PENDING_PAYMENT and holds its stock for 30 minutes (`store.payment.expiry`) while the shopper
  pays on SSLCommerz (bKash, Nagad, Rocket, cards).
- A payment counts only when SSLCommerz's Validation API confirms the `val_id` for the same
  `tran_id`, in BDT, for the exact amount; the IPN, the browser's return and a check every minute
  can each report it, and confirming twice changes nothing. Every callback is stored.
- After a failed or cancelled payment the order page offers "Pay now" again (up to 5 tries) or
  "Pay cash on delivery instead". Unpaid orders are cancelled after 30 minutes and the pieces go back
  into stock; money that arrives later is recorded for a refund.
- Settings: `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD`, `SSLCOMMERZ_BASE_URL`, `WEB_URL`.
  Online payment is hidden until the credentials are set. Local runs use a fake gateway from the
  test sources ("TEST GATEWAY · NOT REAL MONEY").
- Order texts (confirmed, on the way, cancelled) are left for phase 7.

### Notes from phase 6 (admin)

- Ported from the tree shop's admin (itself from Haat's), with a product editor rewritten for
  clothes and every screen in Tanti's look. Staff sign in at `/admin` with a mobile number and
  password (kept apart from customer accounts). Everyone on the team can do everything; switching
  someone off signs them out at once, and nobody can switch off themselves or the last account.
- **Orders**: a "to do" queue (placed, confirmed, on the way), oldest first, filterable by inside or
  outside Dhaka. Placed → Confirmed → Sent out → Delivered. Sending out records the courier and its
  tracking number, which the shopper then sees on their order page. A sent order can still be
  cancelled when the courier brings it back, with a choice to leave the pieces out of stock (stained
  or damaged). Cancelling a paid order shows a refund due; the refund is made in the SSLCommerz panel
  and its reference recorded here. Cash orders count as paid when delivered. Print gives a packing slip.
- **Product editor**: name, category, fabric, fit, care, description, one price (with an optional old
  price for a sale) and the size guide; colours, each with a swatch and the family shoppers filter by
  (choosing the family sets the swatch unless it was picked by hand); sizes added from presets (S–XXL,
  XS–XL, waist 28–36, kids 2–11 years, free size) or typed; and a colour × size grid where each box is
  either offered with its stock or not. SKUs are suggested (NAME-COL-SIZE) and can be edited. It all
  saves at once; two sizes or colours can swap in one save. Removing a colour keeps its pictures as
  shared ones. A product on sale needs at least one size, and every colour needs a size. Customers
  were left out of v1 of the admin: an order shows how many orders the same number has placed.
- **Pictures** save as they are uploaded (JPEG, PNG or WebP, checked by their bytes, up to 5 MB), each
  shown with every colour or with one colour only; the first is the one on cards.
- **Stock**: one small grid per product (colours × its sizes), saved per box. "Running low" means 3
  or fewer (`store.admin.low-stock`).
- **Categories** (two levels, with a picture and description) and **collections** (banner, tagline,
  order on the home page, hidden or shown). Web addresses are fixed when made.
- **Delivery fees** are set in the admin and stored in the database; the shop, bag and checkout read
  them from `GET /api/v1/delivery`. Until they are saved, the fees in `application.yml` apply.
