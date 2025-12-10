# Web Application Specifications

**IPFS Storage Cluster Web Interface - Technical Specifications**

This document provides comprehensive technical specifications for the Next.js web application that interfaces with the IPFS distributed storage cluster.

---

## 📋 System Overview

### Application Type
**Next.js 15 + TypeScript Web Application** providing a modern interface for IPFS distributed storage management with comprehensive user management, team collaboration, and file operations.

### Core Purpose
- **Primary**: Web interface for IPFS storage cluster operations
- **Secondary**: User and team management for collaborative file storage
- **Tertiary**: Analytics and monitoring dashboard for storage usage

---

## 🏗️ Technical Architecture

### Framework Stack
- **Frontend**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + Radix UI + Tremor Components
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Testing**: Jest with multi-environment setup
- **Validation**: Prisma-first validation approach

### Architecture Patterns
- **Service Layer Architecture**: Shared business logic between API routes and Server Actions
- **Progressive Enhancement**: Server Actions for forms, API routes for external integration
- **Unified API**: Both internal and external interfaces use identical service layer
- **Type Safety**: Full TypeScript coverage with Prisma-generated types

---

## 🔧 Core Features Specification

### 1. User Management System

#### User Roles
- **GUEST**: Limited read-only access
- **CUSTOMER**: Full application access (default for new users)
- **ADMIN**: Administrative access to all resources

#### Authentication Features
- NextAuth.js v5 integration
- Multiple provider support
- Session-based authentication
- Role-based access control
- Secure cookie handling

### 2. Organisation Management

#### Core Functionality
- Create and manage organisations
- Organisation ownership model
- Member management across teams
- Organisation-scoped operations
- Billing/subscription management (mocked initially)

#### Data Model
```prisma
model Organisation {
  id          String   @id @default(cuid())
  name        String
  description String?
  website     String?
  email       String?
  phone       String?
  address     String?
  ownerId     String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3. Team Management System

#### Team Features
- Create and manage teams within organisations
- Team leader assignments
- Member invitation system
- Role-based permissions
- Team-specific storage quotas

#### API Endpoints
```
POST   /api/team/create           # Create new team
GET    /api/team/list             # List teams
GET    /api/team/[id]             # Get team details
PUT    /api/team/[id]             # Update team
DELETE /api/team/[id]             # Soft delete team
GET    /api/team/[id]/members     # List team members
POST   /api/team/[id]/members     # Add team member
DELETE /api/team/[id]/members     # Remove team member
```

### 4. Project Management System

#### Project Features
- Create and manage projects
- Assign projects to teams
- Project-specific file management
- Storage allocation per project
- Project documentation and repository links

#### API Endpoints
```
POST   /api/project/create        # Create new project
GET    /api/project/list          # List projects
GET    /api/project/[id]          # Get project details
PUT    /api/project/[id]          # Update project
DELETE /api/project/[id]          # Soft delete project
GET    /api/project/[id]/files    # List project files
```

### 5. Resource Management System

#### One-Click Resource Deployment
**Feature**: Provision infrastructure resources (IPFS clusters, databases) with a single click

**Supported Resource Types:**
- **IPFS Cluster**: Distributed storage with 3-node replication
- **PostgreSQL**: Managed relational database (small/medium tiers)
- **Basic Storage**: Single IPFS nodes (5GB/25GB/100GB)

#### Resource Templates

**Template Structure:**
```typescript
interface ResourceTemplate {
  id: string;                    // Unique template identifier
  name: string;                  // Display name
  description: string;           // User-facing description
  type: 'STORAGE' | 'DATABASE';  // Resource category
  config: {
    storageSize?: number;        // Storage allocation (GB)
    features: string[];          // Feature list for UI
  };
  pricing: {
    estimate: string;            // Price display
    period: string;              // Billing period
  };
  deployment: {
    mockEndpoint: string;        // Template for endpoint generation
    mockCredentials: {};         // Credential template
    provisioningTime: number;    // Deployment duration (ms)
    configuration: {};           // Infrastructure configuration
  };
}
```

**Available Templates:**

1. **IPFS Cluster (3 Nodes)** - `ipfs-cluster-small`
   - Features: 3 IPFS nodes, automatic replication, cluster API, load-balanced gateway
   - Pricing: $12/month
   - Configuration: CRDT consensus, replication (min: 2, max: 3), cluster peers
   - Deployment time: ~5 seconds (mock)

2. **PostgreSQL Small** - `postgres-small`
   - Features: 2 vCPUs, 4GB RAM, 10GB storage, daily backups, SSL, point-in-time recovery
   - Pricing: $8/month
   - Configuration: PostgreSQL 17, connection pooling, automated backups
   - Deployment time: ~4 seconds (mock)

3. **PostgreSQL Medium** - `postgres-medium`
   - Features: 4 vCPUs, 16GB RAM, 50GB storage, read replica, advanced pooling
   - Pricing: $25/month
   - Configuration: PostgreSQL 17, 1 read replica, 30-day backup retention
   - Deployment time: ~6 seconds (mock)

#### Deployment Lifecycle

**Status Flow:**
```
PROVISIONING → ACTIVE | INACTIVE (on failure)
```

**Deployment Stages:**
1. **init** (0%) - Initialising deployment
2. **allocate** (20%) - Allocating resources
3. **configure** (40%) - Configuring services
4. **provision** (60%) - Provisioning infrastructure
5. **verify** (80%) - Verifying deployment
6. **complete** (100%) - Deployment complete

**Real-time Tracking:**
- Progress stored in `configuration.deploymentProgress`
- Stage stored in `configuration.deploymentStage`
- Status message in `configuration.deploymentMessage`
- Frontend polls `/api/resources/[id]/deployment-status` every 2 seconds

#### Resource Data Model

```prisma
model Resource {
  id             String         @id @default(cuid())
  name           String
  description    String?
  type           ResourceType   // STORAGE, DATABASE, etc.
  status         ResourceStatus // PROVISIONING, ACTIVE, INACTIVE

  endpoint       String?        // Generated endpoint URL
  credentials    Json?          // Encrypted credentials
  configuration  Json?          // Deployment config + metadata
  quotaLimit     BigInt?        // Resource quota (bytes)
  currentUsage   BigInt         @default(0)

  ownerId        String
  organisationId String
  isPublic       Boolean        @default(false)
  tags           String[]

  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  deletedAt      DateTime?
}

