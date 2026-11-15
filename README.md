# Tanti — online clothing store

A single-brand clothing shop for Bangladesh: storefront, checkout and admin.
See [docs/PLAN.md](docs/PLAN.md) for the full frontend and backend plan and the delivery phases.

## Layout

```text
backend/    Spring Boot API (Java 17, PostgreSQL, Flyway)
frontend/   Next.js storefront and admin (TypeScript, Tailwind CSS)
docs/       Plan and design notes
```

## Backend

Needs JDK 17+. On this machine: `export JAVA_HOME=~/.jdks/jdk-17`.

```bash
cd backend
./mvnw verify                 # build and run all tests (embedded PostgreSQL, no Docker)
./mvnw spring-boot:test-run   # run on :8080 with a fresh database full of demo products
```

Demo coupons: `WELCOME10` (10% off over ৳1,000, up to ৳500), `EID500` (৳500 off over ৳4,000),
`FREESHIP` (free delivery over ৳1,500) and `SUMMER20` (expired, for testing).

Demo product images are drawn by `backend/src/test/java/.../support/DemoArt.java` and written to
`backend/storage/demo/`. Real photos are uploaded through the admin (phase 6).

Demo account: mobile `01755555555`, password `tanti-demo` (Nadia, with a saved address, two past
orders and three saved pieces). Sign-up codes in local runs appear at
http://localhost:8080/api/v1/test-texts (texts are only logged).

Online payment in local runs goes to a fake SSLCommerz page (test sources only, no real money).
For the real sandbox, set `SSLCOMMERZ_STORE_ID`, `SSLCOMMERZ_STORE_PASSWORD` and a public `WEB_URL`.

## Frontend

Needs Node.js 20.9+. The backend must be running; Next.js forwards `/api/v1` and `/media` to it
(`BACKEND_URL`, default `http://localhost:8080`).

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```
