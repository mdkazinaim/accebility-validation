# State Management Skill

Instructions for managing global state using Redux Toolkit, RTK Query, and Redux Persist.

---

## State Strategy

| Type | Solution | Location | Use Case |
|------|----------|----------|----------|
| Global State | Redux Toolkit slices | `src/store/features/` | UI state, app-wide settings |
| Server State | RTK Query | `src/store/Api/` | API data, caching |
| Persistence | Redux Persist | Auth tokens, preferences | Data that survives refresh |
| Local State | React `useState`/`useMemo` | Component-specific | Form inputs, toggles |

### When to Use What

```
Does the state need to persist across page refresh?
├── YES → Redux Persist (auth tokens, user preferences)
│
└── NO → Is it server data?
    ├── YES → RTK Query (handles caching, invalidation)
    │
    └── NO → Is it needed by multiple components?
        ├── YES → Redux slice
        │
        └── NO → Local state (useState, useMemo)
```

---

## Store Location

| Resource | Path |
|----------|------|
| Store Config | `src/store/store.ts` |
| Redux Slices | `src/store/features/` |
| RTK Query APIs | `src/store/Api/` |
| Typed Hooks | `src/hooks/useRedux.ts` |

---

## API Service Pattern

Every API service MUST follow these rules:

### 1. Colocation Rule

Every API file MUST have a sibling types file:

```
src/store/Api/
├── product.api.ts           # API endpoints
├── product.apiTypes.ts      # Types (MUST exist)
```

### 2. Explicit Type Naming

Types must be explicitly named with clear purposes:

```tsx
// product.apiTypes.ts
export interface Product {
  id: string;
  name: string;
  price: number;
}

export interface GetProductsResponse extends Array<Product> {}

export interface CreateProductPayload {
  name: string;
  price: number;
  stock: number;
}

export interface UpdateProductPayload {
  id: string;
  name?: string;
  price?: number;
}
```

### 3. Complete API Service Example

```tsx
// src/store/Api/product.api.ts
import baseApi from './BaseApi/BaseApi';
import type {
  Product,
  GetProductsResponse,
  CreateProductPayload,
  UpdateProductPayload,
} from './product.apiTypes';

export const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // GET all - provides LIST tag
    getProducts: builder.query<GetProductsResponse, void>({
      query: () => '/products',
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: 'Product' as const, id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    // GET single - provides specific tag
    getProduct: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_, __, id) => [{ type: 'Product', id }],
    }),

    // CREATE - invalidates LIST
    createProduct: builder.mutation<Product, CreateProductPayload>({
      query: (body) => ({
        url: '/products',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),

    // UPDATE - invalidates specific + LIST
    updateProduct: builder.mutation<Product, UpdateProductPayload>({
      query: ({ id, ...body }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (_, __, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),

    // DELETE - invalidates specific + LIST
    deleteProduct: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_, __, id) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = productApi;
```

---

## Cache Tag Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│  Operation        │ Provides Tags         │ Invalidates Tags    │
├─────────────────────────────────────────────────────────────────┤
│  GET all          │ [Item/1, Item/2, LIST]│ -                   │
│  GET single       │ [Item/id]             │ -                   │
│  CREATE           │ -                     │ [LIST]              │
│  UPDATE           │ -                     │ [Item/id, LIST]     │
│  DELETE           │ -                     │ [Item/id, LIST]     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Redux Slice Pattern

Create slices for UI state and client-side data:

```tsx
// src/store/features/uiSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}

const initialState: UIState = {
  sidebarOpen: true,
  theme: 'light',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
```

---

## Using State in Components

Always use typed hooks:

```tsx
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { toggleSidebar } from '@/store/features/uiSlice';
import { useGetProductsQuery } from '@/store/Api/product.api';

const MyComponent = () => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const { data: products, isLoading } = useGetProductsQuery();

  return (
    <div>
      <button onClick={() => dispatch(toggleSidebar())}>
        Toggle Sidebar
      </button>
      {/* ... */}
    </div>
  );
};
```

---

## Checklist for New API Services

- [ ] Create `src/store/Api/[feature].api.ts`
- [ ] Create `src/store/Api/[feature].apiTypes.ts`
- [ ] Add tag type to `src/store/Api/BaseApi/BaseApi.ts`
- [ ] Export hooks from API file
- [ ] Use LIST pattern for cache tags
- [ ] Import types from apiTypes file in components