enum ResourceStatus {
  PROVISIONING  // Currently being deployed
  ACTIVE        // Running and operational
  INACTIVE      // Stopped or failed
  MAINTENANCE   // Under maintenance
  DELETED       // Soft deleted
}
```

#### Deployment Service Architecture

**Current Implementation: Mock Deployment**

```typescript
// src/lib/deployment-service.ts
export async function deployResource(
  resourceId: string,
  templateId: string
): Promise<DeploymentResult> {
  // 1. Set resource to PROVISIONING status
  // 2. Run background deployment simulation
  // 3. Update progress through 6 stages
  // 4. Generate mock endpoint/credentials
  // 5. Set resource to ACTIVE with results
}
```

**Mock Output Example (IPFS Cluster):**
```json
{
  "endpoint": "http://ipfs-cluster-abc12345.local:9094",
  "credentials": {
    "clusterSecret": "mock-cluster-secret-abc12345",
    "apiToken": "mock-api-token-abc12345",
    "gatewayUrl": "http://gateway-abc12345.local:8080"
  },
  "configuration": {
    "templateId": "ipfs-cluster-small",
    "nodes": 3,
    "replicationMin": 2,
    "replicationMax": 3,
    "clusterPeers": [
      "/ip4/10.0.1.1/tcp/9096/p2p/Qmabc12345Peer1",
      "/ip4/10.0.1.2/tcp/9096/p2p/Qmabc12345Peer2",
      "/ip4/10.0.1.3/tcp/9096/p2p/Qmabc12345Peer3"
    ],
    "deployedAt": "2025-10-02T10:30:00Z"
  }
}
```

#### API Endpoints

```
GET    /api/resources/[id]/deployment-status
       Returns: { status, configuration, endpoint, credentials }

POST   /api/resources/create
       Creates resource and triggers deployment

GET    /api/resources/[id]
       Get resource details including deployment info
