# Infrastructure

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