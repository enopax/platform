# Application Architecture

## System Overview

The Enopax Platform is a Next.js 15 web application designed for managing organisations, projects, and deploying infrastructure resources. The architecture is built around three core systems:

1. **Hierarchical Organisation Structure** - Organisations contain projects, projects contain resources
2. **Name-Based Routing** - Human-readable URLs using organisation and project names
3. **Role-Based Access Control** - Flexible permission system with organisation-wide roles

---

## Organisation Structure

### Hierarchical Model

```
Organisation
├── Teams (grouping users for collaboration)
├── Projects (logical groupings of resources)
│   ├── Resources (IPFS clusters, databases, etc.)
│   └── Team assignments (which teams can work on project)
└── Members (users with roles: MEMBER, MANAGER, ADMIN, OWNER)
```

### Name-Based Routing

URLs use organisation and project names instead of IDs for better usability:

```
/orga/[orgName]                              # Organisation overview
/orga/[orgName]/settings                     # Organisation settings
/orga/[orgName]/members                      # Member management
/orga/[orgName]/teams                        # Team management
/orga/[orgName]/[projectName]               # Project details
/orga/[orgName]/[projectName]/settings      # Project settings
/orga/[orgName]/[projectName]/[resourceName]  # Resource details
```

**Key Features:**
- Alphanumeric names with hyphens (e.g., `my-org`, `prod-project`)
- Global uniqueness for organisation names
- Scoped uniqueness for project names (unique per organisation)
- Blocked names list prevents conflicts with reserved routes
- Automatic URL slug generation and validation

**Implementation:**
- Validation in `/src/lib/name-validation.ts`
- Blocked names in `/src/lib/constants/blocked-names.json`
- Database constraints enforce uniqueness
- URL parameters parsed in route handlers

---

## Context API Architecture

### Purpose

React Context API provides global state management across nested route groups without prop drilling. This is essential for deeply nested routes that need access to organisation, project, and resource data.

### Available Contexts

#### OrganisationContext
**Location**: `/src/components/providers/OrganisationProvider.tsx`

**Data Provided:**
- Organisation ID and name
- Organisation members and roles
- Teams within organisation
- User's role in organisation

**Usage:**
```tsx
// In layout or page
<OrganisationProvider>
  {/* Child components can access via useOrganisationContext() */}
</OrganisationProvider>

// In component
const { organisation, userRole, teams } = useOrganisationContext();
```

**Benefits:**
- Access organisation data without passing props through 10+ levels
- Consistent access across all pages in organisation route group
- Automatic updates when organisation data changes

#### ProjectContext
**Location**: `/src/components/providers/ProjectProvider.tsx`

**Data Provided:**
- Project ID and name
- Project configuration
- Associated team assignments
- Resource allocation

**Usage:**
```tsx
const { project, resources, teams } = useProjectContext();
```

#### ResourceContext
**Location**: `/src/components/providers/ResourceProvider.tsx`

**Data Provided:**
- Resource ID and configuration
- Deployment status and progress
- Endpoint and credentials
- Resource template information

### Context Implementation Pattern

```tsx
// Create context
const MyContext = createContext<ContextType | null>(null);

// Create provider component
export function MyProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Fetch data from server or route params
  }, []);

  return (
    <MyContext.Provider value={{ data }}>
      {children}
    </MyContext.Provider>
  );
}

// Create hook for easy access
export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
}
```

### When to Use Contexts

✅ **Use contexts for:**
- Shared data across multiple route groups
- Avoiding prop drilling through 3+ component levels
- Application-wide state (organisation, project, user)

❌ **Don't use contexts for:**
- Local component state
- Temporary UI state (form inputs, modals)
- Frequently changing data (use state management instead)

---

## Permission System

### Role Hierarchy

The platform implements organisation-wide role-based permissions:

```
OWNER
  ├── ADMIN
  │   ├── MANAGER
  │   │   └── MEMBER
```

### Role Definitions

| Role | Permissions | Use Case |
|------|------------|----------|
| **OWNER** | Full control, manage roles/billing, delete organisation | Founder/account owner |
| **ADMIN** | Manage members/roles, project creation, resource templates | Senior team member |
| **MANAGER** | Invite members, create projects, manage teams | Team lead |
| **MEMBER** | Access all projects, create resources, limited configuration | Standard user |

### Simplified Permission Model

**Key Design Decision**: All organisation members can access all projects.

Instead of fine-grained project-level permissions, the platform uses:
- **Teams** for logical grouping and collaboration
- **Roles** for capability-based access
- **Projects** for organisational structure

This simplification provides:
- Easier permission management
- Reduced database queries
- Clear responsibility structure
- Team-based collaboration

### Permission Checking

**Location**: `/src/lib/permissions.ts`

```typescript
// Check organisation permissions
async function checkOrganisationPermissions(
  userId: string,
  organisationId: string,
  requiredRole: 'MEMBER' | 'MANAGER' | 'ADMIN' | 'OWNER'
): Promise<boolean>

// Check project permissions
async function checkProjectPermissions(
  userId: string,
  projectId: string,
  requiredRole: 'MEMBER' | 'MANAGER' | 'ADMIN' | 'OWNER'
): Promise<boolean>
```

### Implementation in Server Actions

```typescript
export async function updateProject(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  const projectId = formData.get('projectId');

  // Check permission
  const canManage = await checkProjectPermissions(
    session.user.id,
    projectId,
    'ADMIN'
  );

  if (!canManage) throw new Error('Insufficient permissions');

  // Proceed with update
}
```

---

## Database Schema Architecture

### Key Tables

**Organisations**
- `id`: Unique identifier
- `name`: URL-safe, globally unique identifier
- `description`: Optional org description
- `createdBy`: User who created the organisation
- `createdAt`, `updatedAt`: Timestamps

**Projects**
- `id`: Unique identifier
- `name`: URL-safe, unique per organisation
- `organisationId`: Foreign key to organisations
- `description`: Optional project description
- `createdBy`: User who created the project

**Resources**
- `id`: Unique identifier
- `name`: URL-safe, unique per project
- `projectId`: Foreign key to projects
- `type`: Resource type (IPFS_CLUSTER, POSTGRES, etc.)
- `status`: PROVISIONING, ACTIVE, INACTIVE
- `endpoint`: Generated endpoint URL
- `credentials`: Encrypted JSONB credentials
- `configuration`: Deployment configuration

**User Roles**
- `userId`: Foreign key to user
- `organisationId`: Foreign key to organisation
- `role`: MEMBER, MANAGER, ADMIN, or OWNER
- `assignedAt`: When role was assigned

### Constraints

- Organisation names must be unique globally
- Project names must be unique per organisation
- Resource names must be unique per project
- Users can only have one role per organisation
- Deletion cascades: deleting org deletes projects and resources

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
**Last Updated**: 2025-12-12
**Key Insights**:
- Name-based routing provides human-readable URLs whilst maintaining unique constraints
- Context API eliminates prop drilling for deeply nested route hierarchies
- Simplified permission model (role-based, all-members-access-all-projects) reduces complexity without sacrificing security
- IPFS Cluster eliminates the need for external load balancing and provides intelligent content distribution
- Resource deployment uses provider abstraction for seamless migration from mock to production infrastructure
- Database constraints enforce URL name uniqueness at the schema level