```

#### User Experience Flow

1. **Template Selection**
   - Visual cards with icons, features, and pricing
   - Popular templates highlighted
   - Recommended options for common use cases

2. **Configuration**
   - Resource name (auto-generated from template)
   - Description (optional)
   - Storage size slider (for storage resources)
   - Team assignment

3. **Review & Create**
   - Summary of selected configuration
   - Pricing estimate
   - Feature list
   - One-click creation

4. **Deployment Progress**
   - Real-time progress bar (0-100%)
   - Current stage indicator
   - Status messages
   - Estimated time remaining

5. **Completion**
   - Success message
   - Endpoint display (copyable)
   - Credentials display (copyable, masked)
   - Navigation to resource details

#### Future Migration Strategy

**Phase 1: Docker Deployment (Next Step)**
- Replace `MockDeploymentProvider` with `DockerDeploymentProvider`
- Use `dockerode` to control local Docker daemon
- Generate dynamic Docker Compose configs
- Allocate dynamic ports (19000+)
- Real endpoints instead of mock

**Phase 2: Multi-Server**
- Deploy across server fleet
- Kubernetes or Docker Swarm orchestration
- Load balancing and auto-scaling

**Phase 3: Cloud Integration**
- AWS/DigitalOcean/Hetzner provider options
- Terraform infrastructure-as-code
- User-linked cloud accounts or reseller billing

### 6. File Management System

#### IPFS Integration
- **Cluster API**: Primary interface (port 9094)
- **Storage Nodes**: 4 IPFS nodes for distributed storage
- **Replication**: Automatic content replication via cluster
- **Pinning**: Cluster-managed pin operations

#### File Operations
- Upload files to IPFS cluster
- Real-time file sync monitoring
- Advanced search and filtering
- Team-based file organisation
- Storage quota management

#### File Storage Architecture
```
IPFS Cluster (9094) ← Primary API for all operations
│
├── Storage Node 1 (5001, 8080, 4001)
├── Storage Node 2 (5002, 8081, 4002)
├── Storage Node 3 (5003, 8082, 4003)
└── Storage Node 4 (5004, 8083, 4004)
```

---

## 📊 Data Architecture

### Database Schema Overview
- **Users**: Authentication and profile management
- **Organisations**: Top-level grouping entity
- **Teams**: Collaboration units within organisations
- **Projects**: Work containers with file associations
- **Files**: IPFS content metadata and ownership
- **Metrics**: Storage usage and analytics

### Validation Strategy
**Prisma-First Validation Approach**:
- Database schema enforces constraints
- Minimal application-layer validation
- File operations use JavaScript validation
- Let Prisma handle type safety and constraints

---

## 🎨 User Experience Specifications

### Design System
- **Component Library**: Tremor components (priority 1)
- **UI Primitives**: Radix UI (when Tremor unavailable)
- **Custom Components**: Following established patterns
- **Icons**: Remix Icons (`@remixicon/react`)

### UX Patterns

#### Form Design
- **Action Detection**: `const action = entity ? updateEntity : createEntity`
- **Search Components**: UserSearch/GenericSearch over static Select
- **Date Selection**: Tremor DatePicker components
- **Error Handling**: Field-specific errors with `hasError` props

#### State Management
- **Form State**: `useActionState` hook (mandatory)
- **Union Types**: `type FormState = CreateState | UpdateState`
- **Minimal Complexity**: Prefer derived state over stored state

#### Loading & Async States
- **Search Debouncing**: 300ms default, 2 character minimum
- **Form Submissions**: Disable buttons during submission
- **Success Feedback**: Clear success messages before redirect

### User Journey Specifications

#### Post-Registration Flow
1. **Welcome/Onboarding** (`/main/welcome`)
   - Multi-step setup wizard
   - Organisation creation (user becomes owner)
   - Team creation (user becomes leader)
   - First project setup

2. **Main Dashboard** (`/main`)
   - Overview cards for projects, storage, team members
   - Quick actions for common tasks
   - Recent activity feed
   - Storage metrics visualisation

3. **Organisation Management** (`/main/organizations`)
   - Organisation-level settings
   - Member management across teams
   - Storage limits and billing

4. **Team Management** (`/main/teams`)
   - Team collaboration features
   - Member permissions
   - Team-specific quotas

5. **Project Management** (`/main/projects`)
   - Project dashboards
   - File management interface
   - Storage allocation controls
   - Team collaboration tools

6. **File Management** (`/main/files`)
   - IPFS file browser
   - Upload interface
   - Storage analytics
   - Pinning management

---

## 🧪 Testing Specifications

### Multi-Layer Testing Strategy

#### 1. Validation Layer (Node.js environment)
- Zod schema validation tests
- Form data parsing verification
- File upload constraint testing

#### 2. Service Layer (Node.js environment)
- Business logic service tests
- Database interaction validation
- Service method functionality

#### 3. Actions Layer (Node.js environment)
- Server Action structure verification
- Authentication and authorisation testing
- Service integration validation

#### 4. Presentation Layer (JSDOM environment)
- React component rendering tests
- User interaction handling
- State management verification

### Test Configuration
```javascript
// Jest multi-project setup
module.exports = {
  projects: [
    'jest.config.validation.js',
    'jest.config.services.js',
    'jest.config.actions.js',
    'jest.config.components.js'
  ]
};
```

### Test Commands
```bash
npm test                    # Run all tests
npm run test:validation     # Validation schema tests
npm run test:services       # Service layer tests
npm run test:actions        # Server action tests
npm run test:components     # React component tests
```

---

## 🔌 API Specifications

### Authentication Requirements
- All API endpoints require authentication
- Role-based access control enforcement
- Session-based security model

### Response Formats
```typescript
// Success Response
interface SuccessResponse<T> {
  success: true;
  data: T;
}

