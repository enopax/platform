# CLAUDE.md

**AI Assistant Reference File**  
This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

---

## 📚 Documentation Structure

This project follows a structured documentation approach:

- **CLAUDE.md** (this file) - AI assistant guidance and quick reference
- **SPECS.md** - Comprehensive web application technical specifications
- **ARCHITECTURE.md** - Detailed technical architecture and system design
- **COMPONENTS.md** - Component folder structure and organisation guide
- **LATEST.md** - Where we have stopped before the session was ended (limit reached). Check at every new session and update occasionally!

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

### Git-Pull Deployment (Production Server)
```bash
# Deploy updates with single command
./deploy.sh

# Manual deployment
git pull && npm run docker:prod:rebuild
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

> 📖 **For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## 🎨 Development Guidelines

### Component Library
- **UI Framework**: Radix UI + Tailwind CSS
- **Components**: Tremor components available in `/components/common/` folder
- **Icons**: Remix Icons (`@remixicon/react`)
- **Organisation**: See [COMPONENTS.md](./next-app/COMPONENTS.md) for detailed folder structure

### Code Patterns
- **Forms**: Action selection based on entity presence (not explicit mode props)
- **Search**: Use UserSearch/GenericSearch components over static Select
- **Dates**: Tremor DatePicker components over native date inputs
- **State**: Union types for form states, minimal state complexity

### Database
- **ORM**: Prisma with PostgreSQL
- **Auth**: NextAuth.js with Prisma adapter
- **Queries**: Limit results, select only needed fields

> 🎯 **For comprehensive UX guidelines, see [UX.md](./UX.md)**

---

## 🔄 GitHub Pull Request Workflow

### Trigger Command: `pr`

When you type `pr`, Claude will execute this standardised pull request workflow:

1. **Pre-flight Checks**
   - Check git status and current branch
   - Ensure all changes are committed
   - Verify tests pass with `cd next-app && npm run lint`

2. **Branch Management**
   - **DEFAULT**: Create a new branch for each distinct feature/fix unless explicitly continuing existing work
   - Evaluate if current changes fit existing branch scope (see criteria below)
   - **Prefer fresh branches** to keep PRs focused and avoid mixing unrelated changes
   - Branch naming: `feature/description` or `fix/issue-description`
   - Push current branch to remote with upstream tracking

3. **Branch Creation Decision**
   - If creating new branch: `git checkout -b feature/new-branch-name` from main
   - If continuing existing: ensure changes align with branch purpose
   - **Bias towards new branches** for cleaner, focused PRs

4. **Pull Request Creation**
   - Generate concise PR title based on commits
   - Create compressed PR body including:
     - **Summary**: 3-5 bullet points of key changes
     - **Technical**: Architecture/implementation highlights
     - **Testing**: Essential test coverage only
     - **Breaking**: Changes requiring migration (if any)

5. **PR Standards**
   - Link to relevant issues (if any)
   - Add appropriate labels
   - Request reviews from relevant team members
   - Include screenshots for UI changes

### Compressed Pull Request Template
```markdown
## Summary
- 3-5 bullet points of core changes
- Focus on user-facing improvements
- Highlight technical architecture updates

## Technical
- Key implementation details only
- New dependencies/migrations
- Performance/security improvements

## Testing
- [ ] Core functionality verified
- [ ] Build/lint success
- [ ] Breaking change testing (if applicable)

## Breaking Changes
None / List migration steps if any

