# DESIGN.md

Design system and UX patterns for the Enopax infrastructure deployment platform.

## Design Philosophy

**Minimal: The Google Standard**

> "A single search box and logo. Everyone knows what to do."

**Minimal** means:
- **One action** visible immediately
- **Zero cognitive load** on first visit
- **Progressive disclosure** — complexity only when needed
- **Functional beauty** — form follows function

**Minimalism ≠ No Text**

Minimalism does not mean removing explanatory text. It means:
- **Self-explaining elements** that don't need excessive decoration
- **Explanatory text where it adds clarity** — explaining how the system works, what actions do, why something matters
- **Information density** — precise, helpful content without fluff
- **Clear labels** — descriptive text that reduces confusion, not increases it

The overall design should be **technical but at the same time natural** — precise and information-dense where it matters, whilst feeling effortless and intuitive to use.

**Progressive Disclosure Timing**

Apply gradual complexity reveal across all pages:
- **First glance (0 seconds)**: One primary action immediately visible
- **Second glance (5 seconds)**: Secondary information and context revealed
- **Deep dive (30+ seconds)**: Advanced controls and detailed analytics accessible

**Text serves understanding**:
- Use explanatory sentences to clarify complex concepts (e.g., Storage vs IPFS storage)
- Include helpful context in labels ("all files", "files pinned", "instant access")
- Add descriptions that guide users towards understanding the system
- Balance visual minimalism with textual clarity

## Radical Minimalism Rules (CRITICAL)

### 1. No Tabbed Layouts
- **NEVER** use tabbed interfaces (`<TabNavigation>`, `<TabLayout>`, `<Tabs>`)
- **ALWAYS** use single-scroll pages with progressive disclosure
- **Instead of tabs**: Use vertical sections with proper spacing and dividers
- **Why**: Tabs hide content and create cognitive load; single-scroll is clearer and faster

### 2. Minimal Visualisations
- **NEVER** create custom chart components (`<Chart>`, `<StatsCard>`, donut charts)
- **ALWAYS** prefer native HTML and Tremor primitives:
  - Use `<ProgressBar>` for distribution and percentages
  - Use definition lists (`<dl>`, `<dt>`, `<dd>`) for metrics
  - Use plain text with icons for status indicators
- **Why**: Complex visualisations add cognitive load; simple elements are faster to understand

### 3. Aggressive Page Consolidation
- **Target**: Minimal number of pages (12-15 maximum for entire app)
- **Pattern**: Single-scroll pages with progressive disclosure sections
- **Example**: `/dashboard` shows storage overview → recent files → quick actions (all on one page)
- **Why**: Fewer pages = less navigation = faster task completion

### 4. Component Hierarchy (Strict)
- **First priority**: Tremor components from `/components/common/`
- **Second priority**: Native HTML elements (`<progress>`, `<dl>`, `<section>`)
- **Last resort**: Custom components (only if absolutely necessary)
- **NEVER**: Create component libraries with variants (`<Chart type="...">`, `<StatsCard variant="...">`)
- **Why**: Every new component is maintenance burden; Tremor + HTML covers 95% of needs

### 5. Definition Lists Over Cards
- **NEVER**: Create stat cards, metric cards, or summary cards
- **ALWAYS**: Use semantic HTML definition lists:
  ```tsx
  <dl className="grid grid-cols-3 gap-8">
    <div>
      <dt className="text-sm text-gray-600">Total Storage</dt>
      <dd className="text-2xl font-semibold">2.4 GB</dd>
    </div>
  </dl>
  ```
- **Why**: Semantic HTML is accessible, lightweight, and just as effective

### 6. Single-Scroll Progressive Disclosure
- **Pattern**: Every page follows this structure:
  1. **Header** (page title + primary action)
  2. **Overview** (definition list of key metrics)
  3. **Primary content** (file list, form, etc.)
  4. **Secondary content** (additional details, shown on scroll)
  5. **Tertiary content** (advanced features, bottom of page)
- **Spacing**: Use `space-y-16` for large vertical rhythm between sections
- **Dividers**: Use `<Divider />` with optional text to separate major sections

**Component usage**:
- Use Tremor components from `/components/common/` with awareness:
  - `Button` — for all interactive buttons (focus states, variants)
  - `Callout` — for educational content, tips, warnings (with icon + variant)
  - `Divider` — for visual separation (can include text labels)
  - `ProgressBar` — for distributions and percentages (replaces charts)
- Use Tailwind directly for simple layouts
- Use native HTML for semantic content (`<dl>`, `<section>`, `<progress>`)
- Avoid creating new components unless absolutely necessary
- **Never nest cards** — use Callout for highlighted content, Divider for separation

**Visual restraint**:
- Colour only where functional (brand for CTAs, grey for structure)
- Simple text labels and icons for clarity
- Flat design, subtle borders only
- Avoid technical jargon that users may not understand — explain it instead

