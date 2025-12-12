# Infrastructure Deployment Platform

**Next.js 15 + TypeScript Web Application**

A comprehensive platform for managing organisations, projects, and deploying infrastructure resources with a single click. Deploy IPFS clusters, databases, and other services through an intuitive web interface with role-based access control.

---

## 🚀 Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Start PostgreSQL database
npm run docker:dev

# Start Next.js development server (runs standalone)
npm run dev

# Stop database when done
npm run docker:dev:stop
```

### Production Mode (Local Testing)

```bash
# Build and start production stack (PostgreSQL + Next.js)
npm run docker:prod

# Rebuild Next.js only (for updates)
npm run docker:prod:rebuild

# View logs
npm run docker:prod:logs

# Stop production stack
npm run docker:prod:stop
```

### Production Deployment (Server)

**One-command deployment:**
```bash
./deploy.sh
```

This script automatically:
- Pulls latest code from git
- Rebuilds Next.js container
- Synchronises database schema
- Restarts services

See [SERVER-SETUP.md](./SERVER-SETUP.md) for complete server deployment guide.

### Testing Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm run test:validation   # Validation schema tests
npm run test:actions      # Server action tests
npm run test:services     # Service layer tests
npm run test:components   # React component tests
```

---

## 🏗️ Architecture Overview

### System Type
Next.js 15 web application with Server Actions, unified API architecture, and comprehensive testing strategy.

### Infrastructure Setup

**Development**:
- Docker runs: PostgreSQL only
- Next.js runs standalone: `npm run dev` (port 3000)
- Hot reloading enabled for fast development
- Automatic database schema synchronisation via Prisma

**Production**:
- Docker runs: PostgreSQL + Next.js (containerised production build)
- Full stack containerised with automatic restarts
- Automatic database schema synchronisation on restart
- Git-pull deployment workflow with `./deploy.sh`

### Key Technologies
- **Framework**: Next.js 15 with App Router and Server Actions
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI + Tremor
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Testing**: Jest with multi-environment configuration
- **API Integration**: External Resource API for infrastructure provisioning
- **Validation**: Zod schemas for type-safe data validation

### Core Architecture Principles
1. **Unified Service Layer**: Both API routes and Server Actions use shared business logic
2. **Progressive Enhancement**: Server Actions for internal forms, API routes for external integration
3. **Comprehensive Testing**: Three-layer testing strategy (validation, business logic, presentation)
4. **Type Safety**: Full TypeScript coverage with proper interface definitions

---

## 📁 Project Structure

```
src/
├── app/                     # Next.js App Router pages and layouts
├── components/              # React components
│   ├── common/             # Tremor UI components (DO NOT MODIFY)
│   └── form/               # Form components using Server Actions
├── lib/
│   ├── actions/            # Server Actions for internal forms
│   ├── services/           # Shared business logic services
│   ├── validation/         # Zod validation schemas
│   └── auth.ts            # NextAuth.js configuration
tests/
├── setup/                  # Environment-specific test configurations
├── validation/             # Validation schema tests
├── actions/               # Server Action tests
├── services/              # Service layer tests
└── components/            # React component tests
```

---

## 🧪 Testing Strategy

### Multi-Layer Testing Approach

1. **Validation Layer** (Node.js environment)
   - Zod schema validation tests
   - Form data parsing and sanitisation
   - File upload constraints and validation

2. **Service Layer** (Node.js environment)
   - Business logic service tests (organisation, team, user services)
   - Database interaction validation
   - Service method functionality verification

3. **Actions Layer** (Node.js environment)
   - Server Action structure and exports
   - Authentication and authorisation
   - Service integration and error handling

4. **Presentation Layer** (JSDOM environment)
   - React component rendering
   - User interaction handling
   - State management and loading states

### Test Results
- ✅ **130+ tests passing** across 4 isolated environments
- ✅ **Environment isolation** prevents test interference
- ✅ **Comprehensive coverage** of validation, services, actions, and UI
- ✅ **Team API functionality** fully tested

> 📖 **For detailed testing documentation, see [JEST-TESTS.md](./JEST-TESTS.md)**

---

## 🔧 Development Guidelines

### Component Preferences
1. **Tremor components** in `/components/common/` folder (first priority)
2. **Radix UI primitives** when Tremor not available
3. **Custom components** following established patterns

### Form Patterns
- **Action Detection**: Detect create/update mode by entity presence: `const action = entity ? updateEntity : createEntity`
- **Server Actions**: Use `useActionState` hook for form handling
- **Progressive Enhancement**: Forms work without JavaScript, enhanced with React