## Screenshots
(UI changes only)
```

### Branch Evaluation Criteria

**IMPORTANT**: Default to creating new branches. Only continue on existing branch when explicitly justified.

**Create New Branch (DEFAULT BEHAVIOUR):**
- Starting any new feature, bug fix, or improvement
- Changes implement a different feature/fix than current branch purpose
- Current branch has existing commits unrelated to new work
- Changes address a different user story or technical requirement
- Any doubt about whether changes belong together
- Current branch is already in PR state or ready for review
- Want to keep work separated for easier code review

**Continue on Current Branch (ONLY IF):**
- Changes are direct iterations/improvements on current branch's feature
- Fixing bugs introduced in current branch's commits
- Adding missing pieces to incomplete feature in progress
- All changes serve the exact same user story/technical goal
- Current branch has no existing commits (just switched from main)

### PR Best Practices
- **Fresh Branches**: Create new branches for each distinct piece of work
- **Single Purpose**: Each PR should address one specific feature, fix, or improvement
- **Concise Descriptions**: Focus on essential changes, avoid verbose explanations
- **Highlight Impact**: Emphasise user-facing improvements and technical benefits
- **Compress Technical Details**: Include only implementation highlights
- **Essential Testing**: Cover core functionality, not exhaustive test lists
- **Breaking Changes**: Clearly state "None" or provide migration steps
- **Branch Naming**: `feature/description` or `fix/issue-description`
- **PR Size**: Keep focused and reasonably sized

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
**Organisation-Based Routes:**
- Teams: `/main/organisations/[orgName]/teams/[teamId]` and `/main/organisations/[orgName]/teams/new`
- Projects: `/main/organisations/[orgName]/projects/[projectId]` and `/main/organisations/[orgName]/projects/new`
- Resources: `/main/organisations/[orgName]/resources/[resourceId]` and `/main/organisations/[orgName]/resources/new`

**Key Points:**
- Organisation context uses **organisation name** in URL path (not ID)
- Organisation names are unique in database schema
- Resource creation centralised at `/main/organisations/[orgName]/resources/new`
- Project context passed via query params (`?project=projectId`) when creating resources
- Forms receive organisation name from URL params and look up organisation by name
- Sidebar automatically detects organisation name from pathname
- All links throughout the app use the organisation name-based structure

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

### Database Schema

**Resource Status Enum:**
```prisma
enum ResourceStatus {
  PROVISIONING  // Currently being deployed
  ACTIVE        // Running and operational
  INACTIVE      // Stopped or failed
  MAINTENANCE   // Under maintenance
  DELETED       // Soft deleted
}
```

**Resource Fields for Deployment:**
```prisma
model Resource {
  status         ResourceStatus @default(ACTIVE)
  endpoint       String?        // Generated endpoint URL
  credentials    Json?          // Encrypted credentials
  configuration  Json?          // Deployment metadata
  // configuration structure:
  // {
  //   templateId: string;
  //   deploymentStage: string;
  //   deploymentProgress: number;
  //   deploymentMessage: string;
  //   deployedAt: string;
  //   ...template-specific config
  // }
}
```

### Migration to Real Deployment

**Phase 1: Docker Deployment (Next Step)**

Replace mock provider with Docker provider:

```typescript
// src/lib/deployment/docker-provider.ts
import Docker from 'dockerode';

class DockerDeploymentProvider implements DeploymentProvider {
  async deploy(resourceId: string, template: ResourceTemplate) {
    const docker = new Docker();

    // Generate Docker Compose config
    const config = generateDockerConfig(resourceId, template);

    // Deploy container
    await docker.createService(config);

    // Return real endpoint
    return {
      endpoint: `http://your-server:${allocatedPort}`,
      credentials: generateRealCredentials()
    };
  }
}
```

**Phase 2: Multi-Server Deployment**

Deploy across server fleet using Kubernetes or Docker Swarm.

**Phase 3: Cloud Provider Integration**

Integrate AWS, DigitalOcean, or Hetzner APIs for cloud deployment.

### Important Notes

- **Mock endpoints** use `.local` domain to clearly indicate they're not real
- **Credentials** are stored in `credentials` JSONB field (will be encrypted in production)
- **Progress tracking** happens in background, non-blocking
- **Frontend polling** automatically stops when deployment completes
- **Template IDs** must be unique across all templates
- **Deployment time** in templates controls simulation duration (mock only)

### Testing Deployment Flow

1. Navigate to `/main/organisations/[orgName]/resources/new`
2. Select "IPFS Cluster (3 Nodes)" template
3. Configure resource name and team
4. Click "Create Resource"
5. Watch real-time deployment progress
6. See mock endpoint and credentials on completion

---

## 🔄 TinyBase Migration

### Current Implementation Status

**Migration Progress:** 5/51 tasks (10%)

**Task Group A: Foundation & Infrastructure (5/7 tasks - 71%)**
- ✅ A1: TinyBase v7.1.0 installed
- ✅ A2: Custom file persister implemented (`/src/lib/tinybase/persister.ts`)
- ✅ A3: TinyBase database wrapper implemented (`/src/lib/tinybase/db.ts`)
- ✅ A4: Persister unit tests created (9/10 passing - 90%)
- ✅ A5: Delete test limitation documented
- ⏳ A6: Test NPM scripts (next task)
- ⏳ A7: Test comments and documentation
- ⏳ A8: Quality review checkpoint

**Key Files:**
- `/src/lib/tinybase/db.ts` - Database wrapper (singleton with relationships & indexes)
- `/src/lib/tinybase/persister.ts` - Custom file persister with atomic writes
- `/src/lib/tinybase/__tests__/db.test.ts` - Database wrapper tests (20/20 passing)
- `/src/lib/tinybase/__tests__/persister.test.ts` - Persister tests (9/10 passing - 90%)
- `/docs/TINYBASE_MIGRATION_PLAN.md` - Complete migration plan
- `/docs/MIGRATION_TEST_STRATEGY.md` - Test strategy
- `/docs/file-store/` - Research and decision documentation

**Known Issues:**
- 1 delete test failing due to mock limitation (not implementation bug)
- Root cause: TinyBase mock doesn't implement proper change tracking
- Fix: Will work correctly when using real TinyBase (not mocks)
- Status: Documented in persister.test.ts - not blocking migration

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