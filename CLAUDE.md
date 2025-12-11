# CLAUDE.md

**AI Assistant Reference File**  
This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

---

## 📚 Documentation Index

This file serves as the quick reference guide for AI assistants. For comprehensive documentation, see the files in `/docs/`:

| Document | Purpose |
|----------|---------|
| **CLAUDE.md** (this file) | Quick reference for AI assistants and development commands |
| **[SPECS.md](./docs/SPECS.md)** | Comprehensive web application technical specifications |
| **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** | Detailed technical architecture and system design |
| **[COMPONENTS.md](./docs/COMPONENTS.md)** | Component folder structure and organisation guide |
| **[DESIGN.md](./docs/DESIGN.md)** | Design system, UX guidelines, and component patterns |
| **[BEST-PRACTICES.md](./docs/BEST-PRACTICES.md)** | Development best practices and coding standards |
| **[JEST-TESTS.md](./docs/JEST-TESTS.md)** | Testing strategies and Jest configuration |
| **[BUSINESS-STRATEGY.md](./docs/BUSINESS-STRATEGY.md)** | Business context and strategic decisions |

---

## 🚀 Quick Start Commands

### Development Environment
```bash
# Start PostgreSQL database
npm run docker:dev

# Start Next.js development server (runs standalone)
npm run dev

# Stop database when done
npm run docker:dev:stop
```

### Production Environment
```bash
# Build and start production stack (PostgreSQL + Next.js)
npm run docker:prod

# Rebuild Next.js only (for updates)
npm run docker:prod:rebuild

# View application logs
npm run docker:prod:logs

# Stop production stack
npm run docker:prod:stop
```

### Next.js Development
```bash
npm run dev         # Start development server
npm run build       # Build for production
npm run lint        # Run ESLint
npm test            # Run all tests
```

---

## 🏗️ Architecture Overview

**System Type**: Next.js 15 web application with Docker infrastructure

**Infrastructure Setup**:

**Development**:
- Docker runs: PostgreSQL only
- Next.js runs standalone: `npm run dev` (port 3000)
- Hot reloading enabled for fast development

**Production**:
- Docker runs: PostgreSQL + Next.js (containerised production build)
- Automatic database schema synchronisation via Prisma
- Git-pull deployment workflow with `./deploy.sh`
- No migration files - schema defined in `prisma/schema.prisma`

**Key Services**:
- PostgreSQL (port 5432) - Application database
- Next.js App (port 3000) - Web interface

**Database Management**:
- Uses `prisma db push` for schema synchronisation (not migrations)
- Schema changes deploy automatically on container restart
- Perfect for rapid development and small teams

**🔄 TinyBase Migration (In Progress)**:
- **Status**: Migrating from PostgreSQL + Prisma to TinyBase with file-based storage
- **Progress**: 2/48 tasks completed (4%) - Foundation & Infrastructure: 25%
- **Current**: Custom file persister implemented with atomic writes and JSONL indices
- **See**: `/docs/TINYBASE_MIGRATION_PLAN.md` for detailed migration plan
- **See**: `/docs/file-store/README.md` for file-store research and decision

> 📖 **For detailed architecture information, see [ARCHITECTURE.md](./docs/ARCHITECTURE.md)**

---

## 🎨 Development Guidelines

### Component Library
- **UI Framework**: Radix UI + Tailwind CSS
- **Components**: Tremor components available in `/components/common/` folder
- **Icons**: Remix Icons (`@remixicon/react`)
- **Organisation**: See [COMPONENTS.md](./docs/COMPONENTS.md) for detailed folder structure

### Code Patterns
- **Forms**: Action selection based on entity presence (not explicit mode props)
- **Search**: Use UserSearch/GenericSearch components over static Select
- **Dates**: Tremor DatePicker components over native date inputs
- **State**: Union types for form states, minimal state complexity

### Database
- **ORM**: Prisma with PostgreSQL
- **Auth**: NextAuth.js with Prisma adapter
- **Queries**: Limit results, select only needed fields

> 🎯 **For comprehensive UX guidelines, see [DESIGN.md](./docs/DESIGN.md)**

---

## 🔧 Development Notes

### Component Preferences
1. **Tremor components** in `/components/common/` folder (first priority)
2. **Radix UI primitives** when Tremor not available
3. **Custom components** following established patterns

