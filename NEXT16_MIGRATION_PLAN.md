# 🚀 Next.js 16.0.1 Migration Plan - ETG Hotel IBE Enterprise

> **Migration from React 19.2 SPA → Next.js 16.0.1 with Enterprise Architecture**  
> **Scale:** 3 Million Hotels via RateHawk API  
> **Status:** Experimental - Original Repository: [ETG-Hotel-IBE](https://github.com/sersery88/ETG-Hotel-IBE)

---

## 📋 Executive Summary

This document outlines the complete migration strategy from the current React 19.2 + Vite SPA to **Next.js 16.0.1** with a full enterprise-grade architecture designed to handle **3 million hotels** at Booking.com/Expedia scale.

### Why Next.js 16.0.1?

**Released:** October 21, 2025 (Days old - cutting edge!)

**Critical Features for Hotel IBE:**
- ✅ **Cache Components** - Explicit caching with "use cache" directive
- ✅ **Turbopack (Stable)** - 5-10x faster builds, 2-5x faster Fast Refresh
- ✅ **React 19.2** - View Transitions, useEffectEvent, Activity component
- ✅ **React Compiler** - Automatic memoization (critical for 3M hotels)
- ✅ **ISR (Incremental Static Regeneration)** - Perfect for hotel data
- ✅ **Edge Functions** - Global low-latency search
- ✅ **HTTP/3/QUIC** - Modern protocol support via CDN

---

## 🎯 Migration Phases

### **Phase 1: Foundation (Weeks 1-2)**
**Goal:** Set up Next.js 16.0.1 project structure

#### 1.1 Project Initialization
```bash
# Create Next.js 16.0.1 project
npx create-next-app@latest etg-hotel-ibe-next16 --typescript --tailwind --app --turbopack

# Install dependencies
cd etg-hotel-ibe-next16
npm install next@16.0.1 react@19.2 react-dom@19.2
```

#### 1.2 Configuration
```typescript
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable Cache Components (NEW in v16)
  cacheComponents: true,
  
  // Turbopack is now default
  turbopack: {
    // File system caching for faster startup
    fileSystemCache: true,
  },
  
  // React Compiler (Stable in v16)
  reactCompiler: true,
  
  // Image optimization for 3M hotels
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.ratehawk.com',
      },
    ],
    minimumCacheTTL: 14400, // 4 hours (v16 default)
    qualities: [75], // v16 default
  },
  
  // HTTP/3 via CDN
  experimental: {
    // Enable modern protocols
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
```

#### 1.3 Directory Structure
```
app/
├── (marketing)/          # Marketing pages (static)
│   ├── page.tsx         # Homepage
│   └── about/
├── (search)/            # Search flow (dynamic)
│   ├── search/
│   │   └── page.tsx     # Search results
│   ├── hotel/
│   │   └── [id]/
│   │       └── page.tsx # Hotel details
│   └── booking/
│       └── page.tsx     # Booking flow
├── api/                 # API routes
│   ├── hotels/
│   ├── search/
│   └── booking/
├── layout.tsx           # Root layout
└── globals.css          # Global styles
```

---

### **Phase 2: Core Migration (Weeks 3-6)**

#### 2.1 Migrate Components to React Server Components (RSC)

**Current SPA Component:**
```typescript
// OLD: frontend/src/pages/Search.tsx
import { useState, useEffect } from 'react'
import { searchHotels } from '../services/api'

export default function Search() {
  const [hotels, setHotels] = useState([])
  
  useEffect(() => {
    searchHotels().then(setHotels)
  }, [])
  
  return <div>{/* ... */}</div>
}
```

**New RSC (Next.js 16):**
```typescript
// NEW: app/(search)/search/page.tsx
import { searchHotels } from '@/lib/api'

// Server Component - runs on server
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; checkin?: string }>
}) {
  // BREAKING CHANGE in v16: searchParams is now async
  const params = await searchParams
  
  // Fetch on server - no loading state needed
  const hotels = await searchHotels(params)
  
  return (
    <div>
      <SearchResults hotels={hotels} />
    </div>
  )
}

// Use Cache Components (NEW in v16)
'use cache'
async function searchHotels(params: any) {
  // Cached server-side
  const res = await fetch(`${process.env.API_URL}/search`, {
    next: { revalidate: 300 }, // 5 min cache
  })
  return res.json()
}
```

#### 2.2 Client Components for Interactivity

```typescript
// app/components/SearchForm.tsx
'use client' // Client Component

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SearchForm() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/search?q=${query}`)
  }
  
  return <form onSubmit={handleSubmit}>{/* ... */}</form>
}
```

#### 2.3 ISR for Hotel Pages (3M Hotels)

```typescript
// app/(search)/hotel/[id]/page.tsx
import { getHotel, getAllHotelIds } from '@/lib/api'

// Generate static params for popular hotels
export async function generateStaticParams() {
  // Pre-render top 10,000 hotels at build time
  const topHotels = await getAllHotelIds({ limit: 10000 })
  
  return topHotels.map((id) => ({
    id: id.toString(),
  }))
}

// ISR: Revalidate every 1 hour
export const revalidate = 3600

export default async function HotelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params // v16: async params
  const hotel = await getHotel(id)
  
  return (
    <div>
      <HotelDetails hotel={hotel} />
    </div>
  )
}
```

---

### **Phase 3: Advanced Features (Weeks 7-10)**

#### 3.1 Cache Components with "use cache"

```typescript
// app/lib/cache.ts
'use cache'

import { cacheTag } from 'next/cache'

