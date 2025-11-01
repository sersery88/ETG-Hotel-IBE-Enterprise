# 🏗️ Enterprise Architecture - ETG Hotel IBE

> **Scale:** 3 Million Hotels via RateHawk API  
> **Architecture:** Next.js 16.0.1 + FoundationDB + Temporal + Redpanda + ClickHouse + Istio/Envoy  
> **Status:** Experimental - Original: [ETG-Hotel-IBE](https://github.com/sersery88/ETG-Hotel-IBE)

---

## 📋 Executive Summary

This document defines the **complete enterprise-grade architecture** for a hotel booking platform serving **3 million hotels** at Booking.com/Expedia scale. The architecture addresses the three critical failure points of booking platforms:

1. **Edge Execution Speed** - Next.js 16 + HTTP/3/QUIC
2. **Strict Consistency** - FoundationDB with ACID guarantees
3. **Fault-Tolerant Orchestration** - Temporal workflows

---

## 🎯 Architecture Principles

### 1. **Performance First**
- **Target:** <100ms p99 search latency globally
- **Strategy:** Edge rendering + distributed caching + CDN

### 2. **Strict Consistency**
- **Target:** Zero double-bookings, zero inventory conflicts
- **Strategy:** FoundationDB serializable transactions

### 3. **Fault Tolerance**
- **Target:** 99.99% booking success rate
- **Strategy:** Temporal durable workflows with automatic retries

### 4. **Observability**
- **Target:** 100% trace coverage, <5min MTTR
- **Strategy:** OpenTelemetry + distributed tracing

### 5. **Security**
- **Target:** Zero-trust architecture, mTLS everywhere
- **Strategy:** Istio service mesh + Envoy proxy

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EDGE LAYER (Global)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Cloudflare/Vercel Edge + HTTP/3/QUIC                    │   │
│  │  - Next.js 16 SSR/ISR                                    │   │
│  │  - Edge Functions (Search, Autocomplete)                 │   │
│  │  - CDN Cache (Static Assets, Hotel Images)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP/3
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE MESH LAYER (Istio)                    │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Envoy Proxy (mTLS, Circuit Breaker, Load Balancing)    │   │
│  │  - Zero-Trust Security                                   │   │
│  │  - Automatic Retries & Timeouts                          │   │
│  │  - Distributed Tracing (OpenTelemetry)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓ gRPC
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐   │
│  │   Search     │   Booking    │  Inventory   │   Payment   │   │
│  │   Service    │   Service    │   Service    │   Service   │   │
│  │   (Rust)     │   (Rust)     │   (Rust)     │   (Rust)    │   │
│  └──────────────┴──────────────┴──────────────┴─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Temporal Workflows                                      │   │
│  │  - Booking Saga (Prebook → Book → Confirm)              │   │
│  │  - Payment Processing (Authorize → Capture)             │   │
│  │  - Cancellation Flow (Cancel → Refund)                  │   │
│  │  - Automatic Retries with Exponential Backoff           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────┬──────────────┬──────────────┬─────────────┐   │
│  │ FoundationDB │   Redpanda   │  ClickHouse  │    Redis    │   │
│  │  (OLTP)      │  (Streaming) │  (Analytics) │  (Cache)    │   │
│  │              │              │              │             │   │
│  │ - Hotels     │ - Events     │ - Metrics    │ - Sessions  │   │
│  │ - Bookings   │ - Logs       │ - Dashboards │ - Rate Limit│   │
│  │ - Users      │ - CDC        │ - Reports    │ - Temp Data │   │
│  └──────────────┴──────────────┴──────────────┴─────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 Technology Stack Deep Dive

### **1. Frontend: Next.js 16.0.1**

**Why Next.js 16?**
- ✅ **SEO Critical** - Hotels need organic search traffic
- ✅ **ISR** - Perfect for 3M hotels (pre-render top 10K, on-demand rest)
- ✅ **Edge Functions** - Global low-latency search
- ✅ **React Server Components** - Reduced bundle size
- ✅ **Turbopack** - 5-10x faster builds

**Configuration:**
```typescript
// next.config.ts
const nextConfig = {
  cacheComponents: true,        // NEW in v16
  reactCompiler: true,          // Automatic memoization
  turbopack: {
    fileSystemCache: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ratehawk.com' },
    ],
  },
}
```

**Deployment:**
- **Vercel Edge Network** - 300+ global locations
- **HTTP/3/QUIC** - Automatic via Vercel/Cloudflare
- **CDN Caching** - Static assets + ISR pages

---

### **2. Database: FoundationDB**

**Why FoundationDB?**
- ✅ **Strict Serializability** - Zero double-bookings
- ✅ **ACID Transactions** - Across distributed nodes
- ✅ **Multi-Model** - Key-value + Document + Graph
- ✅ **Battle-Tested** - Powers Apple iCloud (billions of users)

**Schema Design:**
```python
# FoundationDB Directory Structure
/etg-hotel-ibe/
  /hotels/
    /{hotel_id}/
      /info          # Hotel metadata
      /rooms         # Room types
      /availability  # Date-based availability
  /bookings/
    /{booking_id}/
      /status        # Booking state
      /payment       # Payment info
  /users/
    /{user_id}/
      /profile
      /bookings      # User's bookings
```

**Transaction Example:**
```python
@fdb.transactional
def create_booking(tr, hotel_id, room_id, dates, user_id):
    # Check availability (serializable read)
    avail_key = f'/hotels/{hotel_id}/availability/{dates}'
    available = tr[avail_key]
    
    if not available:
        raise BookingError("Room not available")
    
    # Create booking (atomic write)
    booking_id = generate_id()
    tr[f'/bookings/{booking_id}/status'] = 'CONFIRMED'
    
    # Update availability (atomic decrement)
    tr[avail_key] = available - 1
    
    # Add to user's bookings
    tr[f'/users/{user_id}/bookings/{booking_id}'] = booking_id
    
    return booking_id
```

**Deployment:**
- **Cluster:** 5 nodes (3 coordinators, 2 storage)
- **Replication:** 3x (triple redundancy)
- **Backup:** Continuous to S3

---

### **3. Orchestration: Temporal**

**Why Temporal?**
- ✅ **Durable Workflows** - Survive crashes, restarts
- ✅ **Automatic Retries** - Exponential backoff
- ✅ **Saga Pattern** - Distributed transactions
- ✅ **Visibility** - Full workflow history

**Booking Workflow:**
```go
// workflows/booking.go
func BookingWorkflow(ctx workflow.Context, req BookingRequest) error {
    // Step 1: Prebook (RateHawk API)
    var prebookResult PrebookResult
    err := workflow.ExecuteActivity(ctx, PrebookActivity, req).Get(ctx, &prebookResult)
    if err != nil {
        return err // Automatic retry
    }
    
    // Step 2: Authorize Payment
    var authResult AuthResult
    err = workflow.ExecuteActivity(ctx, AuthorizePaymentActivity, prebookResult).Get(ctx, &authResult)
    if err != nil {
        // Compensate: Cancel prebook
        workflow.ExecuteActivity(ctx, CancelPrebookActivity, prebookResult)
        return err
    }
    
    // Step 3: Confirm Booking
    var bookResult BookResult
    err = workflow.ExecuteActivity(ctx, ConfirmBookingActivity, prebookResult).Get(ctx, &bookResult)
    if err != nil {
        // Compensate: Refund payment + cancel prebook
        workflow.ExecuteActivity(ctx, RefundPaymentActivity, authResult)
        workflow.ExecuteActivity(ctx, CancelPrebookActivity, prebookResult)
        return err
    }
    
    // Step 4: Capture Payment
    err = workflow.ExecuteActivity(ctx, CapturePaymentActivity, authResult).Get(ctx, nil)
    if err != nil {
        // Critical: Manual intervention needed
        workflow.ExecuteActivity(ctx, AlertOpsActivity, err)
    }
    
    return nil
}
```

**Retry Configuration:**
```go
retryPolicy := &temporal.RetryPolicy{
    InitialInterval:    time.Second,
    BackoffCoefficient: 2.0,
    MaximumInterval:    time.Minute * 5,
    MaximumAttempts:    10,
}
```

**Deployment:**
- **Temporal Server:** 3 nodes (HA)
- **Workers:** Auto-scaling (5-50 instances)
- **Persistence:** PostgreSQL (metadata) + FoundationDB (events)

---

### **4. Streaming: Redpanda**

**Why Redpanda?**
- ✅ **Kafka-Compatible** - Drop-in replacement
- ✅ **10x Lower Latency** - C++ vs Java
- ✅ **No ZooKeeper** - Simpler operations
- ✅ **Built-in Schema Registry** - Protobuf/Avro support

**Topics:**
```yaml
topics:
  - booking.events        # Booking lifecycle events
  - search.events         # Search analytics
  - payment.events        # Payment transactions
  - inventory.updates     # Hotel availability changes
  - user.activity         # User behavior tracking
```

**Event Schema (Protobuf):**
```protobuf
message BookingCreated {
  string booking_id = 1;
  string hotel_id = 2;
  string user_id = 3;
  int64 timestamp = 4;
  BookingStatus status = 5;
  Money total_price = 6;
}
```

**Consumers:**
- **ClickHouse Connector** - Real-time analytics
- **Elasticsearch Connector** - Search indexing
- **Webhook Service** - External notifications

**Deployment:**
- **Cluster:** 3 brokers
- **Replication:** 3x
- **Retention:** 7 days (events), 30 days (logs)

---

### **5. Analytics: ClickHouse**

**Why ClickHouse?**
- ✅ **Columnar Storage** - 100x faster aggregations
- ✅ **Real-Time Ingestion** - Sub-second latency
- ✅ **SQL Interface** - Familiar query language
- ✅ **Compression** - 10x storage savings

**Schema:**
```sql
CREATE TABLE bookings (
    booking_id String,
    hotel_id String,
    user_id String,
    created_at DateTime,
    status Enum8('PENDING', 'CONFIRMED', 'CANCELLED'),
    total_price Decimal(10, 2),
    currency String,
    -- Materialized columns for fast queries
    created_date Date MATERIALIZED toDate(created_at),
    created_hour UInt8 MATERIALIZED toHour(created_at)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_date)
ORDER BY (hotel_id, created_at);
```

**Queries:**
```sql
-- Real-time dashboard: Bookings per hour
SELECT 
    toStartOfHour(created_at) AS hour,
    count() AS bookings,
    sum(total_price) AS revenue
FROM bookings
WHERE created_at >= now() - INTERVAL 24 HOUR
GROUP BY hour
ORDER BY hour;

-- Top hotels by revenue
SELECT 
    hotel_id,
    count() AS bookings,
    sum(total_price) AS revenue
FROM bookings
WHERE created_date = today()
GROUP BY hotel_id
ORDER BY revenue DESC
LIMIT 100;
```

**Deployment:**
- **Cluster:** 3 shards × 2 replicas = 6 nodes
- **Ingestion:** Redpanda → ClickHouse Connector
- **Retention:** 90 days (hot), 2 years (cold S3)

---

### **6. Service Mesh: Istio + Envoy**

**Why Istio?**
- ✅ **mTLS Everywhere** - Zero-trust security
- ✅ **Circuit Breakers** - Prevent cascading failures
- ✅ **Automatic Retries** - Resilience
- ✅ **Distributed Tracing** - OpenTelemetry integration

**Configuration:**
```yaml
# istio-config.yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: booking-service
spec:
  hosts:
  - booking-service
  http:
  - timeout: 10s
    retries:
      attempts: 3
      perTryTimeout: 3s
      retryOn: 5xx,reset,connect-failure
    route:
    - destination:
        host: booking-service
        subset: v1
      weight: 90
    - destination:
        host: booking-service
        subset: v2
      weight: 10  # Canary deployment
```

**Circuit Breaker:**
```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: booking-service
spec:
  host: booking-service
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        http1MaxPendingRequests: 50
        maxRequestsPerConnection: 2
    outlierDetection:
      consecutiveErrors: 5
      interval: 30s
      baseEjectionTime: 30s
```

---

### **7. Observability: OpenTelemetry**

**Why OpenTelemetry?**
- ✅ **Vendor-Neutral** - No lock-in
- ✅ **Auto-Instrumentation** - Zero code changes
- ✅ **Unified Telemetry** - Traces + Metrics + Logs

**Stack:**
- **Traces:** Jaeger
- **Metrics:** Prometheus + Grafana
- **Logs:** Loki
- **APM:** Datadog/New Relic (optional)

**Instrumentation:**
```typescript
// Next.js instrumentation
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel({
    serviceName: 'etg-hotel-ibe-frontend',
    traceExporter: 'otlp',
  })
}
```

```rust
// Rust backend
use opentelemetry::global;
use tracing_subscriber::layer::SubscriberExt;

fn init_telemetry() {
    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(opentelemetry_otlp::new_exporter().tonic())
        .install_batch(opentelemetry::runtime::Tokio)
        .unwrap();
    
    let telemetry = tracing_opentelemetry::layer().with_tracer(tracer);
    let subscriber = tracing_subscriber::registry().with(telemetry);
    tracing::subscriber::set_global_default(subscriber).unwrap();
}
```

---

## 📊 Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **Search Latency (p99)** | <100ms | Edge functions + CDN |
| **Booking Success Rate** | 99.99% | Temporal retries + saga |
| **Database Consistency** | 100% | FoundationDB ACID |
| **Availability** | 99.99% | Multi-region + auto-failover |
| **MTTR** | <5min | OpenTelemetry + alerts |

---

## 🚀 Deployment Architecture

### **Multi-Region Setup**

```
Region: US-EAST-1 (Primary)
├── Next.js Edge (Vercel)
├── Kubernetes Cluster
│   ├── Istio Control Plane
│   ├── Application Services (10 pods each)
│   ├── Temporal Workers (auto-scale 5-50)
│   └── Redpanda (3 brokers)
├── FoundationDB (5 nodes)
└── ClickHouse (6 nodes)

Region: EU-CENTRAL-1 (Secondary)
├── Next.js Edge (Vercel)
├── Kubernetes Cluster
│   └── Read Replicas
├── FoundationDB (read replicas)
└── ClickHouse (replicas)
```

---

**Created:** 2025-11-01  
**Version:** 1.0.0  
**Status:** 🚧 Experimental