### Command Execution
- If `npx` commands fail, ask the user to run them manually
- Use the simplified npm scripts for Docker operations
- Prefer manual Next.js development over containerized

### Architecture Patterns
- **Forms**: Entity-based action selection with hidden ID fields
- **Search**: Real database queries with debouncing and pagination
- **Focus**: Work with Radix UI's focus management
- **Routes**: All entity detail and creation pages are under organisation tree structure
- **Data Fetching**: Server-side in layouts, client components only for interactivity

### Route Structure
**Name-Based Routes with Hierarchical Structure:**
- Organisations: `/orga/[orgName]` - Organisation overview and management
- Teams: `/orga/[orgName]/teams` - Team management
- Members: `/orga/[orgName]/members` - Organisation member management
- Projects: `/orga/[orgName]/[projectName]` - Project details
- Resources: `/orga/[orgName]/[projectName]/[resourceName]` - Resource details
- Resource Creation: `/orga/[orgName]/[projectName]/resources/new` - Create new resource
- Settings: `/orga/[orgName]/settings` and `/orga/[orgName]/[projectName]/settings`

**Key Points:**
- Organisation context uses **organisation name** in URL path (not ID)
- Project context uses **project name** in URL path (not ID)
- Organisation and project names are unique within their scope
- Names are URL-safe (alphanumeric + hyphens)
- Forms receive names from URL params and look up entities by name
- Sidebar automatically detects current organisation/project from pathname
- All internal links use name-based URLs for human readability
- Contexts provide access to entity data without prop drilling

---

## 📋 Important Reminders

### Code Modification Principles
- **CRITICAL**: Be mindful of user changes and NEVER overwrite them
- **ALWAYS** respect and preserve manual user modifications to files
- **NEVER** revert or override changes that the user has made themselves
- **ALWAYS** build upon user changes rather than replacing them
- **CHECK** system reminders for user modifications before making changes

### File Creation Rules
- **ALWAYS** prefer editing existing files over creating new ones
- **NEVER** proactively create documentation files unless explicitly requested
- **NEVER** after planning, do all steps at once. Split the work into smaller chunks and let's do it step by step
- **NEVER** put newly created components in the /common folder. This onbe is reserved for tremor components and UI related
- **NEVER** push files outside of the next-app folder

### Missing Dependencies or Commands
- **ALWAYS** Ask or prompt me to install missing dependencies or execute commands
- **NEVER** Work around commands that you are not able to execute

### Code Standards
- Follow existing code conventions and patterns
- Mimic the style of surrounding code
- Use established libraries and utilities
- **NEVER** add comments unless explicitly asked
- **NEVER** expose or log secrets and keys

### Form Best Practices
- **ALWAYS** use `useActionState` hook for form state management
- Detect create/update mode by entity presence: `const action = entity ? updateEntity : createEntity`
- Use UserSearch components instead of static Select dropdowns for user selection
- Include hidden input fields for entity IDs: `{entity && <input type="hidden" name="entityId" value={entity.id} />}`
- Apply consistent error handling with `hasError` props and field-specific error messages

---

## 🚀 Resource Deployment System

### Overview

The application supports **one-click resource deployment** for provisioning infrastructure (IPFS clusters, PostgreSQL databases) with a single button click.

### Current Implementation: Mock Deployment

**Status**: ✅ Implemented
**Purpose**: UI/UX validation and demonstration

**How it works:**
1. User selects template (e.g., "IPFS Cluster (3 Nodes)")
2. Resource created with `status = PROVISIONING`
3. Background deployment service simulates provisioning (2-6 seconds)
4. Progress updates stored in database (6 stages: 0% → 100%)
5. Mock endpoint and credentials generated
6. Resource status changes to `ACTIVE`

### Resource Template System

**Location**: `/src/lib/resource-templates.ts`

**Available Templates:**
- `ipfs-cluster-small` - 3-node IPFS cluster with automatic replication
- `postgres-small` - 2 vCPUs, 4GB RAM, 10GB storage, daily backups
- `postgres-medium` - 4 vCPUs, 16GB RAM, 50GB storage, read replica
- `small-storage`, `medium-storage`, `large-storage` - Single IPFS nodes (5GB/25GB/100GB)

**Adding New Templates:**

