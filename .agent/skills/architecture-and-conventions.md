# Architecture and Conventions Skill

Core architectural patterns, colocation rules, and development conventions for the RST project.

---

## Core Philosophy

| Principle | Description |
|-----------|-------------|
| Scalability | Feature-based organization |
| Maintainability | Strict type safety and colocation |
| Performance | Lazy loading and optimized rendering |
| Consistency | Shared patterns and conventions |

---

## Directory Structure

```
src/
├── common/              # Complex shared components
├── components/ui/       # Reusable UI primitives
├── hooks/               # Global custom hooks
├── Layout/              # Layout components
├── pages/               # Page components
│   ├── Admin/           # Protected admin pages
│   ├── Auth/            # Authentication pages
│   └── Public/          # Public pages
├── routes/              # Route configurations
├── store/               # Redux store
│   ├── Api/             # RTK Query services
│   └── features/        # Redux slices
├── types/               # Global TypeScript definitions
├── utils/               # Utility functions
├── App.tsx
├── main.tsx
└── index.css
```

---

## Feature-Based Organization

Each feature is self-contained:

```
src/pages/Admin/Employees/
├── Employees.tsx              # Container component
└── Components/                # Feature-specific components
    ├── EmployeeTable.tsx
    ├── EmployeeForm.tsx
    └── EmployeeCard.tsx
```

---

## API Colocation Rules

### The Rule

Every API service file MUST have a sibling types file.

```
src/store/Api/
├── employee.api.ts           # API endpoints
├── employee.apiTypes.ts      # Types (MUST exist)
```

### Type Naming Convention

| Pattern | Purpose | Example |
|---------|---------|---------|
| `{Entity}` | Single entity | `Employee` |
| `Get{Entity}Response` | GET single response | `GetEmployeeResponse` |
| `Get{Entities}Response` | GET list response | `GetEmployeesResponse` |
| `Create{Entity}Payload` | POST request body | `CreateEmployeePayload` |
| `Update{Entity}Payload` | PUT/PATCH request body | `UpdateEmployeePayload` |

### Example

```tsx
// employee.apiTypes.ts
export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface GetEmployeeResponse extends Employee {}

export interface GetEmployeesResponse extends Array<Employee> {}

export interface CreateEmployeePayload {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface UpdateEmployeePayload {
  id: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
}
```

---

## Type Safety Rules

### Global Types

Place shared types in `src/types/`:

```tsx
// src/types/ApiResponse.ts
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

### Component Types

Define component-specific types in the component file:

```tsx
// Good - types with component
interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const EmployeeTable = ({ employees, onEdit, onDelete }: EmployeeTableProps) => {
  // ...
};
```

### Never Use `any`

```tsx
// Bad
const data: any = fetchData();

// Good
const data: Employee[] = fetchData();

// If type is unknown, use unknown and validate
const data: unknown = fetchData();
if (isEmployeeArray(data)) {
  // data is now typed as Employee[]
}
```

---

## Performance Rules

### 1. Lazy Loading (Required)

All page components MUST be lazy-loaded:

```tsx
import { lazy } from "react";

const Dashboard = lazy(() => import("@/pages/Admin/Dashboard/Dashboard"));
const Employees = lazy(() => import("@/pages/Admin/Employees/Employees"));
```

### 2. Suspense Boundaries

Wrap lazy components with Suspense:

```tsx
import { Suspense } from "react";

<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>
```

### 3. Memoization

Memo expensive operations:

```tsx
import { memo, useMemo, useCallback } from 'react';

// Memo components
const ExpensiveList = memo(({ items }: Props) => { /* ... */ });

// Memo computations
const sortedItems = useMemo(() => 
  items.sort((a, b) => a.name.localeCompare(b.name)),
  [items]
);

// Memo callbacks
const handleSubmit = useCallback((data: FormData) => {
  submit(data);
}, [submit]);
```

---

## Styling Conventions

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F8FAFC` | Card backgrounds |
| Border | `gray-200` | Container borders |
| Radius Small | `rounded-md` | Buttons, inputs |
| Radius Medium | `rounded-lg` | Cards, modals |

### Design Principles

1. **Premium Aesthetics**: High-contrast text, vibrant primary colors, soft backgrounds
2. **Global Variables**: Use CSS custom properties for colors, fonts, spacing - easier to maintain
3. **Data Presentation**: Striped tables with hover states, descriptive empty states
4. **Micro-interactions**: Smooth transitions with Framer Motion for modals, CSS for hover
5. **Single Entry Point**: `src/index.css` is the only global styling file

### Global Variables

Use CSS custom properties for consistency:

```css
/* src/index.css */
:root {
  --background: #F8FAFC;
  --border: #E5E7EB;
  --primary: #3B82F6;
  --text-primary: #111827;
  --text-muted: #6B7280;
}
```

### Utility Pattern

Use `cn()` for conditional classes:

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)}>
```

---

## Import Organization

Organize imports in this order:

```tsx
// 1. React
import { useState, useEffect } from 'react';

// 2. Third-party
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';

// 3. Internal (with @ alias)
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/hooks/useRedux';

// 4. Relative imports
import EmployeeTable from './Components/EmployeeTable';
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Page Component | PascalCase | `EmployeeList.tsx` |
| UI Component | PascalCase | `Button.tsx` |
| Feature Component | PascalCase | `EmployeeCard.tsx` |
| Hook | camelCase + `use` | `useDebounce.ts` |
| API File | camelCase + `.api` | `employee.api.ts` |
| API Types | camelCase + `.apiTypes` | `employee.apiTypes.ts` |
| Redux Slice | camelCase + `Slice` | `authSlice.ts` |
| Utility | camelCase | `formatDate.ts` |
| Type/Interface | PascalCase | `ApiResponse.ts` |
| Constant | SCREAMING_SNAKE | `API_BASE_URL` |

---

## Error Handling

### API Errors

```tsx
const [createEmployee, { error, isLoading }] = useCreateEmployeeMutation();

// Display error
{error && 'data' in error && (
  <p className="text-red-500">{error.data.message}</p>
)}
```

### Error Boundary

```tsx
// Wrap main app
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

---

## Code Quality Checklist

Before committing:

- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] No `any` types
- [ ] Components are properly typed
- [ ] API files have types files
- [ ] Lazy loading for pages
- [ ] `npm run build` succeeds