export async function getHotelAvailability(hotelId: string, dates: DateRange) {
  // Tag for cache invalidation
  cacheTag(`hotel-${hotelId}`)
  
  const res = await fetch(`${process.env.API_URL}/availability`, {
    method: 'POST',
    body: JSON.stringify({ hotelId, dates }),
  })
  
  return res.json()
}

// Invalidate cache when booking is made
import { updateTag } from 'next/cache'

export async function createBooking(data: BookingData) {
  const booking = await fetch(`${process.env.API_URL}/bookings`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  
  // Invalidate hotel availability cache
  updateTag(`hotel-${data.hotelId}`)
  
  return booking.json()
}
```

#### 3.2 Edge Functions for Global Search

```typescript
// app/api/search/route.ts
export const runtime = 'edge' // Run on Edge

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  // Edge function - runs globally
  const results = await searchHotelsEdge(query)
  
  return Response.json(results)
}
```

#### 3.3 React 19.2 Features

**View Transitions:**
```typescript
// app/layout.tsx
import { ViewTransition } from 'react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ViewTransition>{children}</ViewTransition>
      </body>
    </html>
  )
}
```

**useEffectEvent:**
```typescript
'use client'

import { useEffectEvent } from 'react'

export function SearchAnalytics({ query }: { query: string }) {
  // Non-reactive event handler
  const logSearch = useEffectEvent((q: string) => {
    analytics.track('search', { query: q })
  })
  
  useEffect(() => {
    logSearch(query)
  }, [query])
}
```

---

### **Phase 4: Performance Optimization (Weeks 11-12)**

#### 4.1 React Compiler Optimization

```typescript
// next.config.ts
const nextConfig = {
  reactCompiler: true, // Automatic memoization
}
```

**Before (Manual):**
```typescript
const MemoizedHotelCard = memo(HotelCard)
const memoizedFilter = useMemo(() => filterHotels(hotels), [hotels])
```

**After (Automatic):**
```typescript
// React Compiler handles memoization automatically
function HotelList({ hotels }) {
  const filtered = filterHotels(hotels) // Auto-memoized
  return <div>{filtered.map(h => <HotelCard key={h.id} {...h} />)}</div>
}
```

#### 4.2 Turbopack Build Optimization

```bash
# Development (5-10x faster)
npm run dev

# Production build (2-5x faster)
npm run build

# File system caching
# Subsequent builds are even faster
```

---

## 🔄 Breaking Changes in Next.js 16

### 1. Async Request APIs

**OLD (v15):**
```typescript
export default function Page({ params, searchParams }) {
  const { id } = params // Sync
  const { q } = searchParams // Sync
}
```

**NEW (v16):**
```typescript
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ q?: string }>
}) {
  const { id } = await params // MUST await
  const { q } = await searchParams // MUST await
}
```

### 2. Async Dynamic APIs

**OLD (v15):**
```typescript
import { cookies, headers } from 'next/headers'

const cookieStore = cookies()
const headersList = headers()
```

**NEW (v16):**
```typescript
import { cookies, headers } from 'next/headers'

const cookieStore = await cookies() // MUST await
const headersList = await headers() // MUST await
```

### 3. Middleware → Proxy

**OLD (v15):**
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // ...
}
```

**NEW (v16):**
```typescript
// proxy.ts (renamed)
export function proxy(request: NextRequest) {
  // ...
}
```

---

## 📊 Performance Targets

| Metric | Current (React SPA) | Target (Next.js 16) | Improvement |
|--------|---------------------|---------------------|-------------|
| **Initial Load** | 2.5s | 0.8s | 🚀 3.1x faster |
| **Time to Interactive** | 3.2s | 1.2s | 🚀 2.7x faster |
| **SEO Score** | 50/100 | 95/100 | ✅ +90% |
| **Build Time** | 45s | 15s | 🚀 3x faster |
| **Hot Reload** | 800ms | 80ms | 🚀 10x faster |
| **Bundle Size** | 450KB | 180KB | ✅ -60% |

---

## 🛠️ Migration Checklist

### Week 1-2: Foundation
- [ ] Create Next.js 16.0.1 project
- [ ] Configure Turbopack
- [ ] Enable Cache Components
- [ ] Set up directory structure
- [ ] Configure TypeScript 5.7+

### Week 3-4: Core Components
- [ ] Migrate homepage to RSC
- [ ] Migrate search page to RSC
- [ ] Convert interactive components to Client Components
- [ ] Implement async params/searchParams

### Week 5-6: Data Fetching
- [ ] Migrate API calls to Server Components
- [ ] Implement ISR for hotel pages
- [ ] Set up cache tags
- [ ] Configure revalidation strategies

### Week 7-8: Advanced Features
- [ ] Implement "use cache" directive
- [ ] Set up Edge functions for search
- [ ] Add View Transitions
- [ ] Integrate React Compiler

### Week 9-10: Optimization
- [ ] Enable Turbopack file system caching
- [ ] Optimize images with new defaults
- [ ] Implement incremental prefetching
- [ ] Add OpenTelemetry tracing

### Week 11-12: Testing & Deployment
- [ ] E2E tests with Playwright
- [ ] Performance testing
- [ ] SEO audit
- [ ] Deploy to Vercel/Railway

---

## 🚀 Next Steps

1. **Clone this repository**
2. **Review ENTERPRISE_ARCHITECTURE.md** for full stack details
3. **Start Phase 1** - Foundation setup
4. **Join Next.js Conf 2025** (Oct 22) for latest updates

---

**Created:** 2025-11-01  
**Version:** 1.0.0  
**Status:** 🚧 Experimental  
**Original Repo:** [ETG-Hotel-IBE](https://github.com/sersery88/ETG-Hotel-IBE)