```typescript
import { RESOURCE_TEMPLATES } from '@/lib/resource-templates';

RESOURCE_TEMPLATES.push({
  id: 'redis-small',
  name: 'Redis Cache (Small)',
  description: 'In-memory cache for fast data access',
  type: 'DATABASE',
  icon: RiDatabaseLine,
  iconColor: 'text-red-500',
  popular: false,
  config: {
    features: ['2GB RAM', 'Persistence enabled', 'SSL/TLS']
  },
  pricing: {
    estimate: '$5',
    period: 'month'
  },
  deployment: {
    mockEndpoint: 'redis://redis-{id}.local:6379',
    mockCredentials: {
      host: 'redis-{id}.local',
      port: '6379',
      password: 'mock-password-{id}'
    },
    provisioningTime: 3000,
    configuration: {
      maxMemory: '2gb',
      persistence: true
    }
  }
});
```

### Deployment Service

**Location**: `/src/lib/deployment-service.ts`

**Key Functions:**

```typescript
// Deploy a resource using a template
deployResource(resourceId: string, templateId: string): Promise<DeploymentResult>

// Get current deployment status
getDeploymentStatus(resourceId: string): Promise<DeploymentProgress | null>

// Simulate deployment with progress tracking
simulateDeployment(resourceId: string, template: ResourceTemplate): Promise<DeploymentResult>
```

**Deployment Progress:**

```typescript
interface DeploymentProgress {
  stage: 'init' | 'allocate' | 'configure' | 'provision' | 'verify' | 'complete';
  progress: number;  // 0-100
  message: string;   // User-facing status message
}
```

### Resource Wizard Component

**Location**: `/src/components/resource/ResourceWizard.tsx`

**Key Features:**
- 3-step wizard (Template → Configure → Review)
- Template selection with visual cards
- Configuration form with dynamic fields
- Real-time deployment progress
- Automatic redirect on completion

**Usage:**

```tsx
<ResourceWizard
  projectId={project?.id}
  projectName={project?.name}
  currentUserId={session.user.id}
  teams={userTeams}
  onCancel={handleCancel}
  onComplete={handleComplete}
/>
```

### Deployment Status Component

**Location**: `/src/components/resource/DeploymentStatus.tsx`

**Features:**
- Real-time progress polling (every 2 seconds)
- Stage-based progress indicator
- Endpoint and credentials display on completion
- Error handling for failed deployments

**Usage:**

```tsx
<DeploymentStatus
  resourceId={resource.id}
  status={resource.status}
  configuration={resource.configuration}
  endpoint={resource.endpoint}
  credentials={resource.credentials}
  onDeploymentComplete={() => router.refresh()}
/>
```

### API Endpoints

**Deployment Status Polling:**
```
GET /api/resources/[resourceId]/deployment-status

Returns:
{
  id: string;
  name: string;
  status: 'PROVISIONING' | 'ACTIVE' | 'INACTIVE';
  endpoint: string | null;
  credentials: object | null;
  configuration: {
    deploymentStage: string;
    deploymentProgress: number;
    deploymentMessage: string;
  }
}
```

### Testing Deployment Flow

1. Navigate to `/orga/[orgName]/[projectName]/resources/new`
2. Select resource template (e.g., "IPFS Cluster (3 Nodes)")
3. Configure resource name and team assignment
4. Review and click "Create Resource"
5. Watch real-time deployment progress (updated every 2 seconds)
6. See mock endpoint and credentials on completion
7. Copy credentials and endpoint for testing

---

<<<<<<< HEAD
## 📖 How to Use This Documentation

This file serves as the quick reference and starting point. For detailed information:

1. **Architecture & Design**: See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) and [DESIGN.md](./docs/DESIGN.md)
2. **Component Details**: See [COMPONENTS.md](./docs/COMPONENTS.md) and [BEST-PRACTICES.md](./docs/BEST-PRACTICES.md)
3. **Specifications**: See [SPECS.md](./docs/SPECS.md) for comprehensive technical specifications
4. **Testing**: See [JEST-TESTS.md](./docs/JEST-TESTS.md) for testing strategies and configuration
5. **Business Context**: See [BUSINESS-STRATEGY.md](./docs/BUSINESS-STRATEGY.md)

---

## 🎓 Key Reminders

