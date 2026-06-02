import DynamicTable, { Column } from "@/common/DynamicTable/DynamicTable";
import { Pencil, Trash2, Eye } from "lucide-react";

// ============================================
// 📦 Example Data Types
// ============================================

interface User extends Record<string, unknown> {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user" | "moderator";
  status: "active" | "inactive";
  createdAt: string;
  age: number;
}

interface Product extends Record<string, unknown> {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  inStock: boolean;
}

// ============================================
// 🎯 Example 1: User Table (Full Features)
// ============================================

const UserTableExample = () => {
  const users: User[] = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      status: "active",
      createdAt: "2024-01-15",
      age: 28,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "user",
      status: "active",
      createdAt: "2024-02-20",
      age: 32,
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "moderator",
      status: "inactive",
      createdAt: "2024-03-10",
      age: 45,
    },
    // Add more users...
  ];

  const columns: Column<User>[] = [
    {
      key: "id",
      label: "ID",
      accessor: "id",
      sortable: true,
      width: "80px",
      align: "center",
    },
    {
      key: "name",
      label: "Name",
      accessor: "name",
      sortable: true,
    },
    {
      key: "email",
      label: "Email",
      accessor: "email",
      sortable: true,
      hideOnMobile: true,
    },
    {
      key: "role",
      label: "Role",
      accessor: "role",
      sortable: true,
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            user.role === "admin"
              ? "bg-purple-100 text-purple-800"
              : user.role === "moderator"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {user.role.toUpperCase()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      accessor: "status",
      sortable: true,
      render: (user) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            user.status === "active"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {user.status}
        </span>
      ),
    },
    {
      key: "age",
      label: "Age",
      accessor: "age",
      sortable: true,
      align: "center",
      width: "100px",
    },
    {
      key: "createdAt",
      label: "Created At",
      accessor: "createdAt",
      sortable: true,
      hideOnMobile: true,
      render: (user) => new Date(user.createdAt).toLocaleDateString(),
    },
  ];

  const handleEdit = (user: User) => {
    console.log("Edit user:", user);
    alert(`Editing user: ${user.name}`);
  };

  const handleDelete = (user: User) => {
    console.log("Delete user:", user);
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      alert(`Deleted user: ${user.name}`);
    }
  };

  const handleView = (user: User) => {
    console.log("View user:", user);
    alert(`Viewing user: ${user.name}`);
  };

  const handleSelectionChange = (selectedUsers: User[]) => {
    console.log("Selected users:", selectedUsers);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <DynamicTable
        data={users}
        columns={columns}
        selectable
        onSelectionChange={handleSelectionChange}
        pagination
        pageSize={5}
        searchable
        searchPlaceholder="Search users by name, email, or role..."
        hoverable
        striped
        actions={[
          {
            label: "View",
            onClick: handleView,
            icon: <Eye className="w-4 h-4" />,
            variant: "secondary",
          },
          {
            label: "Edit",
            onClick: handleEdit,
            icon: <Pencil className="w-4 h-4" />,
            variant: "primary",
          },
          {
            label: "Delete",
            onClick: handleDelete,
            icon: <Trash2 className="w-4 h-4" />,
            variant: "danger",
          },
        ]}
        getRowKey={(user) => user.id.toString()}
      />
    </div>
  );
};

// ============================================
// 🎯 Example 2: Product Table (Simple)
// ============================================

