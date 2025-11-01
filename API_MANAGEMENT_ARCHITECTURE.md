# API Management System - Architecture Documentation

## System Overview

The Pulss API Management System is a comprehensive, enterprise-grade solution for managing programmatic access to the platform. It provides secure authentication, real-time event notifications, usage analytics, and a complete developer experience.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Applications                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Web Apps   │  │  Mobile Apps │  │  Third-party Integrations │  │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬──────────────┘  │
└─────────┼──────────────────┼──────────────────────┼──────────────────┘
          │                  │                      │
          │                  │                      │
          ▼                  ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API Gateway Layer                             │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    Rate Limiting Middleware                     │ │
│  │  • Per-key limits  • Time windows  • Distributed counters      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │               Authentication Middleware                         │ │
│  │  • API Key validation  • OAuth tokens  • JWT verification      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │              Authorization Middleware                           │ │
│  │  • Scope checking  • Permission validation  • Tenant isolation │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                   Logging Middleware                            │ │
│  │  • Request logging  • Analytics  • Error tracking              │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Application Layer                               │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────────────┐  │
│  │  API Mgmt     │  │  Webhooks    │  │   OAuth 2.0             │  │
│  │  Controller   │  │  Controller  │  │   Controller            │  │
│  │               │  │              │  │                         │  │
│  │ • CRUD Keys   │  │ • Subscribe  │  │ • Apps                  │  │
│  │ • Permissions │  │ • Trigger    │  │ • Authorization         │  │
│  │ • Analytics   │  │ • Retry      │  │ • Token Exchange        │  │
│  └───────────────┘  └──────────────┘  └─────────────────────────┘  │
│                                                                       │
│  ┌───────────────┐  ┌──────────────────────────────────────────┐   │
│  │  API Docs     │  │    Super Admin Feature Flags             │   │
│  │  Controller   │  │    Controller                            │   │
│  │               │  │                                          │   │
│  │ • Browse      │  │ • Per-tenant toggles                     │   │
│  │ • Search      │  │ • Global settings                        │   │
│  │ • Changelog   │  │ • Maintenance mode                       │   │
│  └───────────────┘  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Service Layer                                 │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Background Workers                          │  │
│  │                                                                │  │
│  │  ┌──────────────┐  ┌────────────────┐  ┌──────────────────┐ │  │
│  │  │  Webhook     │  │  Usage         │  │  Rate Limit      │ │  │
│  │  │  Delivery    │  │  Analytics     │  │  Cleanup         │ │  │
│  │  │  Queue       │  │  Aggregator    │  │  Worker          │ │  │
│  │  └──────────────┘  └────────────────┘  └──────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Data Layer                                    │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     PostgreSQL Database                        │  │
│  │                                                                │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │  │
│  │  │  API Keys   │  │  Webhooks    │  │  OAuth Data        │  │  │
│  │  │  • Keys     │  │  • Subscript.│  │  • Applications    │  │  │
│  │  │  • Perms    │  │  • Deliveries│  │  • Auth Codes      │  │  │
│  │  │  • Usage    │  │  • Logs      │  │  • Access Tokens   │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────────┘  │  │
│  │                                                                │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │  │
│  │  │  Feature    │  │  API Docs    │  │  Usage Analytics   │  │  │
│  │  │  Flags      │  │  • Content   │  │  • Logs            │  │  │
│  │  │  • Tenant   │  │  • Changelog │  │  • Aggregates      │  │  │
│  │  │  • Global   │  │  • Samples   │  │  • Billing         │  │  │
│  │  └─────────────┘  └──────────────┘  └────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. API Gateway Layer

#### Rate Limiting Middleware
- **Purpose:** Prevent API abuse and ensure fair usage
- **Implementation:** In-memory counters with database persistence
- **Features:**
  - Multiple time windows (hour, day, month)
  - Per-API-key limits
  - Custom multipliers per tenant
  - 429 responses with Retry-After headers

**Algorithm:**
```javascript
1. Extract API key from request
2. Get current time window start
3. Query rate limit counter for (key, window)
4. If count >= limit:
   - Calculate retry-after time
   - Return 429 with headers
5. Else:
   - Increment counter
   - Add rate limit headers to response
   - Continue to next middleware
```

