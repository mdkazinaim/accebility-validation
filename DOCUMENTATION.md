# React + TypeScript Starter Template (RST)

A premium, production-ready starter template for React applications with modern tooling and best practices.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Project Structure](#project-structure)
- [Technical Stack](#technical-stack)
- [Available Scripts](#available-scripts)
- [Routing System](#routing-system)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Component Guidelines](#component-guidelines)
- [Styling](#styling)
- [Adding New Features](#adding-new-features)

---

## Quick Start

### Create a New Project

```bash
# Using npx (recommended)
npx create-rst my-new-app

# Using npm init
npm create rst my-new-app

# Install globally
npm install -g create-rst
create-rst my-new-app
```

### Run the Project

```bash
cd my-new-app
npm run dev
```

The application will be available at `http://localhost:5173`

---

## Features

| Feature | Description |
|---------|-------------|
| Vite | Lightning fast build tool with HMR |
| TypeScript | Full type safety and IntelliSense |
| Tailwind CSS v4 | Utility-first CSS framework |
| Redux Toolkit | State management with RTK Query |
| Redux Persist | Persistent state storage |
| React Router DOM v7 | Client-side routing |
| Radix UI | Accessible UI primitives |
| Framer Motion | Production-ready animations |
| React Hook Form + Zod | Form handling with validation |
| Axios | HTTP client pre-configured |
| Lucide React | Beautiful icons |

---

## Project Structure

### Root Structure

```
src/
├── common/              # Complex shared components
├── components/          # Reusable UI primitives
├── hooks/               # Custom React hooks
├── Layout/              # Layout components
├── pages/               # Page components
├── routes/              # Route configurations
├── store/               # Redux store
├── types/               # TypeScript definitions
├── utils/               # Utility functions
├── App.tsx
├── main.tsx
└── index.css
```

### Page Structure Pattern (IMPORTANT)

Each page follows a **Container-Component Pattern**:

```
src/pages/
├── Admin/                          # Protected admin section
│   ├── Dashboard/
│   │   ├── AdminDashboard.tsx      # Container component
│   │   └── Components/             # Dashboard-specific components
│   │       ├── StatsCard.tsx
│   │       ├── RevenueChart.tsx
│   │       └── RecentOrders.tsx
│   │
│   ├── Overview/
│   │   ├── Overview.tsx            # Container component
│   │   └── Components/             # Overview-specific components
│   │       ├── SummaryCard.tsx
│   │       ├── ActivityList.tsx
│   │       └── QuickActions.tsx
│   │
│   ├── Employees/
│   │   ├── Employees.tsx           # Container component
│   │   └── Components/             # Employees-specific components
│   │       ├── EmployeeTable.tsx
│   │       ├── EmployeeForm.tsx
│   │       └── EmployeeCard.tsx
│   │
│   └── Settings/
│       ├── Settings.tsx            # Container component
│       └── Components/             # Settings-specific components
│           ├── ProfileSettings.tsx
│           ├── NotificationSettings.tsx
│           └── SecuritySettings.tsx
│
├── Auth/                           # Authentication pages
│   ├── Login.tsx
│   └── Signup.tsx
│
└── Public/                         # Public pages
    ├── Home/
    │   ├── Home.tsx                # Container component
    │   └── Components/             # Home-specific components
    │       ├── Hero.tsx
    │       ├── Features.tsx
    │       └── Testimonials.tsx
    │
    ├── About/
    │   ├── About.tsx
    │   └── Components/
    │       ├── Team.tsx
    │       └── Mission.tsx
    │
    ├── Contact/
    │   ├── Contact.tsx
    │   └── Components/
    │       ├── ContactForm.tsx
    │       └── Map.tsx
    │
    └── Services/
        ├── Services.tsx
        └── Components/
            ├── ServiceCard.tsx
            └── Pricing.tsx
```

### Container-Component Pattern Explained

The main page file (e.g., `Overview.tsx`) acts as a **Container** that:
- Fetches data
- Manages state
- Handles business logic
- Composes child components

The `Components/` folder contains **Presentational Components** specific to that page:

```tsx
// src/pages/Admin/Overview/Overview.tsx (Container)
import { useGetOverviewQuery } from '@/store/Api/overview.api';
import SummaryCard from './Components/SummaryCard';
import ActivityList from './Components/ActivityList';

const Overview = () => {
  const { data, isLoading } = useGetOverviewQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <h1>Overview</h1>
      <SummaryCard data={data?.summary} />
      <ActivityList activities={data?.activities} />
    </div>
  );
};

export default Overview;
```

```tsx
// src/pages/Admin/Overview/Components/SummaryCard.tsx (Presentational)
interface SummaryCardProps {
  data?: {
    totalUsers: number;
    revenue: number;
  };
}

const SummaryCard = ({ data }: SummaryCardProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 border rounded-md">
        <p className="text-sm text-gray-500">Total Users</p>
        <p className="text-2xl font-bold">{data?.totalUsers}</p>
      </div>
      <div className="p-4 border rounded-md">
        <p className="text-sm text-gray-500">Revenue</p>
        <p className="text-2xl font-bold">${data?.revenue}</p>
      </div>
    </div>
  );
};

export default SummaryCard;
```

### Other Important Folders

```
src/components/ui/           # Global reusable UI primitives
├── button.tsx
├── avatar.tsx
├── popover.tsx
├── sonner.tsx
└── ...

src/common/                  # Complex shared components
├── CommonWrapper.tsx
└── WorkInProgress.tsx

src/hooks/                   # Global custom hooks
├── useDebounce.ts
└── useRedux.ts

src/store/
├── store.ts                 # Store configuration
├── Api/                     # RTK Query services
│   ├── BaseApi/
│   │   └── BaseApi.ts
│   ├── Auth.api.ts
│   └── Auth.apiTypes.ts
└── features/                # Redux slices
    └── AuthSlice/

src/types/                   # Global TypeScript types
├── index.ts
├── ApiTypes/
└── GeneratorTypes.ts

src/utils/Generator/         # Route/Menu generators
├── RoutesGenerator.tsx
├── MenuGenerator.ts
└── BreadcrumbsGenerator.ts
```

---

## Technical Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | React | 19.x |
| Build Tool | Vite | 6.x |
| Language | TypeScript | 5.7.x |
| Styling | Tailwind CSS | 4.x |
| State | Redux Toolkit | 2.x |
| Routing | React Router DOM | 7.x |
| Forms | React Hook Form + Zod | Latest |
| Icons | Lucide React | Latest |

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## Routing System

### How Routing Works

This project uses a **Generator-Based Routing System**. You define routes in configuration files, and the system automatically generates:
1. React Router routes
2. Sidebar menu items
3. Breadcrumbs

### Route Configuration Files

| File | Purpose |
|------|---------|
| `src/routes/Routes.tsx` | Main router setup with lazy loading |
| `src/routes/AdminRoutes.tsx` | Admin panel route definitions |
| `src/routes/PublicRoutes.tsx` | Public pages route definitions |
| `src/routes/ProtectedRoutes.tsx` | Auth-protected route wrapper |

---

### Use Case 1: Simple Sidebar Link

A basic route that appears in the sidebar and navigates to a page.

**Route Definition:**
```tsx
// src/routes/AdminRoutes.tsx
{
  icon: <Users />,           // Icon shown in sidebar
  name: "Employees",         // Text shown in sidebar
  path: "employees",         // URL: /admin/employees
  element: <Employees />,    // Page component
}
```

**Result:**
- Sidebar shows: `👥 Employees`
- Clicking navigates to: `/admin/employees`
- Breadcrumbs: `Home > Employees`

---

### Use Case 2: Nested Routes with Parent Layout

A parent route with multiple child routes. Parent uses `<Outlet />` to render children.

**Route Definition:**
```tsx
// src/routes/AdminRoutes.tsx
{
  icon: <ChartPie />,
  name: "Overview",
  path: "overview",
  element: <Outlet />,        // Parent uses Outlet
  children: [
    {
      index: true,            // Default child route
      element: <OverviewIndex />,
    },
    {
      name: "Analytics",
      path: "analytics",      // URL: /admin/overview/analytics
      element: <OverviewAnalytics />,
    },
    {
      name: "Reports",
      path: "reports",        // URL: /admin/overview/reports
      element: <OverviewReports />,
    },
  ],
}
```

**Result:**
- Sidebar shows expandable: `📊 Overview` with dropdown
- Dropdown items: `Analytics`, `Reports`
- Breadcrumbs: `Home > Overview > Analytics`

---

### Use Case 3: Hidden Route (Not in Sidebar)

A route that exists but doesn't appear in the sidebar menu. Useful for detail pages.

**Route Definition:**
```tsx
// src/routes/AdminRoutes.tsx
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
      path: ":id",                    // URL: /admin/employees/123
      element: <EmployeeDetails />,
    },
  ],
}
```

**Result:**
- Sidebar shows only: `Employees`
- Clicking an employee navigates to: `/admin/employees/123`
- This detail page is NOT in sidebar
- Breadcrumbs: `Home > Employees > Employee Details`

---

### Use Case 4: Deeply Nested Routes

Multiple levels of nesting for complex hierarchies.

**Route Definition:**
```tsx
{
  icon: <Settings />,
  name: "Settings",
  path: "settings",
  element: <Outlet />,
  children: [
    {
      name: "Profile",
      path: "profile",
      element: <Outlet />,
      children: [
        {
          name: "Personal",
          path: "personal",      // /admin/settings/profile/personal
          element: <PersonalSettings />,
        },
        {
          name: "Work",
          path: "work",          // /admin/settings/profile/work
          element: <WorkSettings />,
        },
      ],
    },
  ],
}
```

---

### Use Case 5: Grouped Menu Items

Organize sidebar items into logical groups with headers.

**Route Definition:**
```tsx
export const adminRoutes = [
  {
    group: "Main Menu",          // Group header
    items: [
      { icon: <Home />, name: "Dashboard", path: "dashboard", element: <Dashboard /> },
      { icon: <Users />, name: "Employees", path: "employees", element: <Employees /> },
    ],
  },
  {
    group: "Analytics",          // Another group header
    items: [
      { icon: <Chart />, name: "Reports", path: "reports", element: <Reports /> },
      { icon: <Trending />, name: "Insights", path: "insights", element: <Insights /> },
    ],
  },
  {
    group: "Support",
    items: [
      { icon: <Help />, name: "Help", path: "help", element: <Help /> },
      { icon: <Settings />, name: "Settings", path: "settings", element: <Settings /> },
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
  📈 Insights

SUPPORT
  ❓ Help
  ⚙️ Settings
```

---

### Use Case 6: Expandable Folder (No Direct Link)

A sidebar item that expands to show children but doesn't navigate itself.

**Route Definition:**
```tsx
{
  icon: <Folder />,
  name: "Projects",
  path: "projects",
  // No 'element' = no navigation, just expandable
  children: [
    {
      name: "Active",
      path: "active",       // /admin/projects/active
      element: <ActiveProjects />,
    },
    {
      name: "Archived",
      path: "archived",     // /admin/projects/archived
      element: <ArchivedProjects />,
    },
  ],
}
```

**Result:**
- Clicking `Projects` expands/collapses the dropdown
- Does NOT navigate anywhere
- Children navigate normally

---

### Use Case 7: Public Routes

Routes accessible without authentication.

**Route Definition:**
```tsx
// src/routes/PublicRoutes.tsx
export const publicRoutes = [
  {
    label: "Home",          // 'label' instead of 'name'
    index: true,            // Root path /
    element: <Home />,
  },
  {
    label: "About",
    path: "/about",
    element: <About />,
  },
  {
    label: "Contact",
    path: "/contact",
    element: <Contact />,
  },
];
```

---

### Routing Summary Table

| Property | Purpose | Required? |
|----------|---------|-----------|
| `path` | URL path segment | Yes |
| `element` | React component to render | Yes (unless parent-only) |
| `name` / `label` | Display text in sidebar/breadcrumbs | No (omit to hide from sidebar) |
| `icon` | Sidebar icon | No |
| `children` | Nested routes | No |
| `index` | Default child route | No |
| `group` | Sidebar section header | No (only in grouped config) |

---

## State Management

### Store Setup

```tsx
// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import baseApi from "./Api/BaseApi/BaseApi";
import authReducer from "./features/AuthSlice/authSlice";

const persistConfig = {
  key: "root",
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: persistedAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(baseApi.middleware),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Redux Persist

Authentication state is automatically persisted to localStorage.

### Using Redux in Components

```tsx
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';

const MyComponent = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  
  // ...
};
```

---

## API Integration

### Base API Setup

```tsx
// src/store/Api/BaseApi/BaseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.example.com',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Employee', 'Project'],  // Define tag types
  endpoints: () => ({}),
});

export default baseApi;
```

### Creating an API Service with Cache Tags

RTK Query uses tags for cache invalidation. Use the **LIST pattern** for proper cache management:

```tsx
// src/store/Api/user.api.ts
import baseApi from './BaseApi/BaseApi';
import type { 
  GetUsersResponse, 
  GetUserResponse, 
  CreateUserPayload,
  UpdateUserPayload,
  DeleteUserResponse 
} from './user.apiTypes';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET all users - provides LIST tag
    getUsers: builder.query<GetUsersResponse, void>({
      query: () => '/users',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),

    // GET single user - provides specific tag
    getUser: builder.query<GetUserResponse, string>({
      query: (id) => `/users/${id}`,
      providesTags: (_, __, id) => [{ type: 'User', id }],
    }),

    // CREATE user - invalidates LIST
    createUser: builder.mutation<GetUserResponse, CreateUserPayload>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // UPDATE user - invalidates specific + LIST
    updateUser: builder.mutation<GetUserResponse, UpdateUserPayload>({
      query: ({ id, ...body }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),

    // DELETE user - invalidates LIST
    deleteUser: builder.mutation<DeleteUserResponse, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
```

### How Cache Tags Work

```
┌─────────────────────────────────────────────────────────────────┐
│                     CACHE TAG SYSTEM                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  providesTags: "I provide data with these tags"                 │
│  invalidatesTags: "Invalidate cache with these tags"            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  getUsers()     → provides: [User/1, User/2, User/LIST]        │
│                                                                  │
│  createUser()   → invalidates: [User/LIST]                     │
│                   → getUsers() refetches automatically          │
│                                                                  │
│  updateUser(5)  → invalidates: [User/5, User/LIST]             │
│                   → getUser(5) refetches                        │
│                   → getUsers() refetches                        │
│                                                                  │
│  deleteUser(3)  → invalidates: [User/3, User/LIST]             │
│                   → getUsers() refetches                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Type Colocation Rule

Keep API types alongside API files:

```
src/store/Api/
├── user.api.ts           # API endpoints
├── user.apiTypes.ts      # Types for user API
├── auth.api.ts
├── auth.apiTypes.ts
└── BaseApi/
    └── BaseApi.ts
```

### API Types Example

```tsx
// src/store/Api/user.apiTypes.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface GetUsersResponse extends Array<User> {}

export interface GetUserResponse extends User {}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export interface UpdateUserPayload {
  id: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'user';
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}
```

---

## Component Guidelines

### Three Types of Components

| Type | Location | Purpose | Example |
|------|----------|---------|---------|
| Container | `pages/*/PageName.tsx` | Data fetching, state, logic | `Overview.tsx` |
| Feature Component | `pages/*/Components/` | Page-specific UI | `StatsCard.tsx` |
| UI Primitive | `components/ui/` | Reusable across app | `Button`, `Avatar` |
| Common Component | `common/` | Shared complex components | `DynamicTable` |

### When to Use What

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPONENT DECISION TREE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Is it used in multiple pages?                                   │
│      │                                                           │
│      ├── YES → Is it simple UI (button, input)?                 │
│      │           │                                               │
│      │           ├── YES → src/components/ui/                   │
│      │           │                                               │
│      │           └── NO → src/common/                           │
│      │                                                           │
│      └── NO → src/pages/PageName/Components/                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### UI Components (`src/components/ui/`)

Pure, reusable primitives following Radix UI patterns:

```tsx
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

<Button variant="default" size="md">Click me</Button>
<Avatar src="/user.jpg" alt="User" />
```

---

## Styling

### Global Styles

All global styles are in `src/index.css`:

```css
@import "tailwindcss";

:root {
  --primary: ...;
  --background: #F8FAFC;
}
```

### Design Guidelines

| Element | Convention |
|---------|------------|
| Backgrounds | `#F8FAFC` (soft white) |
| Borders | `border-gray-200` |
| Border Radius | `rounded-md` or `rounded-lg` |
| Transitions | Framer Motion for modals, CSS for hovers |

---

## Adding New Features

### Step-by-Step: Adding "Products" Module

#### 1. Create Page Structure

```
src/pages/Admin/Products/
├── Products.tsx              # Container
└── Components/
    ├── ProductTable.tsx
    ├── ProductForm.tsx
    └── ProductCard.tsx
```

#### 2. Create the Container

```tsx
// src/pages/Admin/Products/Products.tsx
import { useState } from 'react';
import { 
  useGetProductsQuery, 
  useCreateProductMutation 
} from '@/store/Api/product.api';
import ProductTable from './Components/ProductTable';
import ProductForm from './Components/ProductForm';

const Products = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { data: products, isLoading } = useGetProductsQuery();
  const [createProduct] = useCreateProductMutation();

  const handleCreate = async (data: CreateProductPayload) => {
    await createProduct(data);
    setIsFormOpen(false);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => setIsFormOpen(true)}>Add Product</Button>
      </div>
      
      <ProductTable products={products} />
      
      {isFormOpen && (
        <ProductForm 
          onSubmit={handleCreate} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}
    </div>
  );
};

export default Products;
```

#### 3. Create API Service

```tsx
// src/store/Api/product.api.ts
import baseApi from './BaseApi/BaseApi';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => '/products',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    
    createProduct: builder.mutation<Product, CreateProductPayload>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
  }),
});

export const { useGetProductsQuery, useCreateProductMutation } = productApi;
```

#### 4. Add Types

```tsx
// src/store/Api/product.apiTypes.ts
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface CreateProductPayload {
  name: string;
  price: number;
  stock: number;
}
```

#### 5. Add Route

```tsx
// src/routes/AdminRoutes.tsx
import Products from '@/pages/Admin/Products/Products';

// Add to the appropriate group:
{
  icon: <Package />,
  name: "Products",
  path: "products",
  element: <Products />,
}
```

#### 6. Add Tag Type to BaseApi

```tsx
// src/store/Api/BaseApi/BaseApi.ts
const baseApi = createApi({
  // ...
  tagTypes: ['User', 'Employee', 'Project', 'Product'],  // Add 'Product'
  // ...
});
```

---

## Path Aliases

The `@` alias maps to `src/`:

```tsx
import { Button } from '@/components/ui/button';
import { useAppSelector } from '@/hooks/useRedux';
import Overview from '@/pages/Admin/Overview/Overview';
```

---

## License

MIT - Created by [naim0018](https://github.com/naim0018)