The entire design is focused on three core user flows:
1. **Organisation Creation → Team Setup → Resource Provisioning → Management**
2. **Browse Templates → Configure Resource → Deploy → Monitor Progress**
3. **View Dashboard → Manage Resources → Access Endpoints → View Credentials**

Every element serves to guide users through infrastructure deployment and management workflows.

## Colour System

### Brand Colour (Indigo/Purple)
- **Primary**: `#4c63f2` (brand-500) - Main CTAs, pricing cards, active states
- **Gradient**: Brand-to-purple gradient for premium features
- **Range**: 50-900 custom indigo scale defined in `globals.css`

### Neutral Grays
- Light mode: Gray-50 background, gray-900 text
- Dark mode: Gray-950 background, gray-50 text
- Borders: Gray-200 (light) / gray-700 (dark)

### Accent Colours
- **Green-500**: Active resources, successful deployments
- **Orange-500**: Provisioning states, in-progress deployments
- **Red-600**: Failed deployments, destructive actions, errors
- **Blue-500**: Default button colour, information states (Tremor)

## Typography

**Font**: Lexend (local font with full weight range 100-900)
- Headings: SemiBold/Bold (600-700 weight)
- Body: Regular (400 weight)
- Hierarchy: 3xl → 2xl → xl → base → sm
- **Minimal approach**: Use maximum 3 sizes per page

## User Communication

**Clarity over technical accuracy**:
- Use real-world analogies to explain complex concepts
- Prefer simple, descriptive language over technical jargon
- Maintain transparency without exposing backend implementation details

**Language guidelines**:
- Say "resource" or "infrastructure", not "IPFS cluster" or "database instance" in user-facing text
- Explain deployment status clearly: "Provisioning" (in progress), "Active" (ready), "Failed" (needs action)
- Use clear terminology for endpoints and credentials
- Explain **why** something matters, not just **what** it does
- Make technical concepts accessible to non-technical users

**Example**: Instead of "IPFS Cluster deployed with 3 nodes in replication mode", say "Your infrastructure is ready to use at [endpoint]"

## Layout Patterns

### Container Widths
- Marketing pages: `max-w-6xl` or `max-w-7xl`
- Forms/payment: `max-w-3xl` or `max-w-md`
- Dashboard (new): `max-w-4xl` — narrower for readability
- Dashboard (main): `max-w-7xl`

### Spacing
- Page padding: `px-4` (mobile), responsive
- Section spacing: `space-y-16` (large vertical rhythm)
- Section internal: `space-y-8` or `space-y-12`
- List spacing: `space-y-1`, `space-y-2`, `space-y-3`
- Grid gaps: `gap-4`, `gap-6`, `gap-8`

### Grid Layouts
- Pricing: 4-column grid (responsive collapse)
- Dashboard stats: Definition lists (`<dl>`) instead of grid cards
- File lists: Vertical lists with hover states, not tables or cards

### Layout Types by Purpose

**Article/Document style** (`/main/organisations/[orgName]/resources`, `/main/organisations/[orgName]/dashboard`):
- Narrow container (`max-w-4xl`)
- Generous vertical spacing (`space-y-16`)
- Prose-driven with `<section>` tags
- Definition lists for resource metrics
- Dividers with text labels

**List-focused** (`resource list`, `team members list`):
- Clean vertical lists
- Hoverable rows with subtle borders
- Interactive elements (status badges, actions) on the right
- Dividers to separate sections

**Deployment Progress** (resource detail with deployment status):
- Progress indicator showing deployment stages
- Current status with stage information
- Endpoint and credentials display on completion
- Error states with recovery options

## Interaction Patterns

### State Management
- Forms use `useActionState` hook
- Loading states on all async buttons
- Client-side validation feedback
- Server action results show inline errors

### Interactive Elements

**Teaching Through Interaction**:

Interactive elements should educate users whilst they use them:
- **Learn by doing**: Actions immediately demonstrate system behaviour
- **Visual feedback**: Animations and colour changes reinforce conceptual understanding
- **Immediate response**: State changes provide instant confirmation
- **Explanatory tooltips**: Describe action outcomes before interaction
- **Error guidance**: Failed actions explain why and suggest solutions

### Resource Deployment Status Button (Resource Detail Page)

**Purpose**: Show resource deployment progress and provide endpoint/credentials access

**States & Transitions**:
- **Provisioning** (orange, spinner icon) → Deployment in progress, status updates every 2 seconds
- **Active** (green, check icon) → Resource ready to use, show endpoint and credentials
- **Failed** (red, warning icon) → Deployment failed, show error and retry option
- **Inactive** (grey, X icon) → Resource stopped or not yet deployed

**User Flow**:
1. User creates resource via ResourceWizard component
2. Resource enters "PROVISIONING" status
3. Frontend polls `/api/resources/[resourceId]/deployment-status` every 2 seconds
4. Deployment service simulates provisioning (mock) or executes real deployment
5. Progress updates shown in real-time with stage information (init → provision → complete)
6. On completion, resource status changes to "ACTIVE"
7. Endpoint and credentials displayed in resource details
8. User can copy credentials or access endpoint URL