#### Authentication Middleware
- **Methods Supported:**
  - API Keys (Bearer tokens)
  - OAuth 2.0 Access Tokens
  - JWT tokens (for tenant admins)

**Flow:**
```javascript
1. Extract token from Authorization header
2. Validate token format
3. Query database for token/key
4. Check expiration
5. Check revocation status
6. Attach user/tenant context to request
7. Continue or reject
```

#### Authorization Middleware
- **Scope-based access control**
- **Permission validation**
- **Tenant isolation enforcement**

### 2. Application Layer

#### API Management Controller
**Responsibilities:**
- API key CRUD operations
- Permission management
- Usage analytics queries
- Feature flag management (super admin)

**Key Functions:**
```javascript
- generateApiKey()      // Creates new API key with bcrypt hash
- revokeApiKey()        // Disables key
- getApiUsageAnalytics() // Aggregates usage data
- updateApiFeatureFlags() // Super admin feature control
```

#### Webhooks Controller
**Responsibilities:**
- Webhook subscription management
- Event triggering
- Delivery retry logic
- Delivery log management

**Event Flow:**
```
1. Event occurs in system (e.g., order created)
2. Query active webhooks for tenant + event type
3. For each webhook:
   a. Create delivery record
   b. Generate HMAC signature
   c. Send HTTP POST request
   d. Handle response/timeout
   e. Schedule retry if failed
   f. Update statistics
```

**Retry Strategy:**
- Exponential backoff: 0s, 60s, 300s, 900s
- Max 4 attempts total
- Failed deliveries logged for debugging

#### OAuth 2.0 Controller
**Responsibilities:**
- OAuth application management
- Authorization code flow
- Token generation and refresh
- PKCE support

**Authorization Code Flow:**
```
1. Client initiates: /oauth/authorize?client_id=...&redirect_uri=...
2. User authenticates (if not already)
3. User sees consent screen (unless trusted app)
4. User approves
5. Generate authorization code (10 min expiry)
6. Redirect to client with code
7. Client exchanges code for tokens
8. Return access token + refresh token
```

### 3. Service Layer

#### Background Workers

**Webhook Delivery Queue:**
- Process: Failed webhooks → Retry queue → HTTP delivery → Update status
- Concurrency: 5 workers
- Priority: Recent failures first

**Usage Analytics Aggregator:**
- Runs: Every hour
- Process: Raw logs → Aggregated stats → Per-tenant summaries
- Retention: 90 days detailed, 2 years aggregated

**Rate Limit Cleanup:**
- Runs: Every hour
- Process: Delete expired rate limit windows
- Optimization: Prevents database bloat

### 4. Data Layer

#### Database Schema Design

**Normalization:**
- 3NF for core entities
- Denormalization for analytics (read-heavy)

**Indexing Strategy:**
```sql
-- API Keys: Fast lookup by key
CREATE INDEX idx_api_keys_active ON api_keys(api_key) WHERE is_active = true;

-- Usage Logs: Time-series queries
CREATE INDEX idx_api_usage_logs_date ON api_usage_logs(log_date DESC);
CREATE INDEX idx_api_usage_logs_tenant ON api_usage_logs(tenant_id, timestamp DESC);

-- Webhooks: Event filtering
CREATE INDEX idx_webhooks_tenant_events ON webhooks(tenant_id, events) WHERE is_active = true;

-- Rate Limits: Window lookups
CREATE INDEX idx_api_rate_limits_lookup ON api_rate_limits(api_key_id, window_start, window_type);
```

**Partitioning:**
```sql
-- Usage logs partitioned by month for performance
CREATE TABLE api_usage_logs_2025_10 PARTITION OF api_usage_logs
  FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: Network Security                               │
│ • HTTPS/TLS 1.3  • CORS policies  • DDoS protection    │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 2: Authentication                                  │
│ • API key validation  • Token verification              │
│ • Expiration checks   • Revocation checks               │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 3: Authorization                                   │
│ • Scope validation   • Permission checks                │
│ • Tenant isolation   • Resource ownership               │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 4: Rate Limiting                                   │
│ • Per-key limits  • Per-tenant quotas                   │
│ • Burst protection                                       │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 5: Input Validation                                │
│ • Schema validation  • Sanitization                     │
│ • Type checking     • Size limits                       │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ Layer 6: Data Protection                                 │
│ • Encryption at rest  • Hashed secrets                  │
│ • Secure key storage  • Audit logging                   │
└─────────────────────────────────────────────────────────┘
```

