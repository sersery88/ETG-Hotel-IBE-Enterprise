# 📁 Project Structure - ETG Hotel IBE Next.js 16.0.1

## Directory Overview

```
etg-hotel-ibe/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (marketing)/          # Marketing pages (static)
│   │   │   ├── page.tsx          # Homepage
│   │   │   ├── about/
│   │   │   ├── contact/
│   │   │   └── terms/
│   │   │
│   │   ├── (search)/             # Search flow (dynamic)
│   │   │   ├── search/
│   │   │   │   └── page.tsx      # Search results
│   │   │   ├── hotel/
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # Hotel details (ISR)
│   │   │   └── booking/
│   │   │       └── page.tsx      # Booking flow
│   │   │
│   │   ├── api/                  # API Routes
│   │   │   ├── hotels/
│   │   │   │   └── route.ts      # Hotel CRUD
│   │   │   ├── search/
│   │   │   │   └── route.ts      # Search endpoint
│   │   │   └── booking/
│   │   │       └── route.ts      # Booking endpoint
│   │   │
│   │   ├── layout.tsx            # Root layout
│   │   ├── page.tsx              # Root page (redirect)
│   │   └── globals.css           # Global styles
│   │
│   ├── components/               # React Components
│   │   ├── ui/                   # UI primitives
│   │   ├── search/               # Search components
│   │   ├── hotel/                # Hotel components
│   │   └── booking/              # Booking components
│   │
│   ├── lib/                      # Utilities & Libraries
│   │   ├── api/                  # API clients
│   │   │   ├── ratehawk.ts       # RateHawk API client
│   │   │   └── foundationdb.ts   # FoundationDB client
│   │   ├── cache/                # Caching utilities
│   │   ├── temporal/             # Temporal workflows
│   │   └── utils.ts              # Helper functions
│   │
│   └── types/                    # TypeScript types
│       ├── hotel.ts
│       ├── booking.ts
│       └── api.ts
│
├── public/                       # Static assets
│   ├── images/
│   └── fonts/
│
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── tailwind.config.ts            # Tailwind configuration
└── package.json                  # Dependencies

```

## Route Groups Explained

### `(marketing)` - Marketing Pages
- **Purpose:** Static marketing content
- **Rendering:** Static Site Generation (SSG)
- **Examples:** Homepage, About, Contact, Terms
- **SEO:** Critical for organic traffic

### `(search)` - Search Flow
- **Purpose:** Dynamic hotel search and booking
- **Rendering:** Server-Side Rendering (SSR) + ISR
- **Examples:** Search results, Hotel details, Booking
- **Performance:** Edge functions for global low-latency

## Key Files

### `src/app/layout.tsx`
Root layout with:
- Metadata for SEO
- Global providers (React Query, Zustand)
- OpenTelemetry instrumentation
- Font optimization

### `src/lib/api/ratehawk.ts`
RateHawk API client with:
- Rate limiting
- Retry logic
- Error handling
- Type safety

### `src/lib/cache/`
Multi-layer caching:
- L1: React Cache (Server Components)
- L2: Redis (Distributed)
- L3: CDN (Edge)

## Next.js 16.0.1 Features Used

### 1. Cache Components
```typescript
'use cache'
export async function getHotel(id: string) {
  // Cached server-side
}
```

### 2. Async Params
```typescript
export default async function Page({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
}
```

### 3. React Server Components
```typescript
// Server Component (default)
export default async function HotelList() {
  const hotels = await fetchHotels()
  return <div>{/* ... */}</div>
}
```

### 4. Server Actions
```typescript
'use server'
export async function createBooking(formData: FormData) {
  // Server-side logic
}
```

## Development Workflow

### 1. Start Dev Server
```bash
npm run dev
# Turbopack enabled by default
```

### 2. Build for Production
```bash
npm run build
# React Compiler optimizes automatically
```

### 3. Run Tests
```bash
npm run test
```

## Performance Targets

| Metric | Target |
|--------|--------|
| Initial Load | <1s |
| Time to Interactive | <1.5s |
| Lighthouse Score | 95+ |
| Bundle Size | <200KB |

---

**Created:** 2025-11-01  
**Next.js Version:** 16.0.1  
**React Version:** 19.2