- **ALWAYS** stop the running processes after you have finished testing (`npm run dev`)
- **ALWAYS** use British English spelling throughout all code and documentation
- **NEVER** put client components in `/app`, unless they are `page.tsx` files
- **NEVER** use dialog components unless they are for alerts or confirmations
- If you have problems with database migrations, drop it or migrate forcefully
- **IMPORTANT**: The GitHub repository is located in the `next-app` folder

---

*Last updated: This documentation structure guides all development work in this repository.*
- to memorize **ALWAYS** Use existing folder structure before creating new folders
=======
## 🔄 TinyBase Migration

### Current Implementation Status

**Migration Progress:** 4/48 tasks (8%)

**Task Group A: Foundation & Infrastructure (50%)**
- ✅ A1: TinyBase v7.1.0 installed
- ✅ A2: Custom file persister implemented (`/src/lib/tinybase/persister.ts`)
- ✅ A3: TinyBase database wrapper implemented (`/src/lib/tinybase/db.ts`)
- ✅ A4: Persister unit tests created (9/10 passing)
- ⏳ A5-A8: Quality improvements and documentation (next tasks)

**Key Files:**
- `/src/lib/tinybase/db.ts` - Database wrapper (singleton with relationships & indexes)
- `/src/lib/tinybase/persister.ts` - Custom file persister with atomic writes
- `/src/lib/tinybase/__tests__/db.test.ts` - Database wrapper tests (20/20 passing)
- `/src/lib/tinybase/__tests__/persister.test.ts` - Persister tests (9/10 passing)
- `/docs/TINYBASE_MIGRATION_PLAN.md` - Complete migration plan
- `/docs/MIGRATION_TEST_STRATEGY.md` - Test strategy
- `/docs/file-store/` - Research and decision documentation

**Usage Example (via Database Wrapper - Recommended):**
```typescript
import { getDB } from '@/lib/tinybase/db';

// Get singleton database instance
const db = await getDB();

// Use the store
db.store.setRow('users', userId, {
  email: 'alice@example.com',
  name: 'Alice'
});

// Use indexes for lookups
const userIds = db.indexes.getSliceRowIds('usersByEmail', 'alice@example.com');

// Use relationships for navigation
const teamIds = db.relationships.getLocalRowIds('teamOrganisation', 'org1');

// Changes are automatically saved every 2s with atomic writes
// Data stored in: /data/users/<userId>.json
// Indices in: /data/users/indices/email.jsonl
```

**Direct Persister Usage (Advanced):**
```typescript
import { createStore } from 'tinybase/store';
import { createEnopaxPersister } from '@/lib/tinybase/persister';

const store = createStore();
const persister = createEnopaxPersister(store, '/data');

await persister.load();
await persister.startAutoSave();

store.setRow('users', userId, {
  email: 'alice@example.com',
  name: 'Alice'
});
```

**Database Wrapper Features:**
- ✅ Singleton pattern (single instance across app)
- ✅ Pre-configured relationships (foreign keys)
- ✅ Pre-configured indexes (lookup fields)
- ✅ Auto-persister with file-per-record storage
- ✅ Auto-initialization on first access

**Key Files:**
- `/src/lib/tinybase/db.ts` - Database wrapper (singleton)
- `/src/lib/tinybase/persister.ts` - Custom file persister
- `/src/lib/tinybase/__tests__/db.test.ts` - Database wrapper tests (20/20 passing)
- `/src/lib/tinybase/__tests__/persister.test.ts` - Persister tests (9/10 passing)

---

*This file serves as a quick reference. For detailed information, consult the respective documentation files.*

> 📋 **For comprehensive web application specifications, see [SPECS.md](./next-app/SPECS.md)**
> 🎯 **For development best practices and guidelines, see [BEST-PRACTICES.md](./next-app/BEST-PRACTICES.md)**
- to memorise **ALWAYS** Stop the running processes after you have finished testing (npm run dev)
- to memorise **ALWAYS** use British English spelling
- to memorise **NEVER** put client components in /app, unless they are page.tsx files
- to memorise if you have problems with the database migration, drop it or migrate forcefully
- to memorise **ALWAYS** use British English spelling
- to memorise **NEVER** use dialogue components unless it is to alert or to confirm
- to memorise **IMPORTANT** GitHub repo is located in the next-app folder
>>>>>>> 56abbec (feat(tinybase): implement custom file persister (Task A2))
