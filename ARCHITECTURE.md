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

## Resource Deployment Architecture

### Overview

The application supports **one-click resource deployment** allowing users to provision IPFS clusters, PostgreSQL databases, and other infrastructure with a single button click.

### Deployment Models

#### Current Implementation: Mock Deployment
**Purpose**: UI/UX validation and feature demonstration

```
User Action → Resource Creation → Mock Deployment Service
                                        ↓
                                  Simulated Progress
                                  (2-6 seconds)
                                        ↓
                              Mock Endpoint + Credentials
                              Stored in PostgreSQL
```

**Features:**
- Realistic provisioning simulation (6 stages: init → allocate → configure → provision → verify → complete)
- Real-time progress tracking (0-100%)
- Mock endpoints generated per resource (e.g., `http://ipfs-cluster-abc12345.local:9094`)
- Mock credentials (API keys, connection strings, passwords)
- Template-based configuration

#### Phase 1: Self-Hosted Deployment (Docker)
**Target**: Single server deployment for initial production

```
Next.js App (Docker) → Deployment Controller
                              ↓
                       Docker API/Socket
                              ↓
                    User Resources (Containers)
                    ├── IPFS Cluster A (User 1)
                    ├── PostgreSQL B (User 2)
                    └── IPFS Cluster C (User 3)
```

**Implementation Strategy:**
- Use `dockerode` npm package for Docker control
- Dynamic Docker Compose generation per resource
- Isolated Docker networks per user/organisation
- Resource quotas via Docker limits (CPU, RAM, storage)
- Port mapping: Dynamic port allocation (19001+)
- Volume management: Persistent storage per resource

**Challenges:**
- Single server resource limits
- Port exhaustion mitigation
- Container orchestration complexity

#### Phase 2: Multi-Server Deployment (Docker Swarm/K8s)
**Target**: Horizontal scaling across multiple servers

```
Control Plane (Server A)
├── Next.js App
├── PostgreSQL (metadata)
└── Deployment Scheduler
         ↓
    Worker Fleet
    ├── Server B (IPFS clusters)
    ├── Server C (Databases)
    └── Server D (Mixed workloads)
```

**Implementation Options:**
1. **Docker Swarm**: Simple multi-node orchestration
2. **Kubernetes**: Enterprise-grade orchestration
3. **Custom SSH**: Shell script deployment

**Scheduler Logic:**
- Pick server with lowest resource utilisation
- Deploy via SSH + Docker Compose or K8s API
- Health monitoring across servers
- Automatic failover

#### Phase 3: Cloud Provider Integration
**Target**: Infinite scaling via cloud providers

```
Next.js App → Deployment Controller
                    ↓
            Provider Selector
            ├── AWS (Terraform)
            ├── DigitalOcean (API)
            ├── Hetzner Cloud (API)
            └── Self-hosted (Docker)
```

**Providers:**
- **AWS**: EC2 instances, RDS databases, ECS containers
- **DigitalOcean**: Droplets, Managed Databases, App Platform
- **Hetzner**: Cloud servers, managed Kubernetes

**Billing Models:**
1. Platform pays (reseller) → Charge users markup
2. Users link their cloud accounts → Direct billing
3. Hybrid: Basic on your infrastructure, premium on cloud

### Deployment Provider Abstraction

```typescript
interface DeploymentProvider {
  deploy(resource: Resource, template: ResourceTemplate): Promise<DeploymentResult>;
  getStatus(resourceId: string): Promise<DeploymentStatus>;
  scale(resourceId: string, newSize: number): Promise<void>;
  destroy(resourceId: string): Promise<void>;
}

// Current implementation
class MockDeploymentProvider implements DeploymentProvider {
  // Simulates deployment with mock data
}

// Phase 1 implementation
class DockerDeploymentProvider implements DeploymentProvider {
  // Deploys to local Docker daemon
}

// Phase 2 implementations
class DockerSwarmProvider implements DeploymentProvider {
  // Deploys across Docker Swarm cluster
}

class KubernetesProvider implements DeploymentProvider {
  // Deploys to Kubernetes cluster
}

// Phase 3 implementations
class TerraformCloudProvider implements DeploymentProvider {
  // Uses Terraform for cloud provisioning
}

class DigitalOceanProvider implements DeploymentProvider {
  // Uses DigitalOcean API directly
}
```

### Resource Templates

**Available Templates:**