const ProductTableExample = () => {
  const products: Product[] = [
    {
      id: "P001",
      name: "Laptop",
      price: 999.99,
      category: "Electronics",
      stock: 15,
      inStock: true,
    },
    {
      id: "P002",
      name: "Mouse",
      price: 29.99,
      category: "Accessories",
      stock: 0,
      inStock: false,
    },
    {
      id: "P003",
      name: "Keyboard",
      price: 79.99,
      category: "Accessories",
      stock: 25,
      inStock: true,
    },
  ];

  const columns: Column<Product>[] = [
    {
      key: "id",
      label: "Product ID",
      accessor: "id",
      sortable: true,
    },
    {
      key: "name",
      label: "Product Name",
      accessor: "name",
      sortable: true,
    },
    {
      key: "price",
      label: "Price",
      accessor: "price",
      sortable: true,
      align: "right",
      render: (product) => `$${product.price.toFixed(2)}`,
    },
    {
      key: "category",
      label: "Category",
      accessor: "category",
      sortable: true,
    },
    {
      key: "stock",
      label: "Stock",
      accessor: "stock",
      sortable: true,
      align: "center",
      render: (product) => (
        <span
          className={`font-semibold ${
            product.stock === 0
              ? "text-red-600"
              : product.stock < 10
              ? "text-yellow-600"
              : "text-green-600"
          }`}
        >
          {product.stock}
        </span>
      ),
    },
    {
      key: "availability",
      label: "Availability",
      render: (product) => (
        <span
          className={`px-2 py-1 text-xs font-semibold rounded-full ${
            product.inStock
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {product.inStock ? "In Stock" : "Out of Stock"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Product Inventory</h2>
      <DynamicTable
        data={products}
        columns={columns}
        selectable
        pagination
        pageSize={10}
        searchable
        hoverable
      />
    </div>
  );
};

// ============================================
// 🎯 Example 3: Loading & Empty States
// ============================================

const LoadingEmptyExample = () => {
  const emptyData: User[] = [];

  const columns: Column<User>[] = [
    { key: "id", label: "ID", accessor: "id" },
    { key: "name", label: "Name", accessor: "name" },
    { key: "email", label: "Email", accessor: "email" },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Loading State</h2>
        <DynamicTable data={emptyData} columns={columns} loading />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Empty State</h2>
        <DynamicTable
          data={emptyData}
          columns={columns}
          emptyMessage="No users found. Try adjusting your search criteria."
        />
      </div>
    </div>
  );
};

// ============================================
// 🎯 Example 4: Custom Search Function
// ============================================

const CustomSearchExample = () => {
  const users: User[] = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      status: "active",
      createdAt: "2024-01-15",
      age: 28,
    },
    // ... more users
  ];

  const columns: Column<User>[] = [
    { key: "name", label: "Name", accessor: "name", sortable: true },
    { key: "email", label: "Email", accessor: "email", sortable: true },
    { key: "role", label: "Role", accessor: "role", sortable: true },
  ];

  // Custom search: only search in name and email fields
  const customSearch = (query: string, data: User[]) => {
    const lowerQuery = query.toLowerCase();
    return data.filter(
      (user) =>
        user.name.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
    );
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Custom Search Example</h2>
      <DynamicTable
        data={users}
        columns={columns}
        searchable
        onSearch={customSearch}
        searchPlaceholder="Search by name or email only..."
      />
    </div>
  );
};

// ============================================
// 🎯 Example 5: Custom Row Styling
// ============================================

const CustomRowStylingExample = () => {
  const users: User[] = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
      status: "active",
      createdAt: "2024-01-15",
      age: 28,
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "user",
      status: "inactive",
      createdAt: "2024-02-20",
      age: 32,
    },
  ];

  const columns: Column<User>[] = [
    { key: "name", label: "Name", accessor: "name" },
    { key: "email", label: "Email", accessor: "email" },
    { key: "status", label: "Status", accessor: "status" },
  ];

  // Highlight inactive users with red background
  const getRowClass = (user: User) => {
    return user.status === "inactive" ? "bg-red-50" : "";
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Custom Row Styling</h2>
      <DynamicTable
        data={users}
        columns={columns}
        rowClassName={getRowClass}
        hoverable
      />
    </div>
  );
};

// ============================================
// 🎯 Main Demo Component
// ============================================

const DynamicTableDemo = () => {
  return (
    <div className="space-y-12">
      <UserTableExample />
      <hr className="my-8" />
      <ProductTableExample />
      <hr className="my-8" />
      <LoadingEmptyExample />
      <hr className="my-8" />
      <CustomSearchExample />
      <hr className="my-8" />
      <CustomRowStylingExample />
    </div>
  );
};

export default DynamicTableDemo;
