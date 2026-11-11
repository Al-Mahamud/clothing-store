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

## Frontend

Needs Node.js 20.9+. The backend must be running; Next.js forwards `/api/v1` and `/media` to it
(`BACKEND_URL`, default `http://localhost:8080`).

```bash
cd frontend
npm install
npm run dev       # http://localhost:3000
```
