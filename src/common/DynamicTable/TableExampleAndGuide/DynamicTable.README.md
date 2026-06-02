# DynamicTable Component - Advanced Usage Guide

## 📋 Table of Contents

1. [Basic Usage](#basic-usage)
2. [Search & Filters](#search--filters)
3. [Query Parameters for API](#query-parameters-for-api)
4. [Bulk Actions](#bulk-actions)
5. [Complete Example](#complete-example)

---

## Basic Usage

```tsx
import DynamicTable, { Column } from "@/common/DynamicTable";

interface User {
  id: number;
  name: string;
  email: string;
}

const columns: Column<User>[] = [
  { key: "id", label: "ID", accessor: "id" },
  { key: "name", label: "Name", accessor: "name" },
  { key: "email", label: "Email", accessor: "email" },
];

<DynamicTable data={users} columns={columns} />
```

---

## Search & Filters

### 1. **Built-in Search**

The table has a built-in search feature:

```tsx
<DynamicTable
  data={users}
  columns={columns}
  searchable
  searchPlaceholder="Search users..."
/>
```

### 2. **Custom Search Logic**

Override the default search behavior:

```tsx
const customSearch = (query: string, data: User[]) => {
  return data.filter(
    (user) =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
  );
};

<DynamicTable
  data={users}
  columns={columns}
  searchable
  onSearch={customSearch}
/>
```

### 3. **Advanced Filters**

Implement custom filter UI outside the table:

```tsx
const [filters, setFilters] = useState({
  role: "",
  status: "",
  department: "",
  ageMin: "",
  ageMax: "",
});

const [filteredData, setFilteredData] = useState(users);

useEffect(() => {
  let result = users;

  if (filters.role) {
    result = result.filter((user) => user.role === filters.role);
  }
  if (filters.status) {
    result = result.filter((user) => user.status === filters.status);
  }
  if (filters.department) {
    result = result.filter((user) => user.department === filters.department);
  }

  setFilteredData(result);
}, [filters, users]);

return (
  <>
    {/* Filter UI */}
    <div className="filter-panel">
      <select onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
    </div>

    {/* Table */}
    <DynamicTable data={filteredData} columns={columns} />
  </>
);
```

---

## Query Parameters for API

### 1. **Building Query Parameters**

Create a function to build query params from search and filters:

```tsx
interface QueryParams {
  search: string;
  filters: FilterOptions;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const buildQueryParams = (params: QueryParams): string => {
  const searchParams = new URLSearchParams();

  // Add search
  if (params.search) {
    searchParams.append("search", params.search);
  }

  // Add filters
  Object.entries(params.filters).forEach(([key, value]) => {
    if (value) {
      searchParams.append(`filter[${key}]`, String(value));
    }
  });

  // Add pagination
  searchParams.append("page", String(params.page));
  searchParams.append("pageSize", String(params.pageSize));

  // Add sorting
  if (params.sortBy) {
    searchParams.append("sortBy", params.sortBy);
    searchParams.append("sortOrder", params.sortOrder || "asc");
  }

  return searchParams.toString();
};
```

### 2. **Fetching Data from API**

```tsx
const fetchUsers = async () => {
  setLoading(true);

  const queryParams: QueryParams = {
    search: searchQuery,
    filters: filters,
    page: currentPage,
    pageSize: pageSize,
  };

  try {
    const queryString = buildQueryParams(queryParams);
    const response = await fetch(`/api/users?${queryString}`);
    const data = await response.json();

    setUsers(data.users);
    setTotalRecords(data.total);
  } catch (error) {
    console.error("Error fetching users:", error);
  } finally {
    setLoading(false);
  }
};

// Fetch when dependencies change
useEffect(() => {
  fetchUsers();
}, [searchQuery, filters, currentPage, pageSize]);
```

### 3. **Backend API Example (Node.js/Express)**

```javascript
// Backend API endpoint
app.get("/api/users", async (req, res) => {
  const {
    search,
    page = 1,
    pageSize = 10,
    sortBy,
    sortOrder = "asc",
  } = req.query;

  // Extract filters
  const filters = {};
  Object.keys(req.query).forEach((key) => {
    if (key.startsWith("filter[")) {
      const filterKey = key.match(/filter\[(.+)\]/)[1];
      filters[filterKey] = req.query[key];
    }
  });

  // Build database query
  let query = db.users.find();

  // Apply search
  if (search) {
    query = query.where({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ],
    });
  }

  // Apply filters
  if (filters.role) query = query.where({ role: filters.role });
  if (filters.status) query = query.where({ status: filters.status });
  if (filters.department)
    query = query.where({ department: filters.department });

  // Apply sorting
  if (sortBy) {
    query = query.sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 });
  }

  // Get total count
  const total = await query.clone().countDocuments();

  // Apply pagination
  const users = await query
    .skip((page - 1) * pageSize)
    .limit(parseInt(pageSize))
    .exec();

  res.json({
    users,
    total,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    totalPages: Math.ceil(total / pageSize),
  });
});
```

---

## Bulk Actions

### 1. **Selection Tracking**

Enable row selection and track selected items:

```tsx
const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

<DynamicTable
  data={users}
  columns={columns}
  selectable
  onSelectionChange={setSelectedUsers}
  getRowKey={(user) => user.id.toString()}
/>
```

### 2. **Bulk Delete**

```tsx
const handleBulkDelete = async () => {
  if (selectedUsers.length === 0) {
    alert("Please select users to delete");
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to delete ${selectedUsers.length} user(s)?`
  );

  if (!confirmed) return;

  setLoading(true);

  try {
    // Send delete request to API
    await fetch("/api/users/bulk-delete", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ids: selectedUsers.map((u) => u.id),
      }),
    });

    // Remove deleted users from state
    setUsers((prev) =>
      prev.filter((user) => !selectedUsers.some((su) => su.id === user.id))
    );

    setSelectedUsers([]);
    alert("Users deleted successfully");
  } catch (error) {
    console.error("Error deleting users:", error);
    alert("Failed to delete users");
  } finally {
    setLoading(false);
  }
};
```

### 3. **Bulk Export (CSV)**

```tsx
const handleBulkExport = () => {
  if (selectedUsers.length === 0) {
    alert("Please select users to export");
    return;
  }

  // Define CSV headers
  const headers = ["ID", "Name", "Email", "Role", "Status"];

  // Convert data to CSV format
  const csvContent = [
    headers.join(","),
    ...selectedUsers.map((user) =>
      [user.id, user.name, user.email, user.role, user.status].join(",")
    ),
  ].join("\n");

  // Create and download file
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `users_export_${new Date().toISOString()}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
};
```

### 4. **Bulk Export (JSON)**

```tsx
const handleBulkExportJSON = () => {
  if (selectedUsers.length === 0) {
    alert("Please select users to export");
    return;
  }

  const jsonContent = JSON.stringify(selectedUsers, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `users_export_${new Date().toISOString()}.json`;
  link.click();
  window.URL.revokeObjectURL(url);
};
```

### 5. **Bulk Actions UI**

```tsx
{selectedUsers.length > 0 && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
    <div className="flex items-center justify-between">
      <span className="font-medium text-blue-900">
        {selectedUsers.length} user(s) selected
      </span>
      <div className="flex gap-2">
        <button
          onClick={handleBulkExport}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Export Selected
        </button>
        <button
          onClick={handleBulkDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Delete Selected
        </button>
      </div>
    </div>
  </div>
)}
```

---

## Complete Example

See `DynamicTableAdvancedExample.tsx` for a complete working example that includes:

- ✅ Search functionality
- ✅ Multiple filter options (role, status, department, age range)
- ✅ Query parameter building for API calls
- ✅ Bulk delete action
- ✅ Bulk export (CSV)
- ✅ Export all functionality
- ✅ Loading states
- ✅ Empty states
- ✅ Row actions (view, edit, delete)

### Usage:

```tsx
import AdvancedTableExample from "@/common/DynamicTableAdvancedExample";

function App() {
  return <AdvancedTableExample />;
}
```

---

## API Integration Checklist

- [ ] Create filter state management
- [ ] Build query parameters from filters
- [ ] Implement API fetch function
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Implement pagination
- [ ] Add debouncing for search input
- [ ] Implement bulk delete endpoint
- [ ] Implement export functionality
- [ ] Add success/error notifications

---

## Best Practices

1. **Debounce Search Input**: Prevent excessive API calls

   ```tsx
   const [searchQuery, setSearchQuery] = useState("");
   const debouncedSearch = useDebounce(searchQuery, 500);

   useEffect(() => {
     fetchUsers();
   }, [debouncedSearch]);
   ```

2. **Reset Page on Filter Change**: Always reset to page 1 when filters change

   ```tsx
   const handleFilterChange = (key: string, value: string) => {
     setFilters({ ...filters, [key]: value });
     setCurrentPage(1); // Reset to first page
   };
   ```

3. **Loading States**: Show loading indicator during API calls

   ```tsx
   <DynamicTable data={users} columns={columns} loading={loading} />
   ```

4. **Error Handling**: Display user-friendly error messages

   ```tsx
   try {
     await fetchUsers();
   } catch (error) {
     setError("Failed to load users. Please try again.");
   }
   ```

5. **Optimistic Updates**: Update UI immediately, then sync with server

   ```tsx
   // Optimistic delete
   setUsers((prev) => prev.filter((u) => u.id !== userId));

   try {
     await deleteUser(userId);
   } catch (error) {
     // Revert on error
     setUsers(originalUsers);
   }
   ```

---

## TypeScript Types

```tsx
interface FilterOptions {
  role?: string;
  status?: string;
  department?: string;
  ageMin?: number;
  ageMax?: number;
}

interface QueryParams {
  search: string;
  filters: FilterOptions;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## Additional Resources

- See `DynamicTableExamples.tsx` for basic examples
- See `DynamicTableAdvancedExample.tsx` for advanced features
- Check the main `DynamicTable.tsx` component for all available props
