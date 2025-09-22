# Development Best Practices

**IPFS Storage Cluster Web Application Development Guidelines**

This document consolidates best practices from across the project documentation to ensure consistent, maintainable, and secure code development.

---

## 📋 Table of Contents

- [Code Standards](#-code-standards)
- [Component Development](#-component-development)
- [Database & Query Optimisation](#-database--query-optimisation)
- [Form Development](#-form-development)
- [API & Service Layer](#-api--service-layer)
- [Authentication & Security](#-authentication--security)
- [File Management](#-file-management)
- [Testing](#-testing)
- [Performance](#-performance)
- [Deployment](#-deployment)

---

## 📝 Code Standards

### Language & Formatting
- **ALWAYS** use British English spelling throughout the codebase
- **NEVER** add comments unless explicitly requested
- Follow existing code conventions and patterns
- Mimic the style of surrounding code
- Use established libraries and utilities
- **NEVER** expose or log secrets and keys

### TypeScript
- Use strict TypeScript mode
- Leverage Prisma-generated types for full type safety
- Prefer union types for form states over complex interfaces
- Keep state complexity minimal

### File Structure
- **ALWAYS** prefer editing existing files over creating new ones
- **NEVER** proactively create documentation files unless explicitly requested
- **NEVER** put newly created components in `/components/common/` folder (reserved for Tremor components and UI-related)
- **NEVER** put client components in `/app` unless they are `page.tsx` files
- **NEVER** push files outside of the `next-app` folder

---

## 🎨 Component Development

### Component Hierarchy
1. **Tremor components** in `/components/common/` folder (first priority)
2. **Radix UI primitives** when Tremor not available
3. **Custom components** following established patterns

### Component Design Patterns
- Use union types for component states
- Implement proper error boundaries
- Follow progressive enhancement principles
- Work with Radix UI's focus management
- Prefer composition over inheritance

### Search Components
- Use `UserSearch`/`GenericSearch` components over static Select dropdowns
- Implement real database queries with debouncing and pagination
- Avoid static data in search components

### Date Components
- Use Tremor DatePicker components over native date inputs
- Handle timezone considerations properly
- Validate date ranges server-side

### Server/Client Component Architecture
- **Server-first approach**: Keep most content in server components (page.tsx)
- **Minimal client components**: Only create client components for interactive elements
- **Follow established patterns**: Look at existing pages like `/main/developer/page.tsx` for structure
- **Avoid unnecessary abstraction**: Don't split into multiple components unless there's clear benefit

#### Good Architecture Pattern:
```typescript
// page.tsx (Server Component)
export default async function ProjectsPage() {
  const data = await fetchData();

  return (
    <div>
      {/* Static content directly in page */}
      <header>...</header>
      <section>...</section>

      {/* Only interactive parts as client components */}
      <InteractiveFilter data={data} />
      <DisplayGrid items={filteredData} />

      {/* More static content */}
      <footer>...</footer>
    </div>
  );
}
```

#### Avoid This Anti-Pattern:
```typescript
// Don't wrap everything in client components
return <PageWrapper><AllContent /></PageWrapper>
```

### Component Boundaries
- **Server components**: Headers, static sections, forms, quick actions
- **Client components**: Dropdowns, filters, interactive grids, modals
- **URL-based state**: Use searchParams instead of client state when possible
- **Component size**: Keep client components focused and small (< 150 lines typically)

### Common Mistakes to Avoid
- **❌ Don't import server-only modules in client components**: Never import `auth()`, `prisma`, or Node.js modules like `fs` in `'use client'` components
- **❌ Don't make entire pages client components**: This causes Node.js module resolution errors
- **❌ Don't over-abstract**: Creating too many small components makes code harder to follow
- **❌ Don't duplicate state**: Use either URL params OR client state, not both for the same data

### Debugging Server/Client Issues
```typescript
// Error: Can't resolve 'fs' in client component
'use client';
import { auth } from '@/lib/auth'; // ❌ Server-only module

// Solution: Separate server and client concerns
// page.tsx (Server)
const session = await auth();
return <ClientComponent data={data} />;

// ClientComponent.tsx
'use client';
export default function ClientComponent({ data }) {
  // ✅ No server imports
}
```

---

## 🗄️ Database & Query Optimisation

### Query Structure Principles
- **Keep queries simple and focused** - avoid overly complex joins
- **Don't always query organisation membership** - only fetch when needed
- **Limit results by default** - use pagination for large datasets
- **Select only needed fields** - avoid `SELECT *` patterns
- **Use appropriate indices** - ensure queries are optimised

### Common Query Patterns

#### ✅ Good: Simple, focused queries
```typescript
// Get user's teams (simple membership check)
const userTeams = await prisma.team.findMany({
  where: {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } }
    ]
  },
  select: {
    id: true,
    name: true,
    isPersonal: true
  }
});
```

#### ❌ Bad: Overly complex nested queries
```typescript
// Don't do this - too complex and slow
const userTeams = await prisma.team.findMany({
  where: {
    OR: [
      { ownerId: userId },
      { members: { some: { userId } } },
      {
        organisation: {
          members: {
            some: {
              userId,
              role: { in: ['OWNER', 'MANAGER'] }
            }
          }
        }
      }
    ]
  },
  include: {
    organisation: {
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    },
    members: {
      include: {
        user: true
      }
    }
  }
});
```

### Performance Guidelines
- Use `Promise.all()` for parallel queries when data is independent
- Implement database-level pagination
- Cache frequently accessed, slow-changing data
- Monitor query performance in development

### Relationship Best Practices
- Use optional relationships (`Organisation?`) when entities can exist independently
- Implement proper cascading deletes with `onDelete` constraints
- Use `SetNull` for optional relationships to maintain data integrity

---

## 📝 Form Development

### Form State Management
- **ALWAYS** use `useActionState` hook for form state management
- Detect create/update mode by entity presence: `const action = entity ? updateEntity : createEntity`
- Use hidden input fields for entity IDs: `{entity && <input type="hidden" name="entityId" value={entity.id} />}`
- Apply consistent error handling with `hasError` props and field-specific error messages

### Form Validation
- Use Prisma-first validation approach instead of Zod schemas
- Validate on both client and server sides
- Provide clear, specific error messages
- Handle field-level and form-level errors consistently

### Form UX Patterns
- Use entity-based action selection with hidden ID fields
- Implement proper loading states during submission
- Provide success/error feedback
- Handle edge cases (network errors, timeouts)

---

## 🔌 API & Service Layer

### Service Layer Architecture
- Use shared business logic between API routes and Server Actions
- Implement progressive enhancement with Server Actions for forms
- Use API routes for external integration
- Maintain unified API interfaces

### API Design
- Follow RESTful conventions where appropriate
- Use consistent response formats
- Implement proper error handling
- Version APIs when necessary

### Server Actions
- Prefer Server Actions for form submissions
- Handle validation and business logic in service layer
- Return consistent state objects
- Implement proper error boundaries

---

## 🔐 Authentication & Security

### Authentication Patterns
- Use NextAuth.js v5 for authentication
- Implement role-based access control (GUEST, CUSTOMER, ADMIN)
- Use session-based authentication with secure cookies
- Validate permissions on both client and server

### Security Best Practices
- **NEVER** expose secrets or API keys in client code
- **NEVER** log sensitive information
- Validate all user inputs server-side
- Implement proper CSRF protection
- Use secure headers and HTTPS in production

### Access Control
- Check user permissions at the route level
- Implement team and organisation-based access controls
- Use granular permissions (read, write, execute, lead)
- Audit important actions with membership logs

---

## 📁 File Management

### IPFS Integration
- **ALWAYS** use IPFS Cluster API (port 9094) for content operations
- **NEVER** pin directly to individual nodes
- Let cluster handle replication automatically
- Implement proper error handling for IPFS operations

### File Storage Patterns
- Implement tiered storage (FREE_500MB, BASIC_5GB, PRO_50GB, etc.)
- Track storage usage and quotas
- Implement soft deletes for important files
- Use content addressing for deduplication

---

## 🧪 Testing

### Testing Strategy
- Multi-environment Jest setup for different concerns
- Test validation logic separately from business logic
- Test service layer functions independently
- Mock external dependencies (IPFS, external APIs)

### Test Organisation
```bash
npm run test:validation   # Schema and validation tests
npm run test:actions      # Server action tests
npm run test:services     # Service layer tests
npm run test:components   # React component tests
```

### Testing Best Practices
- Write tests for critical business logic
- Test error cases and edge conditions
- Use meaningful test descriptions
- Keep tests isolated and independent

---

## ⚡ Performance

### Frontend Optimisation
- Use Next.js App Router for optimal performance
- Implement proper code splitting
- Optimise images and static assets
- Use streaming and suspense boundaries

### Backend Optimisation
- Optimise database queries (see Database section)
- Implement caching where appropriate
- Use efficient serialisation
- Monitor performance metrics

### Bundle Optimisation
- Tree-shake unused code
- Optimise bundle size
- Use dynamic imports for heavy components
- Implement proper lazy loading

---

## 🚀 Deployment

### Environment Management
- Use environment-specific configurations
- Implement proper secrets management
- Use Docker for consistent deployments
- Monitor application health

### Commands & Operations
- Use simplified npm scripts for Docker operations
- Prefer manual Next.js development over containerised
- **ALWAYS** stop running processes after testing (`npm run dev`)
- If `npx` commands fail, ask user to run them manually

### Database Operations
- **ALWAYS** run migrations before deployment
- If migration problems occur, drop and migrate forcefully
- Backup data before major schema changes
- Monitor database performance

### Process Management
- **ALWAYS** ask or prompt for missing dependencies or commands
- **NEVER** work around commands that cannot be executed
- Follow the established workflow patterns
- Implement proper error handling

---

## 🔄 Development Workflow

### Planning & Execution
- **NEVER** do all steps at once after planning
- Split work into smaller chunks and proceed step by step
- Use TodoWrite tool for tracking complex tasks
- Follow the established git workflow

### Code Review & Quality
- Follow the standardised pull request workflow
- Create focused, single-purpose PRs
- Use proper branch naming: `feature/description` or `fix/issue-description`
- Include meaningful commit messages

### Debugging & Troubleshooting
- Use proper error handling throughout the application
- Implement comprehensive logging (without exposing secrets)
- Monitor application performance and errors
- Document known issues and their solutions

---

## 📚 Additional Resources

- **Architecture**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- **UX Guidelines**: See [UX.md](./UX.md) for user experience patterns
- **Technical Specs**: See [SPECS.md](./SPECS.md) for detailed technical specifications
- **Quick Reference**: See [CLAUDE.md](../CLAUDE.md) for AI assistant guidance

---

*This document should be updated as the project evolves and new patterns emerge. Always refer to the latest version for current best practices.*