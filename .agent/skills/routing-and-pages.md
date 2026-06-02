# Routing and Pages Skill

Instructions for managing routes and creating new pages using the Generator-Based Routing System.

---

## Key Locations

| Resource | Path |
|----------|------|
| Main Router | `src/routes/Routes.tsx` |
| Admin Routes | `src/routes/AdminRoutes.tsx` |
| Public Routes | `src/routes/PublicRoutes.tsx` |
| Protected Routes | `src/routes/ProtectedRoutes.tsx` |
| Generators | `src/utils/Generator/` |
| Pages | `src/pages/` |

---

## Routing System Overview

The project uses a **Generator-Based Routing System**:

```
Route Config (AdminRoutes.tsx)
         │
         ├──► RoutesGenerator ──► React Router Routes
         │
         ├──► MenuGenerator ──► Sidebar Menu
         │
         └──► BreadcrumbsGenerator ──► Breadcrumbs (O(1) lookup)
```

Define routes once → Sidebar, Router, and Breadcrumbs stay in sync automatically.

### Generator Utilities

| Generator | Purpose |
|-----------|---------|
| RoutesGenerator | Converts custom route objects into standard react-router-dom routes |
| MenuGenerator | Transforms config into MenuItem array, filters out internal-only routes |
| BreadcrumbsGenerator | Flattens nested routes into key-value map for O(1) lookup |

### RBAC (Role-Based Access Control)

Routes are wrapped in `ProtectedRoute` component that:
- Validates user role against required permissions
- Permissions stored in Redux
- Redirects unauthorized users

```tsx
// ProtectedRoute wraps admin routes
<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

---

## Page Structure Pattern

Every page follows the **Container-Component Pattern**:

```
src/pages/Admin/Employees/
├── Employees.tsx              # Container
│                              # - Data fetching (RTK Query)
│                              # - State management
│                              # - Event handlers
│                              # - Composes child components
│
└── Components/                # Presentational components
    ├── EmployeeTable.tsx      # - Receive props
    ├── EmployeeForm.tsx       # - UI only
    └── EmployeeCard.tsx       # - No API calls
```

### Container Example

```tsx
// src/pages/Admin/Employees/Employees.tsx
import { useState } from 'react';
import { useGetEmployeesQuery, useDeleteEmployeeMutation } from '@/store/Api/employee.api';
import EmployeeTable from './Components/EmployeeTable';
import EmployeeForm from './Components/EmployeeForm';

const Employees = () => {
  const [formOpen, setFormOpen] = useState(false);
  const { data: employees, isLoading } = useGetEmployeesQuery();
  const [deleteEmployee] = useDeleteEmployeeMutation();

  const handleDelete = async (id: string) => {
    await deleteEmployee(id);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Employees</h1>
        <button onClick={() => setFormOpen(true)}>Add Employee</button>
      </div>
      
      <EmployeeTable 
        employees={employees} 
        onDelete={handleDelete} 
      />
      
      {formOpen && <EmployeeForm onClose={() => setFormOpen(false)} />}
    </div>
  );
};

export default Employees;
```

---

## Route Configuration

### Lazy Loading (REQUIRED)

All page components MUST be lazy-loaded:

```tsx
import { lazy } from "react";