### Key Security Features

1. **API Key Storage**
   - Keys hashed with bcrypt (cost factor 10)
   - Only prefix stored in plaintext for display
   - Full key shown once at creation

2. **Webhook Signatures**
   - HMAC-SHA256 signatures
   - Timestamp included to prevent replay attacks
   - Secret per webhook, never exposed

3. **OAuth Security**
   - PKCE for mobile/SPA apps
   - State parameter for CSRF protection
   - Redirect URI validation
   - Client secret hashing

4. **Tenant Isolation**
   - All queries filtered by tenant_id
   - Row-level security checks
   - No cross-tenant data access

## Scalability Considerations

### Horizontal Scaling

**Stateless Design:**
- All session data in database/Redis
- No server-side state
- Load balancer compatible

**Database Scaling:**
```
Primary (Write)  ──┐
                   ├──→ Application Servers
Replica 1 (Read) ──┤
Replica 2 (Read) ──┘
```

**Caching Strategy:**
- Redis for rate limit counters
- API key cache (5 min TTL)
- Feature flags cache (1 min TTL)

### Performance Optimization

**Query Optimization:**
- Indexed lookups for hot paths
- Prepared statements
- Connection pooling (max 20 connections)

**Async Processing:**
- Webhooks delivered asynchronously
- Analytics aggregation in background
- Email notifications queued

**Response Times:**
- Target: p95 < 200ms
- API key validation: < 10ms
- Rate limit check: < 5ms
- Webhook trigger: Async (non-blocking)

## Monitoring and Observability

### Metrics

**System Metrics:**
- Request rate (req/s)
- Error rate (%)
- Response time (p50, p95, p99)
- Active API keys
- Webhook delivery success rate

**Business Metrics:**
- API calls per tenant
- Most used endpoints
- Feature adoption rates
- Revenue from API usage

### Logging

**Structured Logging:**
```json
{
  "timestamp": "2025-10-20T12:00:00Z",
  "level": "info",
  "component": "api-key-auth",
  "action": "authenticate",
  "tenant_id": "uuid",
  "api_key_id": "uuid",
  "endpoint": "/api/products",
  "method": "GET",
  "status_code": 200,
  "response_time_ms": 45
}
```

**Log Levels:**
- DEBUG: Development details
- INFO: Normal operations
- WARN: Potential issues
- ERROR: Failures requiring attention

### Alerting

**Alert Conditions:**
- Error rate > 5% (5 min window)
- Response time > 1s (p95, 5 min)
- Rate limit hit > 100 times/min
- Webhook delivery failure rate > 20%
- Database connection pool exhaustion

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Full backup: Daily at 2 AM UTC
- Incremental: Every 6 hours
- Retention: 30 days
- Off-site storage in S3

**Configuration Backups:**
- Feature flags exported daily
- API key metadata (not secrets)
- Webhook configurations

### Recovery Procedures

**RTO (Recovery Time Objective):** 1 hour
**RPO (Recovery Point Objective):** 6 hours

**Recovery Steps:**
1. Restore database from latest backup
2. Restore configuration files
3. Verify data integrity
4. Resume API service
5. Monitor for issues

## Future Enhancements

### Planned Features

1. **GraphQL API**
   - Single endpoint
   - Flexible queries
   - Real-time subscriptions

2. **API Marketplace**
   - Third-party apps
   - Revenue sharing
   - App discovery

3. **Advanced Analytics**
   - Predictive usage
   - Anomaly detection
   - Cost optimization

4. **Multi-region Support**
   - Geographic distribution
   - Data locality compliance
   - Reduced latency

5. **WebSocket Support**
   - Real-time updates
   - Bidirectional communication
   - Reduced polling

---

**Document Version:** 1.0  
**Last Updated:** October 2025  
**Author:** Pulss Engineering Team