1. **IPFS Cluster (3 Nodes)** - `ipfs-cluster-small`
   - 3 IPFS nodes with automatic replication
   - Cluster coordination via CRDT consensus
   - Load-balanced gateway access
   - Mock endpoint: `http://ipfs-cluster-{id}.local:9094`

2. **PostgreSQL Small** - `postgres-small`
   - 2 vCPUs, 4GB RAM, 10GB storage
   - Automated daily backups
   - Connection pooling (PgBouncer)
   - Mock endpoint: `postgresql://postgres-{id}.local:5432/maindb`

3. **PostgreSQL Medium** - `postgres-medium`
   - 4 vCPUs, 16GB RAM, 50GB storage
   - Read replica for high availability
   - Point-in-time recovery
   - Mock endpoint: `postgresql://postgres-{id}.local:5432/maindb`

4. **Basic Storage** - `small-storage`, `medium-storage`, `large-storage`
   - Single IPFS node configurations
   - 5GB, 25GB, 100GB options

### Deployment Flow

```mermaid
User Clicks "Create Resource"
    ↓
Select Template (e.g., IPFS Cluster)
    ↓
Configure (name, size, team)
    ↓
Review & Submit
    ↓
Server Action (createResource)
    ↓
Database: Create resource (status=PROVISIONING)
    ↓
Deployment Service: deployResource()
    ↓
Background Process:
  - Stage 1: Initialising (0%)
  - Stage 2: Allocating resources (20%)
  - Stage 3: Configuring services (40%)
  - Stage 4: Provisioning infrastructure (60%)
  - Stage 5: Verifying deployment (80%)
  - Stage 6: Complete (100%)
    ↓
Update Database:
  - status = ACTIVE
  - endpoint = generated URL
  - credentials = encrypted credentials
  - configuration = deployment config
    ↓
User sees deployment complete
```

### Security & Isolation

**Container Isolation:**
- Separate Docker networks per user/organisation
- No direct container-to-container communication across users
- Firewall rules for external access only

**Credential Management:**
- Secrets stored encrypted in PostgreSQL `credentials` JSONB field
- Environment variables for deployment service access
- SSH keys/API tokens never exposed to users
- Automatic credential rotation (future)

**Resource Quotas:**
- Docker CPU limits (e.g., `--cpus=2.0`)
- Memory limits (e.g., `--memory=4g`)
- Storage limits via volume quotas
- Network bandwidth throttling (future)

### Monitoring & Health Checks

**Resource Health:**
- Periodic polling of deployed resources
- HTTP health check endpoints
- Container status monitoring
- Automatic restart on failure

**Metrics Tracked:**
- CPU/RAM usage per resource
- Storage consumption
- Network bandwidth
- Request counts (for billing)

**Alerting:**
- User notifications for resource failures
- Admin alerts for capacity limits
- Cost threshold warnings

### Migration Path

**From Mock to Real:**

1. **Swap Provider in Deployment Service:**
   ```typescript
   // Before (mock)
   const provider = new MockDeploymentProvider();

   // After (Docker)
   const provider = new DockerDeploymentProvider({
     dockerSocket: '/var/run/docker.sock',
     networkPrefix: 'user-resources',
     portRange: { start: 19000, end: 29000 }
   });
   ```

2. **Update Configuration:**
   - Add Docker socket access to Next.js container
   - Configure dynamic port allocation
   - Set resource quotas per tier

3. **Database Schema (No Changes Required):**
   - `endpoint` field stores real URLs
   - `credentials` field stores real credentials
   - `configuration` field stores deployment metadata

4. **User Experience (Unchanged):**
   - Same wizard flow
   - Same deployment progress UI
   - Real credentials instead of mock

### Cost Management

**Pricing Tiers:**
- Free: Limited resources, shared infrastructure
- Basic: Dedicated small resources
- Pro: Larger resources, guaranteed uptime
- Enterprise: Custom resources, SLA

**Billing Integration:**
- Stripe for subscription management
- Usage tracking per resource
- Monthly invoicing
- Pay-per-use for premium features

---

**Architecture Status**: ✅ Production Ready (Mock Deployment) | 🚧 In Progress (Real Deployment)
**Last Updated**: 2025-10-02
**Key Insight**: IPFS Cluster eliminates the need for external load balancing and provides intelligent content distribution out of the box. Prisma-first validation reduces complexity while maintaining data integrity. Resource deployment uses provider abstraction for seamless migration from mock to production infrastructure.