### Code Standards
- Follow existing code conventions and patterns
- Use TypeScript for type safety
- Implement proper error handling with consistent result structures
- Follow security best practices (never expose secrets or keys)

---

## 🌟 Key Features

### Organisation & Project Management
- Create and manage organisations with hierarchical structure
- Name-based URL routing for human-readable URLs
- Organisation-wide teams with role-based permissions
- Project creation and management within organisations
- Resource allocation and tracking per project

### Resource Deployment System
- One-click infrastructure deployment with resource templates
- Real-time deployment progress tracking with live updates
- Support for IPFS clusters, PostgreSQL databases, and more
- Mock deployment service for rapid UI/UX validation
- Automatic endpoint and credentials generation

### Resource API Integration
- External Resource API for real infrastructure provisioning
- Test panels for API connectivity and debugging
- Multi-provider resource support
- Secure credential management and storage

### Permission & Access Control
- Organisation roles: MEMBER, MANAGER, ADMIN, OWNER
- Project-level access control
- Simplified permission model (all org members can access all projects)
- Authentication via NextAuth.js v5 with multiple provider support

### User Experience
- Responsive design with Tailwind CSS + Radix UI + Tremor
- Real-time deployment status with progress indicators
- Intuitive organisation and project navigation
- Comprehensive error handling and user feedback
- Progressive enhancement for accessibility

---

## 🛠️ Architecture Details

### Name-Based Routing
The platform uses human-readable names in URLs instead of IDs:
- Organisation paths: `/orga/[orgaName]`
- Project paths: `/orga/[orgaName]/[projectName]`
- Resource paths: `/orga/[orgaName]/[projectName]/[resourceName]`

**Name Validation**:
- Alphanumeric characters and hyphens only
- Unique per scope (organisation/project names are globally unique)
- Blocked names list prevents conflicts with reserved routes
- Automatic validation on creation and updates

### Context API Architecture
Shared context providers avoid prop drilling across nested route groups:
- **OrganisationContext**: Share organisation data across components
- **ProjectContext**: Share project data across components
- **ResourceContext**: Share resource data across components

### Permission System
Role-based access control with hierarchical roles:
- **MEMBER**: Basic access to organisation and projects
- **MANAGER**: Can invite members and manage teams
- **ADMIN**: Can manage roles and project configurations
- **OWNER**: Full control over organisation

Simplified permission model:
- All organisation members can access all projects
- Team assignments provide additional organisational grouping
- Roles determine what actions users can perform

### Resource API Integration
Integration with external Resource API for infrastructure provisioning:
- Secure communication with JSON payload exchanges
- Test panels at `/account/test-resource-api`
- Support for multiple providers and resource types
- Automatic credential and endpoint generation

---

## 🗄️ Database Schema
- **PostgreSQL**: Primary database with Prisma ORM
- **Organisations**: With name-based unique constraints
- **Projects**: Linked to organisations, with name validation
- **Resources**: Infrastructure provisioning configurations
- **Users & Authentication**: NextAuth.js session management
- **Roles**: Organisation and project role assignments

---

## 🚀 Production Deployment

### Environment Variables
Required environment variables (see `.env.production.example`):
- Database connection strings
- NextAuth.js configuration (AUTH_SECRET, AUTH_URL)
- External service credentials
- Email server configuration

### Docker Support
Production-ready Docker setup with:
- Multi-stage build for optimised image size
- Health checks for all services
- Automatic database migrations
- Nginx reverse proxy with SSL support

---

## 🤝 Development Workflow

### Getting Started
1. Set up environment variables (copy from `.default.env`)
2. Install dependencies: `npm install`
3. Start Docker infrastructure: `npm run docker:dev`
4. Database schema automatically synchronises on startup
5. Start development server: `npm run dev`
6. Access application: http://localhost:3000

### Testing Workflow
1. **Development**: Use specific test commands for faster feedback
2. **Pre-commit**: Run `npm test` to ensure all tests pass
3. **CI/CD**: Automated testing with coverage reporting

### Code Quality
- ESLint configuration for consistent code style
- TypeScript strict mode for type safety
- Comprehensive test coverage requirements
- Security-focused development practices

---

## 📚 Documentation

- **CLAUDE.md** - AI assistant guidance and quick reference
- **ARCHITECTURE.md** - Detailed technical architecture
- **COMPONENTS.md** - Component structure and organisation
- **SPECS.md** - Comprehensive application specifications
- **JEST-TESTS.md** - Testing documentation and strategies

---

*Complete infrastructure deployment platform with organisation management, role-based permissions, and real-time resource provisioning.*