**Key UX Elements**:
- **Real-time progress**: Polling shows current deployment stage and percentage
- **Status message**: User-friendly text explaining what's happening
- **Endpoint & credentials**: Displayed immediately on completion
- **Error recovery**: Failed state shows error message with retry option
- **Auto-refresh**: Frontend automatically stops polling on completion

**Animation Standards**:
- **Scale animations**: Grow = deployment starting, shrink = resource stopping
- **Ping effects**: Draw attention to active deployments or important status changes
- **Loading states**: Spinner during async deployment operations
- **Transitions**: Smooth, fast (150ms), using cubic-bezier easing
- **Progress indication**: Animated progress bar for deployment stages
- **Auto-hide messages**: Success/error messages disappear after 5 seconds

**Example patterns**:
- Deployment progress bar animating through stages (init → allocate → provision → complete)
- Resource status badge colour changing on deployment (blue → orange → green)
- Button state changing from "Create" to spinner to success confirmation

## Dark Mode

**Implementation**: Custom variant in `globals.css`
```css
@custom-variant dark (&:where(.dark, .dark *));
```

**Strategy**: Automatic colour inversion
- Backgrounds: 50 ↔ 950
- Text: 900 ↔ 50
- Borders: 200 ↔ 700
- Brand colours: Remain consistent (accessibility-checked)

## Animations

**Philosophy**: Subtle, fast, smooth

**Defined animations** (150ms cubic-bezier):
- Slide and fade (4 directions)
- Accordion open/close
- Dialog overlay/content
- Drawer slide

**Usage**: Primarily for dropdowns, dialogs, accordions (Radix UI components)

## Iconography

**Library**: Remix Icon (`@remixicon/react`)

**Common icons**:
- `RiCheckLine`: Resource active state, deployment complete
- `RiSettings3Line`: Configuration, resource settings
- `RiKeyLine`: API keys, credentials, secrets
- `RiDatabaseLine`: Database resources
- `RiSoundcloudLine`: IPFS clusters or distributed systems
- `RiServer2Line`: Server resources, deployment infrastructure
- `RiGlobalLine`: Endpoints, public access points
- `RiTimeLine`: Deployment progress, time-based operations
- `RiSpinner2Line`: Loading states, deployment in progress
- `RiAlertLine`: Errors, failed deployments
- `RiInformationLine`: Information, helpful tips
- `RiLightbulbLine`: Educational content, guidance
- `RiArrowLeftLine`: Back navigation
- `RiTeamLine`: Teams, organisation members
- `RiTeamFill`: Team ownership indicator

**Size**: Typically `size-4` or `size-5`

**Functional colour**:
- Green: Active resources, successful deployments
- Orange: Provisioning, in-progress operations
- Red: Errors, failed deployments, destructive actions
- Blue: Information, default states
- Grey: Neutral interface elements, inactive resources

## Resource Provisioning Optimisation

### Primary CTAs
- Always visible above fold
- High contrast (brand colour on light/dark background)
- Large touch targets (`px-8 py-3`)
- Clear, action-oriented text (e.g., "Create Resource", "Deploy Now")

### Friction Reduction
- Minimal form fields during creation
- Clear, guided deployment flow
- Step-by-step wizard for resource configuration
- Real-time status feedback during provisioning

### Visibility & Clarity
- Resource status prominently displayed
- Orange colour during provisioning, green when active
- Deployment progress shown with real-time updates
- Clear endpoint and credentials display on completion

### Trust Signals
- Show estimated deployment time
- Clear resource specifications before creation
- Infrastructure location and provider information
- Transparent error messages on failed deployments

## Component Usage Guidelines

### Callout Component

**When to use**:
- Educational content that needs emphasis
- System behaviour explanations
- Tips and helpful information
- Process descriptions (numbered steps)

**Variants**:
- `neutral` — General information, explanations (most common)
- `default` — Info/tips (blue)
- `success` — Positive confirmations (green)
- `warning` — Cautions (yellow)
- `error` — Errors, critical info (red)

**Best practises**:
See [BEST-PRACTICES.md](./BEST-PRACTICES.md) for advanced development practices

- Always include an icon (`RiInformationLine`, `RiLightbulbLine`, etc.)
- Keep title concise (3-7 words)
- Use for deployment instructions, resource explanations, and helpful guidance
- Use when explaining resource types, templates, or deployment requirements
- Avoid nesting callouts or putting them in cards
- For data tables, use GenericTable and create a specific component for each table in /components/table


## Accessibility

- Focus ring utility (`focusRing`) on all interactive elements
- Semantic HTML structure (`<section>`, `<dl>`, `<dt>`, `<dd>`)
- ARIA labels on icon-only buttons
- Loading state announcements (`sr-only` text)
- Keyboard navigation support (Radix UI)
- Sufficient colour contrast ratios
- Tooltips with `title` attributes for icons and interactive elements
