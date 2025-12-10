# Development Best Practices

**Enopax Infrastructure Deployment Platform Development Guidelines**

This document consolidates best practices from across the project documentation to ensure consistent, maintainable, and secure code development for the infrastructure deployment platform.

---

## 📋 Table of Contents

- [Code Standards](#-code-standards)
- [Component Development](#-component-development)
- [Database & Query Optimisation](#-database--query-optimisation)
- [Form Development](#-form-development)
- [API & Service Layer](#-api--service-layer)
- [Authentication & Security](#-authentication--security)
- [Resource Management](#-resource-management)
- [Testing](#-testing)
- [Performance](#-performance)
- [Deployment](#-deployment)
- [Development Workflow](#-development-workflow)

---

## 📝 Code Standards

### Language & Formatting
- **ALWAYS** use British English spelling throughout the codebase
- **NEVER** add comments unless explicitly requested
- Follow existing code conventions and patterns
- Mimic the style of surrounding code
- Use established libraries and utilities
- **NEVER** expose or log secrets and keys

### Import Statements
- **ALWAYS** match exact file name casing in import statements
- **CRITICAL**: File systems may be case-sensitive (macOS/Linux) - webpack will warn about case mismatches
- **Example issues**:
  - ❌ `import { Callout } from '@/components/common/callout'` (lowercase 'c')
  - ✅ `import { Callout } from '@/components/common/Callout'` (matches `Callout.tsx`)
  - ❌ `import { Input } from '@/components/common/input'` (lowercase 'i')
  - ✅ `import { Input } from '@/components/common/Input'` (matches `Input.tsx`)
- **How to check**: File name must match import path exactly, character-by-character
- **Why it matters**: Prevents webpack warnings, build issues, and runtime errors on case-sensitive systems

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

### File Placement Rules (CRITICAL)
When creating new files, **ALWAYS** follow these placement rules:
- **Data Fetching Queries**: **ALWAYS** place in `/lib/query/` folder (read-only database operations)
  - ✅ `/lib/query/files.ts` — User file queries
  - ✅ `/lib/query/tokens.ts` — Token balance queries
  - ✅ `/lib/query/collections.ts` — Collection queries
  - ❌ `/actions/files.ts` — NEVER use actions for data fetching
- **Server Actions**: **ALWAYS** place in `/actions/` folder (only user-triggered mutations)
  - ✅ `/actions/admin.ts` — Create/update/delete operations
  - ❌ `/actions/files.ts` — Do NOT put queries here
  - ❌ `/app/admin/actions.ts` — Never colocate with pages
- **Components**: **ALWAYS** place in `/components/` folder (never colocated with pages in `/app`)
  - ✅ `/components/AdminNav.tsx`
  - ❌ `/app/admin/AdminNav.tsx`
- **Form Components**: **ALWAYS** place in `/components/forms/` subdirectory
  - ✅ `/components/forms/NewCollectionForm.tsx`
  - ❌ `/components/NewCollectionForm.tsx`
- **Table Column Definitions**: Place in `/components/table/` subdirectory
- **UI Primitives**: Reserved for `/components/common/` (Tremor/Radix components only)
- These rules apply to **ALL new files** being created - always check file placement before creating

### Component Naming & Organisation
- **ALWAYS** use CamelCase for component filenames (e.g., `LoginForm.tsx`, not `login-form.tsx`)
- **Form components** should be placed in `/components/forms/` directory
- **Page-specific client components** should be placed in `/components/` directory (not colocated with pages in `/app`)
- Follow consistent naming patterns across the codebase

---

## 🎨 Visual Design as User Guidance

### Using Design Elements to Organize Information

Visual design should serve information architecture. Use these techniques to guide users without additional UI patterns:

**1. Gradient Backgrounds for Section Emphasis**
- Main background: subtle gradient (gray-50 → gray-100)
- Key sections: more pronounced gradients (indigo → blue)
- Creates visual hierarchy without additional borders or containers
- Helps users understand section importance and relationships

**2. Coloured Headers to Group Related Operations**
```tsx
{/* Upload & Storage operations - blue header */}
<div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20">
  <h3>Upload & Storage</h3>
</div>

{/* IPFS Pinning operations - orange header */}
<div className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/20">
  <h3>IPFS Pinning</h3>
</div>
```
- Semantic colour coding (blue = cold/storage, orange = hot/IPFS) matches system mental model
- Header styling creates visual "container" without card-in-card nesting
- Dark mode variants maintain hierarchy

**3. Icons + Text + Numbers for Scannable Sections**
- Icons draw attention and aid visual recognition
- Text provides context (description below operation name)
- Numbers (costs, counts) stand out with colour and size
- Combined = information architecture visible at a glance

**4. Spacing as Information Structure**
- Large spacing (py-20, space-y-20) between major sections
- Medium spacing (space-y-4) within sections
- Tight spacing within related items (space-y-1, space-y-2)
- Spacing hierarchy mirrors information hierarchy

**5. Border & Rounded Corner Subtlety**
- Use `border-gray-200 dark:border-gray-700` for calm structure
- Rounded corners (`rounded-2xl` for major sections, `rounded-xl` for cards)
- Avoid bold, dark borders - let spacing and colour do the work
- Subtle borders provide structure without distraction

---

## 🎨 Component Development

### Resource Template & Deployment Pages

When building resource template showcase or deployment configuration pages, follow the **Progressive Disclosure** pattern:

#### Key Principles (from resource deployment design)

**1. Multiple Template Representations**
- Show templates in card grid for visual discovery
- Include detailed template specifications in comparison format
- Support different user journeys: quick deployment vs detailed configuration

**2. Contextual Information Grouping**
- Group templates by resource type (e.g., "Databases", "IPFS Clusters", "Storage")
- Organise template information: specs, features, deployment time
- Headers with visual distinction (colour, icon) help scanning

**3. Progressive Disclosure of Complexity**
- **Hero section**: One clear call-to-action ("Deploy Infrastructure")
- **Primary content**: Main template choices (cards with icons)
- **Secondary content**: Detailed specifications and features
- **Tertiary content**: Advanced configuration options
- **Final CTA**: Clear deployment action with estimated time

**4. Feature-Driven Information**
- Lead with key features (CPU, storage, replication)
- Include deployment specifications upfront
- Show infrastructure details transparently
- Use icons to help users quickly identify resource types

**5. Visual Hierarchy Through Design**
- Use gradient backgrounds to distinguish template categories
- Status badges indicate deployment readiness
- Icons + specs + CTA = scannable template cards
- Clear visual feedback for deployment progress

**6. Template Selection + Configuration Flow**
- Step 1: Browse and select template
- Step 2: Configure resource name and team
- Step 3: Review specifications before deployment
- Step 4: Deploy and monitor progress in real-time

#### Anti-Patterns to Avoid:
- ❌ No template preview or specifications
- ❌ Unclear deployment timeline or resource specifications
- ❌ No progress feedback during deployment
- ❌ Credentials hidden after deployment complete
- ❌ No error recovery or retry options on failure

### Component Hierarchy
1. **Every component** in `/components/` folder (never colocate with pages in `/app/`)
2. **Tremor components** in `/components/common/` folder (first priority)
3. **Radix UI primitives** when Tremor not available
4. **Custom components** following established patterns

### Reusable Component with Multiple Layouts

When building components that display data in different formats, implement a **variant-based layout system**:

**Example: ResourceTemplates Component**
```typescript
// src/components/resource/ResourceTemplates.tsx
interface ResourceTemplatesProps {
  templates: ResourceTemplate[];
  variant?: 'grid' | 'cards' | 'table' | 'comparison';
  onSelectTemplate?: (template: ResourceTemplate) => void;
}

export function ResourceTemplates({
  templates,
  variant = 'cards',
  onSelectTemplate
}: ResourceTemplatesProps) {
  // Single component, multiple layouts
  // - grid: 3-4 column card layout (visual discovery)
  // - cards: 2-column compact layout (mobile-friendly)
  // - table: detailed comparison table (specification review)
  // - comparison: side-by-side resource comparison
}
```

**Benefits:**
- Single source of truth for template data
- Reuse across pages with different layout needs
- Easier maintenance (update once, affects all layouts)
- Type-safe variant switching
- Consistent styling and deployment flows

**Usage Pattern:**
```tsx
// Same data, different contexts
<ResourceTemplates templates={data} variant="grid" />         {/* Discovery page */}
<ResourceTemplates templates={data} variant="comparison" />   {/* Detailed specs */}
<ResourceTemplates templates={data} variant="table" />        {/* Admin review */}
```

### Component Design Patterns
- Use union types for component states
- Implement proper error boundaries
- Follow progressive enhancement principles
- Work with Radix UI's focus management
- Prefer composition over inheritance

### Card-in-Card Anti-Pattern (CRITICAL)
- **NEVER** nest cards within cards - this creates visual clutter and breaks the design system
- **RULE**: If a section already has card styling (padding, border, background), do NOT add another card inside it
- **Instead**: Use `<Divider />` for separation and plain `<div>` containers for content grouping

#### ❌ Bad: Card-in-card nesting
```tsx
<section className="p-6 rounded-lg border border-green-200 bg-green-50">
  <h2>Growing Trees</h2>
  <div className="p-4 rounded-lg border border-brand-200 bg-brand-50">
    {/* Nested card - creates double border/padding */}
    <p>Upgrade content</p>
  </div>
</section>
```

#### ✅ Good: Use Divider and plain containers
```tsx
<section className="p-6 rounded-lg border border-green-200 bg-green-50">
  <h2>Growing Trees</h2>
  <Divider className="my-6" />
  <div className="space-y-3">
    {/* Plain div, no card styling */}
    <p>Upgrade content</p>
    <Button>Upgrade</Button>
  </div>
</section>
```

#### Why It Matters
- **Visual hierarchy**: Double borders create confusion about information structure
- **Design system consistency**: Cards are meant for top-level sections, not nested content
- **Accessibility**: Screen readers struggle with deeply nested semantic containers
- **Maintenance**: Card-in-card makes it harder to refactor layout changes

### Button & Link Alignment in Multi-Item Layouts

When displaying multiple items (cards, tiers, packages) with buttons or links below variable-height content, **ALWAYS align buttons on the same y-axis** so they form a single horizontal line.

#### Pattern: Flex Column with Flex-1 Content

Use flexbox with `flex-1` on expandable content to push buttons to the bottom:

#### ❌ Bad: Misaligned buttons
```tsx
<div className="grid grid-cols-4 gap-6">
  {items.map(item => (
    <div key={item.id} className="p-6 rounded-xl border">
      <h3>{item.name}</h3>
      <p>{item.price}</p>
      <ul className="mb-6">  {/* Fixed margin - causes misalignment */}
        {item.features.map(f => <li>{f}</li>)}
      </ul>
      <button>Buy</button>
    </div>
  ))}
</div>
```
**Problem**: Different content heights cause buttons to sit at different y-coordinates

#### ✅ Good: Aligned buttons with flex layout
```tsx
<div className="grid grid-cols-4 gap-6">
  {items.map(item => (
    <div key={item.id} className="p-6 rounded-xl border flex flex-col h-full">
      {/* Header section with fixed spacing */}
      <div className="mb-4">
        <h3>{item.name}</h3>
        <p>{item.price}</p>
      </div>
      {/* Flexible content that expands/shrinks */}
      <ul className="space-y-2 flex-1">
        {item.features.map(f => <li>{f}</li>)}
      </ul>
      {/* Button always at bottom with consistent margin */}
      <button className="mt-6 w-full">Buy</button>
    </div>
  ))}
</div>
```
**Solution**: `flex flex-col h-full` on container + `flex-1` on expandable content + `mt-6` on button

#### Key Techniques
1. **Container**: Add `flex flex-col h-full` to card container
2. **Header**: Wrap fixed-height content (title, price) in `<div className="mb-4">`
3. **Content**: Apply `flex-1` to expandable list/content (e.g., `<ul className="space-y-2 flex-1">`)
4. **Button**: Use `mt-6` (or appropriate margin) to create consistent spacing from content
5. **Width**: Use `w-full` on button for full card width

#### When to Apply This Pattern
- **Grid layouts** with multiple cards of varying content height
- **Pricing cards** where different packages have different feature lists
- **Product cards** where descriptions vary in length
- **Tier comparisons** where tier information varies
- **Any list of similar items** with clickable actions below

#### Why It Matters
- **Consistency**: All buttons align horizontally, creating visual cohesion
- **Professionalism**: Aligned elements feel polished and intentional
- **Scanability**: Users can quickly scan across all action buttons
- **User experience**: Users expect clickable elements to be in the same row

### Search Components
- Use `UserSearch`/`GenericSearch` components over static Select dropdowns
- Implement real database queries with debouncing and pagination
- Avoid static data in search components

### Date Components
- Use Tremor DatePicker components over native date inputs
- Handle timezone considerations properly
- Validate date ranges server-side

### Table Components
- **ALWAYS** use `GenericTable` component for data tables
- Define column configurations using TanStack Table's `ColumnDef` type
- Create column definitions in `/components/table/` directory (e.g., `AdminUsers.tsx`, `Files.tsx`)
- Pass data from server component to `GenericTable` client component
- Example pattern:
  ```typescript
  // page.tsx (Server Component)
  import GenericTable from '@/components/GenericTable';
  import { columns } from '@/components/table/EntityName';

  export default async function Page() {
    const data = await fetchData();
    return <GenericTable tableData={data} tableColumns={columns} />;
  }

  // /components/table/EntityName.tsx (Column definitions)
  'use client';
  import { ColumnDef } from '@tanstack/react-table';

  export const columns: ColumnDef<EntityType>[] = [
    { header: 'Name', accessorKey: 'name', cell: ({ row }) => ... }
  ];
  ```

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

### Next.js 15 Async APIs
- **ALWAYS** await `searchParams` and `params` in page components (Next.js 15+)
- Type them as `Promise<{ key?: string }>` in function signatures
- Example:
```typescript
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const pageNumber = Number(params.page) || 1;
  // ...
}
```

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

### Form Architecture
- **ALWAYS** place form components in `/components/forms/` subdirectory
- **ALWAYS** use `useActionState` hook for form state management
- **ALWAYS** create corresponding server action in `/actions/` folder
- Follow progressive enhancement principles (forms work without JavaScript)
- Use server actions for mutations, API routes for external integrations

### Form State Management with useActionState

The `useActionState` hook (React 19+) provides automatic form state management with server actions:

```typescript
// /components/forms/NewCollectionForm.tsx
'use client';

import { useActionState } from 'react';
import { createCollection, type CreateCollectionState } from '@/actions/collections';

export function NewCollectionForm({ initialData }: FormProps) {
  const [state, formAction, isPending] = useActionState<CreateCollectionState | null, FormData>(
    createCollection,
    null
  );

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <Callout variant="error" title="Error">
          {state.error}
        </Callout>
      )}

      <Input
        name="name"
        placeholder="Collection name"
        required
        disabled={isPending}
      />

      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Collection'}
      </Button>
    </form>
  );
}
```

```typescript
// /actions/collections.ts
'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export interface CreateCollectionState {
  success: boolean;
  error?: string;
  collectionId?: string;
}

export async function createCollection(
  _prevState: CreateCollectionState | null,
  formData: FormData
): Promise<CreateCollectionState> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: 'Unauthorised. Please sign in.' };
    }

    const name = formData.get('name')?.toString().trim();
    if (!name) {
      return { success: false, error: 'Collection name is required' };
    }

    const collection = await prisma.collection.create({
      data: { userId: session.user.id, name }
    });

    redirect(`/collections/${collection.id}`);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create collection'
    };
  }
}
```

### Form Pattern Benefits
- **Automatic loading states**: `isPending` tracks submission status
- **Progressive enhancement**: Forms work without JavaScript
- **Type safety**: Full TypeScript support for state and form data
- **Error handling**: Consistent error state management
- **Redirect support**: Use `redirect()` in server actions for navigation

### Create/Update Mode Detection
Detect whether form is in create or update mode by entity presence:

```typescript
// Form component
export function EntityForm({ entity }: { entity?: Entity }) {
  const action = entity ? updateEntity : createEntity;
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction}>
      {entity && <input type="hidden" name="entityId" value={entity.id} />}
      <Input name="name" defaultValue={entity?.name} />
      <Button type="submit">
        {isPending ? 'Saving...' : entity ? 'Update' : 'Create'}
      </Button>
    </form>
  );
}
```

### Form Validation
- Use Prisma-first validation approach instead of Zod schemas
- Validate on both client and server sides
- Provide clear, specific error messages
- Handle field-level and form-level errors consistently
- Return validation errors in state object for display

### Form UX Patterns
- Use entity-based action selection with hidden ID fields
- Implement proper loading states during submission (`isPending`)
- Disable form inputs during submission to prevent double-submission
- Provide success/error feedback via Callout components
- Handle edge cases (network errors, timeouts)
- Show loading spinner in submit button during submission

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

**When to Use Server Actions:**
- Form submissions and user-triggered mutations (create, update, delete)
- Actions that respond to user input or button clicks
- Operations that need to return state for `useActionState` hook

**When NOT to Use Server Actions:**
- Data fetching/loading functions
- Queries that run on page load or component mount
- Functions called directly from server components

#### Data Fetching Pattern (Do NOT make server actions)

Data fetching should happen directly in server components, not wrapped as server actions. All query functions live in `/lib/query/`:

```typescript
// ❌ WRONG: Data fetching as a server action
// /actions/files.ts
'use server'
export async function getUserFiles() {
  const session = await auth();
  const files = await prisma.file.findMany({...});
  return files;
}

// ✅ RIGHT: Data fetching functions in /lib/query/
// /lib/query/files.ts
export async function getUserFiles() {
  const session = await auth();
  const files = await prisma.file.findMany({...});
  return files;
}

// /lib/query/tokens.ts
export async function getUserTokenBalance(userId: string | undefined) {
  if (!userId) return null;
  return prisma.tokenBalance.findUnique({...});
}

// ✅ Call directly from server component wrapper
// /app/(main)/files/page.tsx (Server Component)
import { getUserFiles } from '@/lib/query/files';
import { getUserTokenBalance } from '@/lib/query/tokens';
import { auth } from '@/lib/auth';

export default async function FilesPage() {
  const session = await auth();

  // Parallel queries for efficiency
  const [tokenBalance, filesResult] = await Promise.all([
    getUserTokenBalance(session?.user?.id),
    getUserFiles({ page: 1, pageSize: 50 }),
  ]);

  return (
    <>
      <FilesTable data={filesResult.files} />
      <TokenDisplay balance={tokenBalance?.balance} />
    </>
  );
}
```

**File organisation:**
- **`/lib/query/`**: All data-fetching queries (read-only database operations)
  - `files.ts` — File queries
  - `tokens.ts` — Token balance queries
  - `collections.ts` — Collection queries, etc.
- **`/actions/`**: Only user-triggered mutations (create, update, delete, state changes)
- **Key difference**: Functions in `/lib/query/` are called directly in server components; functions in `/actions/` with `'use server'` are RPC endpoints for client-side calls

---

## 🔐 Authentication & Security

### Authentication Patterns
- Use NextAuth.js v5 for authentication
- Implement role-based access control (GUEST, CUSTOMER, ADMIN)
- Use session-based authentication with secure cookies
- Validate permissions on both client and server

### Layout-Based Authentication (CRITICAL)
- **NEVER** add redundant authentication checks in page components
- Authentication is handled by parent `layout.tsx` files in protected route groups
- Pages under `(main)` route group are already protected by `/app/(main)/layout.tsx`
- Pages under `(auth)` route group are public and handled by `/app/(auth)/layout.tsx`

#### ❌ Bad: Redundant auth check in page
```typescript
// app/(main)/storage/page.tsx
export default async function StoragePage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login'); // ❌ Unnecessary - layout already checks this
  }
  // ... rest of page
}
```

#### ✅ Good: Trust layout authentication
```typescript
// app/(main)/storage/page.tsx
export default async function StoragePage() {
  const session = await auth();
  // ✅ Session is guaranteed to exist, layout handles redirect

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    // ... query
  });
  // ... rest of page
}
```

#### When to Check Authentication
- **Layout files**: Add `auth()` check with redirect in `layout.tsx` for route groups
- **Server actions**: Always check authentication (not protected by layout)
- **API routes**: Always check authentication (not protected by layout)
- **Page components**: Skip redirect check if layout already protects the route

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

## 📦 Resource Management

### Resource Deployment Patterns
- Use ResourceWizard component for guided resource creation (see `/src/components/resource/ResourceWizard.tsx`)
- Implement proper template system with ResourceTemplate types
- Track deployment progress with real-time status updates
- Handle both mock deployments (development) and real deployments (production)

### Resource Status Management
- **PROVISIONING**: Deployment in progress, poll status every 2 seconds
- **ACTIVE**: Resource ready for use, endpoint and credentials accessible
- **INACTIVE**: Resource stopped or failed, show recovery options
- **MAINTENANCE**: Scheduled maintenance window (optional state)

### Deployment Service Architecture
- Located in `/src/lib/deployment-service.ts`
- Provides `deployResource()`, `getDeploymentStatus()`, `simulateDeployment()` functions
- Handles deployment stage progression (init → allocate → configure → provision → verify → complete)
- Returns structured DeploymentProgress with stage, progress percentage, and user-friendly message

### Resource Configuration
- Store configuration in database `configuration` JSON field
- Include template ID, deployment stage, progress, and stage-specific settings
- Example structure: `{ templateId, deploymentStage, deploymentProgress, deploymentMessage, deployedAt, ...templateConfig }`
- Retrieve configuration through `/api/resources/[resourceId]/deployment-status` endpoint

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

### Logging Best Practises
- **ALWAYS** use the structured logger from `@/lib/logger` instead of `console.log`
- **ALWAYS** include a `service` tag for filtering logs (e.g., `{ service: 'payment' }`)
- Use appropriate log levels: `logger.info()`, `logger.warn()`, `logger.error()`, `logger.debug()`
- Include relevant context in the metadata object (first parameter)
- Keep log messages concise and descriptive (second parameter)
- **NEVER** log secrets, API keys, or sensitive user data

#### Example:
```typescript
import { logger } from '@/lib/logger';

// ✅ Good: Structured logging with service tag
logger.info(
  {
    billId: bill.id,
    amount: bill.amount,
    userId: bill.userId,
    service: 'payment'
  },
  'Processing payment'
);

// ❌ Bad: Console.log without structure
console.log('[Payment] Processing payment for bill:', bill.id);
```

#### Benefits:
- Logs appear in `/admin/logs` page
- Can be filtered by service, level, and time
- Structured data is searchable
- Better for debugging and monitoring
- Production-ready logging format

#### Deployment Job Logging
When logging resource deployment completion, **ALWAYS** use a comprehensive summary format:

```typescript
// ✅ Good: Comprehensive deployment summary
logger.info(
  {
    service: 'resource-deployment',
    resourceId: resource.id,
    templateId: resource.templateId,
    totalDuration: deploymentDuration,
    stages: completedStages,
    endpoint: resource.endpoint,
  },
  `Deployment complete: ${resource.name} (${resource.type}) deployed in ${deploymentDuration}ms - Endpoint: ${resource.endpoint}`
);

// ❌ Bad: Minimal logging without context
logger.info(
  {
    service: 'deployment',
    resourceId: resource.id,
  },
  'Deployment complete'
);
```

**Why the comprehensive summary format is better:**
- Shows deployment progress and outcome at a glance
- Includes resource type and endpoint for monitoring
- Includes timing information for performance analysis
- Provides actionable data for debugging failed deployments
- Tracks deployment success metrics for analytics

### Debugging & Troubleshooting
- Use proper error handling throughout the application
- Implement comprehensive structured logging (without exposing secrets)
- Monitor application performance and errors
- Document known issues and their solutions

---

*This document should be updated as the project evolves and new patterns emerge. Always refer to the latest version for current best practices.*