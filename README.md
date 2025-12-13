# Infrastructure Deployment Platform

**Next.js 15 + TypeScript Web Application**

A modern web application for deploying and managing infrastructure services with a single click. Deploy IPFS storage clusters, databases, and other services through an intuitive web interface.
---

## 🚀 Quick Start

### Development Mode

```bash
# Install dependencies
npm install

# Start PostgreSQL database
npm run docker:dev:up

# Start Next.js development server (runs standalone)
npm run dev

# Stop database when done
npm run docker:dev:down
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
- Docker runs: PostgreSQL, Grafana, Prometheus
- Next.js runs standalone: `npm run dev` (port 3000)
- Hot reloading enabled for fast development

**Production**:
- Docker runs: PostgreSQL, Grafana, Prometheus, Next.js (production build), Nginx
- Full stack containerised with automatic restarts
- Nginx reverse proxy for production traffic

### Key Technologies
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Testing**: Jest with multi-environment configuration
- **Monitoring**: Grafana + Prometheus
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

### Unified API Architecture
- **Server Actions**: For internal form submissions and UI interactions
- **API Routes**: For external integrations and third-party access
- **Shared Services**: Both use identical business logic for consistency

### File Management
- Upload and manage files with metadata
- Real-time file status monitoring
- Advanced search and filtering capabilities
- Team-based file organisation

### Team Management API
- Complete CRUD operations for team management
- Team member management with role-based permissions
- Organisation-scoped team operations
- RESTful API endpoints for external integrations

### Project Management API
- Complete CRUD operations for project management
- Project assignment to teams with permission controls
- Project file management and organisation
- RESTful API endpoints for external integrations

### Authentication & Security
- NextAuth.js v5 with multiple provider support
- Session-based authentication with secure cookie handling
- Role-based access control for team features

### User Experience
- Responsive design with Tailwind CSS
- Real-time feedback with loading states
- Progressive enhancement for accessibility
- Comprehensive error handling and user feedback

---

## 🔌 API Endpoints

### Team Management API
Complete RESTful API for team operations:

```bash
# Team CRUD Operations
POST   /api/team/create           # Create new team
GET    /api/team/list             # List teams (with optional organisationId filter)
GET    /api/team/[id]             # Get team details
PUT    /api/team/[id]             # Update team
DELETE /api/team/[id]             # Delete team (soft delete)

# Team Member Management
GET    /api/team/[id]/members     # List team members
POST   /api/team/[id]/members     # Add team member
DELETE /api/team/[id]/members     # Remove team member
```

### Project Management API
Complete RESTful API for project operations:

```bash
# Project CRUD Operations
POST   /api/project/create        # Create new project
GET    /api/project/list          # List projects (with optional organisationId/teamId filter)
GET    /api/project/[id]          # Get project details
PUT    /api/project/[id]          # Update project
DELETE /api/project/[id]          # Delete project (soft delete)

# Project File Management
GET    /api/project/[id]/files    # List project files
```

All endpoints require authentication and follow role-based permission controls.

---

## 🔗 Integration

### Database Schema
- **PostgreSQL**: Primary database with Prisma ORM
- **File Metadata**: Hash, size, ownership, and team associations
- **User Management**: Authentication, teams, and permissions

---

## 📊 Monitoring & Observability

### Available Services
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **PostgreSQL**: localhost:5432

### Available Metrics
- File upload/download statistics
- Storage quota usage and limits
- User activity and engagement metrics
- System health and performance

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
2. Start Docker infrastructure: `npm run docker:dev`
3. Run database migrations: `npx prisma migrate dev`
4. Start development server: `npm run dev`
5. Access application: http://localhost:3000

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

*Modern storage platform with team collaboration, role-based permissions, and comprehensive monitoring.*