// Error Response
interface ErrorResponse {
  success: false;
  error: string;
}
```

### External Integration Points
- **Team Management API**: Complete REST API for team operations
- **Project Management API**: Full CRUD operations with file associations
- **File Management API**: IPFS cluster integration endpoints

---

## 📈 Monitoring & Analytics

### Metrics System Architecture
**Single Point of Truth**: IPFS Cluster API as authoritative source

```
Next.js App ← → PostgreSQL ← → IPFS Cluster (9094)
                  (Cache)        (Truth Source)
                     ↑                ↓
              Computed Views    Real Storage State
```

### Real-time Analytics Features
- Storage usage tracking (real IPFS data)
- Pin status monitoring
- Node distribution visibility
- Replication health tracking
- Performance metrics

### Background Sync Strategy
- Periodic sync with IPFS cluster (15-minute intervals)
- Database caching for performance
- Real-time accuracy for user metrics

---

## 🚀 Development Standards

### Code Quality Requirements
- **TypeScript**: Strict mode enforcement
- **ESLint**: Consistent code style
- **Security**: Never expose secrets or keys
- **Testing**: Comprehensive test coverage

### Component Standards
1. **Tremor components** from `/components/common/` (priority 1)
2. **Radix UI primitives** when Tremor unavailable
3. **Custom components** following established patterns
4. **NEVER** put new components in `/common` folder

### File Creation Rules
- **ALWAYS** prefer editing existing files
- **NEVER** create documentation files unless requested
- **NEVER** put client components in `/app` (except page.tsx)
- **NEVER** push files outside `/next-app` folder

### Form Best Practices
- **ALWAYS** use `useActionState` hook
- Detect create/update mode by entity presence
- Use UserSearch components for user selection
- Include hidden input fields for entity IDs
- Apply consistent error handling patterns

---

## 🔧 Infrastructure Integration

### IPFS Cluster Connection
- **Primary API**: http://localhost:9094 (cluster management)
- **Storage Nodes**: Individual node access for debugging
- **Gateway Access**: Ports 8080-8083 for content serving
- **Monitoring**: Prometheus metrics from individual nodes

### Database Integration
- **PostgreSQL**: Primary data store (port 5432)
- **Prisma ORM**: Type-safe database operations
- **Migration Strategy**: Prisma migrate for schema changes

### External Services
- **Prometheus**: Metrics collection (port 9090)
- **Grafana**: Dashboard visualisation (port 3001)
- **NextAuth Providers**: Authentication integration

---

## 📝 Development Workflow

### Environment Setup
1. IPFS storage cluster running
2. PostgreSQL database configured
3. Environment variables set
4. Dependencies installed: `npm install`
5. Development server: `npm run dev`

### Code Standards
- Follow existing conventions
- Mimic surrounding code style
- Use established libraries
- **NEVER** add comments unless requested
- British English spelling throughout

### Pull Request Workflow
Triggered by `pr` command:
1. Pre-flight checks (git status, lint)
2. Branch management and push
3. Comprehensive PR creation with testing checklist

---

## 🎯 Success Criteria

### Performance Targets
- Page load times < 2 seconds
- Real-time sync latency < 5 seconds
- Database query response < 100ms
- File upload progress feedback

### Functionality Requirements
- All API endpoints fully functional
- Complete test coverage (130+ tests)
- IPFS cluster integration working
- User management workflows complete

### Quality Standards
- TypeScript strict mode compliance
- Zero console errors in production
- Comprehensive error handling
- Security best practices implemented

---

*This specification document serves as the single source of truth for web application development requirements and should be updated as the system evolves.*

**Version**: 1.0
**Last Updated**: 2025-09-22
**Status**: ✅ Complete Specification