const Employees = lazy(() => import("@/pages/Admin/Employees/Employees"));
const Products = lazy(() => import("@/pages/Admin/Products/Products"));
```

---

## Route Types Reference

### 1. Standard Sidebar Link

Appears in sidebar with icon and navigates to page.

```tsx
{
  icon: <Users />,
  name: "Employees",
  path: "employees",
  element: <Employees />,
}
```

**Result:**
- Sidebar: `👥 Employees`
- URL: `/admin/employees`
- Breadcrumbs: `Home > Employees`

---

### 2. Nested Routes

Parent with multiple children. Parent uses `<Outlet />`.

```tsx
{
  icon: <Settings />,
  name: "Settings",
  path: "settings",
  element: <Outlet />,
  children: [
    {
      index: true,
      element: <SettingsIndex />,
    },
    {
      name: "Profile",
      path: "profile",
      element: <ProfileSettings />,
    },
    {
      name: "Security",
      path: "security",
      element: <SecuritySettings />,
    },
  ],
}
```

**Result:**
- Sidebar: `⚙️ Settings` (expandable)
- Children appear as dropdown items
- URL: `/admin/settings/profile`

---

### 3. Hidden Route (Not in Sidebar)

Exists in router but not shown in sidebar. Omit `name`.

```tsx
{
  icon: <Users />,
  name: "Employees",
  path: "employees",
  element: <Outlet />,
  children: [
    {
      index: true,
      element: <EmployeesList />,
    },
    {
      // No 'name' = hidden from sidebar
      path: ":id",
      element: <EmployeeDetails />,
    },
  ],
}
```

**Result:**
- Sidebar: Only shows `Employees`
- URL `/admin/employees/123` works but not in menu
- Breadcrumbs: `Home > Employees > Employee Details`

---

### 4. Expandable Folder (No Navigation)

Sidebar item that expands but doesn't navigate.

```tsx
{
  icon: <Folder />,
  name: "Projects",
  path: "projects",
  // No 'element' = no navigation, just expandable
  children: [
    {
      name: "Active",
      path: "active",
      element: <ActiveProjects />,
    },
    {
      name: "Archived",
      path: "archived",
      element: <ArchivedProjects />,
    },
  ],
}
```

---

### 5. Grouped Menu Items

Organize sidebar with section headers.

```tsx
export const adminRoutes = [
  {
    group: "Main Menu",
    items: [
      { icon: <Home />, name: "Dashboard", path: "dashboard", element: <Dashboard /> },
      { icon: <Users />, name: "Employees", path: "employees", element: <Employees /> },
    ],
  },
  {
    group: "Analytics",
    items: [
      { icon: <Chart />, name: "Reports", path: "reports", element: <Reports /> },
    ],
  },
];
```

**Result:**
```
MAIN MENU
  🏠 Dashboard
  👥 Employees

ANALYTICS
  📊 Reports
```

---

## Adding a New Page: Step by Step

### Step 1: Create Page Folder

```
src/pages/Admin/Products/
├── Products.tsx
└── Components/
    ├── ProductTable.tsx
    └── ProductForm.tsx
```

### Step 2: Create Container Component

```tsx
// src/pages/Admin/Products/Products.tsx
import { useGetProductsQuery } from '@/store/Api/product.api';
import ProductTable from './Components/ProductTable';

const Products = () => {
  const { data: products, isLoading } = useGetProductsQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Products</h1>
      <ProductTable products={products} />
    </div>
  );
};

export default Products;
```

### Step 3: Add Route Configuration

```tsx
// src/routes/AdminRoutes.tsx
import { lazy } from "react";
import { Package } from "lucide-react";

const Products = lazy(() => import("@/pages/Admin/Products/Products"));

// Add to appropriate group:
{
  group: "Inventory",
  items: [
    {
      icon: <Package />,
      name: "Products",
      path: "products",
      element: <Products />,
    },
  ],
}
```

### Step 4: Verify

- [ ] Route appears in sidebar
- [ ] Navigation works
- [ ] Breadcrumbs display correctly
- [ ] Page lazy-loads

---

## Route Properties Reference

| Property | Type | Required | Purpose |
|----------|------|----------|---------|
| `path` | string | Yes | URL segment |
| `element` | ReactNode | Yes* | Component to render |
| `name` | string | No | Sidebar display text (omit to hide) |
| `label` | string | No | Alternative to `name` for public routes |
| `icon` | ReactNode | No | Sidebar icon |
| `children` | array | No | Nested routes |
| `index` | boolean | No | Default child route |
| `group` | string | No | Sidebar section header |

*Required unless creating expandable folder without navigation
