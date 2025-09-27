# Component Architecture

This document outlines the component folder structure and organisation in the Next.js application.

## 📁 Folder Structure

### `/components/navigation/`
Navigation and menu components for app navigation.

- **`CommandPalette.tsx`** - Smart search interface (Cmd+K) with fuzzy search and keyboard navigation
- **`CommandPaletteProvider.tsx`** - Context provider and keyboard handler for command palette
- **`SidebarNavigation.tsx`** - Main sidebar navigation for desktop
- **`MobileNavigation.tsx`** - Mobile-responsive navigation menu
- **`AdminNavigation.tsx`** - Admin-specific navigation interface

### `/components/layout/`
Core layout components that structure the application.

- **`UserBar.tsx`** - Top navigation bar with user information and actions
- **`UserBarNav.tsx`** - Navigation items within the user bar
- **`UserBarMenu.tsx`** - User dropdown menu with profile and settings
- **`Footer.tsx`** - Application footer with links and branding
- **`Logo.tsx`** - Brand logo component used across the application

### `/components/dashboard/`
Dashboard-specific components for data visualisation and monitoring.

- **`ResourcesHealthDashboard.tsx`** - Overview of resource health and status monitoring
- **`StorageUsageDisplay.tsx`** - Visual representation of storage usage and limits

### `/components/user/`
User management and profile related components.

- **`UserInfo.tsx`** - Display user profile information and details
- **`InputUserImage.tsx`** - User avatar upload and management interface
- **`MemberList.tsx`** - List component for displaying team/organisation members

### `/components/project/`
Project management and display components.

- **`ProjectGrid.tsx`** - Basic grid layout for displaying projects
- **`EnhancedProjectGrid.tsx`** - Advanced project grid with filtering and search
- **`ProjectsToolbar.tsx`** - Toolbar with project actions and filters

### `/components/file/`
File management and upload functionality.

- **`FileManagement.tsx`** - Complete file management interface
- **`FileUpload.tsx`** - File upload component with drag-and-drop support

### `/components/payment/`
Payment processing and billing components.

- **`PayPalCheckout.tsx`** - PayPal integration for payment processing

### `/components/common/`
Reusable UI components and design system elements.

- **Tremor Components** - UI library components for consistent design
- **Form Elements** - Inputs, buttons, selectors, and form controls
- **Data Display** - Tables, cards, modals, and layout components
- **Navigation** - Breadcrumbs and other navigation utilities

### `/components/form/`
Form-specific components for data input and management.

- Various form components for different entities (projects, teams, organisations, etc.)
- Specialised form controls and validation components

### `/components/dialog/`
Modal dialogs and popup interfaces.

- Confirmation dialogs, galleries, sharing interfaces, and payment modals

### `/components/table/`
Data table components and column definitions.

- Table components for different data types (resources, projects, users, etc.)

### `/components/search/`
Search functionality and related components.

- Search interfaces and result displays

### `/components/resource/`
Resource management specific components.

- Resource-related UI components and wizards

### `/components/` (Root Level)
Components that don't fit into specific categories.

- **`GenericTable.tsx`** - Reusable table component
- **`TeamFilter.tsx`** - Team filtering interface
- **`GenericSearch.tsx`** - Generic search component
- **`NodesClient.tsx`** - IPFS nodes management
- **`DiscordSection.tsx`** - Discord integration
- And other utility components

## 🎨 Design Principles

### Organisation Strategy
- **Domain-based grouping** - Components are organised by their primary use case
- **Reusability focus** - Common components are easily discoverable in `/common/`
- **Feature isolation** - Related components are grouped together for better maintainability

### Import Patterns
```typescript
// Navigation components
import CommandPalette from '@/components/navigation/CommandPalette';

// Layout components
import UserBar from '@/components/layout/UserBar';

// Dashboard components
import StorageUsageDisplay from '@/components/dashboard/StorageUsageDisplay';

// Common/reusable components
import { Button } from '@/components/common/Button';
```

### Component Types

1. **Page Components** - Full page layouts and containers
2. **Feature Components** - Business logic specific components
3. **UI Components** - Reusable interface elements
4. **Layout Components** - Structural page elements
5. **Form Components** - Data input and validation

## 🚀 Best Practices

### When Creating New Components

1. **Determine the appropriate folder** based on the component's primary purpose
2. **Use common components** when possible before creating new ones
3. **Follow existing patterns** for imports and exports
4. **Consider reusability** - if it might be used elsewhere, put it in `/common/`

### Folder Guidelines

- **Navigation**: Any component that helps users move through the app
- **Layout**: Structural components that define page layout
- **Dashboard**: Data visualisation and monitoring components
- **User**: User profile, authentication, and member management
- **Project**: Project-specific functionality and displays
- **File**: File operations, uploads, and management
- **Payment**: Billing, payments, and subscription components
- **Common**: Reusable UI components used across multiple features

## 📋 Component Index

For a complete list of all components and their purposes, refer to the individual folder contents. Each component follows the project's coding standards and includes proper TypeScript definitions.

---

*This architecture supports scalable development and maintainable code organisation. When in doubt about component placement, consider the primary use case and follow the domain-based grouping strategy.*