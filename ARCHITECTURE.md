# IPFS Storage Cluster Architecture

## Current Final Setup

### Services Overview
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   Monitoring     │    │  IPFS Cluster   │
│   (port 3000)   │    │                  │    │                 │
└─────────────────┘    │  Prometheus      │    │  Cluster API    │
                       │  (port 9090)     │    │  (port 9094)    │
┌─────────────────┐    │                  │    │                 │
│   PostgreSQL    │    │  Grafana         │    │  Manages:       │
│   (port 5432)   │    │  (port 3001)     │    │  - Replication  │
└─────────────────┘    └──────────────────┘    │  - Consensus    │
                                               │  - Pin tracking │
                                               └─────────────────┘
                                                        │
                                                        │ Manages
                                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         IPFS Storage Nodes                                     │
│                                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │  Storage Node 1 │  │  Storage Node 2 │  │  Storage Node 3 │                │
│  │                 │  │                 │  │                 │                │
│  │  API: 5001      │  │  API: 5002      │  │  API: 5003      │                │
│  │  Gateway: 8080  │  │  Gateway: 8081  │  │  Gateway: 8082  │                │
│  │  Swarm: 4001    │  │  Swarm: 4002    │  │  Swarm: 4003    │                │
│  │                 │  │                 │  │                 │                │
│  │  ✅ Monitored   │  │  ✅ Monitored   │  │  ✅ Monitored   │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Port Mapping
| Service | Port | Purpose |
|---------|------|---------|
| Next.js App | 3000 | Web application |
| PostgreSQL | 5432 | Database |
| Prometheus | 9090 | Metrics collection |
| Grafana | 3001 | Dashboards |
| **IPFS Cluster** | **9094** | **Cluster management API** |
| IPFS Node 1 | 5001, 8080, 4001 | API, Gateway, Swarm |
| IPFS Node 2 | 5002, 8081, 4002 | API, Gateway, Swarm |
| IPFS Node 3 | 5003, 8082, 4003 | API, Gateway, Swarm |

## Key Learnings

### ✅ What Works
1. **IPFS Cluster is the orchestrator** - handles all content distribution automatically
2. **Direct node monitoring** - Kubo exposes excellent Prometheus metrics at `/debug/metrics/prometheus`
3. **CRDT consensus** - Cluster uses conflict-free replicated data types for coordination
4. **Automatic replication** - Cluster handles which content goes to which nodes

### ❌ What Doesn't Work / Not Needed
1. **HAProxy load balancer** - IPFS Cluster makes this redundant
2. **Cluster metrics in Prometheus** - IPFS Cluster doesn't expose Prometheus metrics
3. **Manual load balancing** - Cluster API handles distribution intelligently

### 🔧 Configuration Details

#### Prometheus Monitors:
- **3 IPFS nodes**: Full metrics (bitswap, repo size, peer counts)
- **Next.js app**: Custom application metrics
- **NOT monitoring**: Cluster (uses REST API instead), Load balancer (removed)

#### IPFS Cluster Configuration:
- **Consensus**: CRDT (Conflict-free Replicated Data Types)
- **Trust model**: Trust all peers (`CLUSTER_CRDT_TRUSTEDPEERS: '*'`)
- **Primary IPFS node**: storage-node-1
- **Secret**: Shared cluster authentication key

## Production Recommendations

### ✅ Use This Architecture
- **IPFS Cluster for coordination** - Let it handle all replication logic
- **Direct cluster API access** - Use port 9094 for all pinning operations
- **Individual node access** - Only for debugging/monitoring
- **Gateway access** - Ports 8080-8082 for content serving

### 🚫 Avoid
- **Manual load balancing** - Cluster handles this better
- **Direct node pinning** - Always use cluster API for consistency
- **Complex routing logic** - Keep it simple, trust the cluster

## API Usage Examples

### Cluster Operations (Recommended)
```bash
# Pin content via cluster (replicates automatically)
curl -X POST "http://localhost:9094/pins/QmHash"

# List all pins
curl http://localhost:9094/pins

# Check cluster peers
curl http://localhost:9094/peers

# Get cluster status
curl http://localhost:9094/health
```

### Node Operations (Direct, for debugging)
```bash
# Check individual node
curl -X POST http://localhost:5001/api/v0/id

# Get node-specific metrics
curl http://localhost:5001/debug/metrics/prometheus
```

### Monitoring
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Cluster API**: http://localhost:9094

## Docker Commands
```bash
# Start everything
docker-compose up -d

# Check status
docker-compose ps

# View cluster logs
docker-compose logs ipfs-cluster-0

# Restart cluster
docker-compose restart ipfs-cluster-0
```

## Validation Strategy

### Prisma-First Validation Approach

**Philosophy**: Let Prisma handle validation at the database level rather than duplicating validation logic in the application layer.

#### ✅ What We Do
- **Rely on Prisma validation** for type safety, required fields, and database constraints
- **Use simple JavaScript checks** only for basic file operations (file size, type validation)
- **Let database errors bubble up** with meaningful error messages
- **Trust database schema** for enum validation, foreign key constraints, and data integrity

#### ❌ What We Don't Do
- **Complex schema validation libraries** (removed zod dependency)
- **Duplicate validation logic** between application and database layers
- **Over-engineered validation** for simple operations

#### Implementation Examples

**Simple file validation** (kept for file operations):
```javascript
// File size and type validation before database
if (file.size > 100 * 1024 * 1024) {
  return { error: 'File size must be less than 100MB' };
}
```

**Database-handled validation** (for API operations):
```javascript
// Let Prisma handle validation
const project = await prisma.project.create({
  data: {
    name: data.name,        // Prisma validates required field
    status: data.status,    // Prisma validates enum values
    startDate: data.startDate // Prisma validates/converts dates
  }
});
```

#### Error Handling
- **Database constraint violations** return clear error messages
- **Type mismatches** are caught by Prisma at runtime
- **Enum validation** is enforced by database schema
- **Date validation** is handled by Prisma's type system

#### Benefits
- **Reduced complexity** - Single source of truth for validation rules
- **Better performance** - No redundant validation layers
- **Maintainability** - Schema changes automatically update validation
- **Type safety** - TypeScript + Prisma provide compile-time guarantees

---

**Architecture Status**: ✅ Production Ready
**Last Updated**: 2025-09-22
**Key Insight**: IPFS Cluster eliminates the need for external load balancing and provides intelligent content distribution out of the box. Prisma-first validation reduces complexity while maintaining data integrity.