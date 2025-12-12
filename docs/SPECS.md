# Web Application Specifications

**Infrastructure Deployment Platform - Technical Specifications**

This document provides comprehensive technical specifications for the Next.js web application that manages organisations, projects, and deploys infrastructure resources.

---

## 📋 System Overview

### Application Type
**Next.js 15 + TypeScript Web Application** providing a comprehensive platform for managing organisations, projects, and deploying infrastructure resources (IPFS clusters, PostgreSQL databases, etc.) with role-based access control and team collaboration.

### Core Purpose
- **Primary**: Infrastructure resource deployment and management platform
- **Secondary**: Organisation and project structure with hierarchical access control
- **Tertiary**: Real-time resource deployment tracking and monitoring
- **Quaternary**: Integration with external Resource API for production provisioning

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

#### Organisation Roles
- **MEMBER**: Basic access to organisation resources and projects
- **MANAGER**: Can invite members, create projects, and manage teams
- **ADMIN**: Full administrative access except organisation deletion
- **OWNER**: Full control including organisation deletion and billing

#### Authentication Features
- NextAuth.js v5 integration
- Multiple provider support
- Session-based authentication
- Role-based access control (organisation-scoped)
- Secure cookie handling
- Single role per organisation per user

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
- Team member assignments
- Team-based collaboration for projects
- Flexible team composition

**Note**: Teams are simplified in the current design. All organisation members can access all projects regardless of team assignment.

### 4. Project Management System

#### Project Features
- Create and manage projects within organisations
- Project-level resource allocation
- Resource grouping by project
- Project-level settings and configuration
- Team assignment to projects (for collaboration)

**Routing**: Projects use name-based URLs: `/orga/[orgName]/[projectName]`

#### Project Data Model
```prisma
model Project {
  id              String    @id @default(cuid())
  name            String    // URL-safe name, unique per organisation
  description     String?
  organisationId  String
  organisation    Organisation @relation(fields: [organisationId], references: [id])
  resources       Resource[]
  teams           Team[]     // Teams assigned to project
  createdBy       String
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
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

---

## 📊 Data Architecture

### Database Schema Overview
- **Users**: Authentication and profile management
- **Organisations**: Top-level grouping entity with name-based uniqueness
- **User Roles**: Organisation-scoped role assignments
- **Teams**: Collaboration units within organisations
- **Projects**: Work containers linked to organisations
- **Resources**: Infrastructure resources within projects
- **Deployments**: Deployment status and configuration tracking

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

**Route Structure**: Name-based URLs using organisation and project names

1. **Welcome/Onboarding** (`/welcome`)
   - Multi-step setup wizard
   - Organisation creation (user becomes owner)
   - Optional team creation
   - First project setup

2. **Main Dashboard** (`/main`)
   - Overview of organisations
   - Quick links to recent projects
   - Quick actions for common tasks
   - Resource overview

3. **Organisation Overview** (`/orga/[orgName]`)
   - Organisation dashboard
   - Project listings with resource usage
   - Member overview
   - Quick navigation to manage areas

4. **Members Management** (`/orga/[orgName]/members`)
   - View organisation members
   - Invite new members
   - Manage member roles
   - Remove members

5. **Teams Management** (`/orga/[orgName]/teams`)
   - Create and manage teams
   - Assign members to teams
   - Team collaboration features

6. **Project Details** (`/orga/[orgName]/[projectName]`)
   - Project dashboard
   - Resource listings for project
   - Project settings
   - Team assignments

7. **Resource Management** (`/orga/[orgName]/[projectName]/[resourceName]`)
   - Resource details
   - Deployment status
   - Endpoint and credentials display
   - Resource configuration

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
- **Resource API Integration**: External API for infrastructure provisioning
- **Deployment Status Polling**: Real-time deployment progress tracking
- **Credential Management**: Secure credential storage and retrieval

---

## 📈 Deployment Monitoring

### Deployment Progress Tracking
- Real-time status polling via `/api/resources/[id]/deployment-status`
- 2-second polling interval for live updates
- Six-stage deployment progress (init → allocate → configure → provision → verify → complete)
- Detailed status messages for each stage

### Resource Status Tracking
- **PROVISIONING**: Resource currently being deployed
- **ACTIVE**: Resource running and operational
- **INACTIVE**: Resource stopped or failed
- **MAINTENANCE**: Resource under maintenance

### Health & Performance
- Endpoint availability verification
- Credential validity checking
- Resource quota monitoring
- Deployment failure tracking and alerts

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

### Database Integration
- **PostgreSQL**: Primary data store (port 5432)
- **Prisma ORM**: Type-safe database operations
- **Schema Synchronisation**: `prisma db push` for schema updates (no migrations)

### Resource API Integration
- **External API**: Communication with Resource API for infrastructure provisioning
- **JSON Payloads**: Request/response via JSON
- **Authentication**: API key or credential-based authentication
- **Timeout Handling**: Request timeouts for failed deployments

### Development Services
- **Next.js Development**: Port 3000 (standalone)
- **PostgreSQL**: Port 5432 (Docker container)
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