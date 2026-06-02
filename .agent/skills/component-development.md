# Component Development Skill

Instructions for creating and maintaining UI components with React, Radix UI, Tailwind CSS v4, and Framer Motion.

---

## Core Technologies

| Technology | Purpose |
|------------|---------|
| React 19 | Functional components with hooks |
| Tailwind CSS v4 | Utility-first styling |
| Radix UI | Accessible UI primitives |
| Framer Motion | Animations and transitions |
| Lucide React | Icons |
| class-variance-authority | Component variants |
| clsx + tailwind-merge | Class merging (`cn` utility) |

---

## Component Categories

| Category | Location | Purpose | Examples |
|----------|----------|---------|----------|
| UI Primitives | `src/components/ui/` | Reusable across app | Button, Input, Avatar |
| Common | `src/common/` | Complex shared logic | DynamicTable, DynamicForm |
| Feature | `src/pages/*/Components/` | Page-specific | EmployeeTable, StatsCard |

---

## Separation of Concerns

### UI vs Logic Separation

| Type | Characteristics | Location |
|------|-----------------|----------|
| UI Components | Pure, reusable, no API calls, receive props | `src/components/ui/` |
| Common Components | Complex shared logic, data rendering | `src/common/` |
| Feature Components | Single module specific, may have local state | `src/pages/*/Components/` |
| Container Components | Data fetching, state management, event handlers | `src/pages/*/[Page].tsx` |

### Container-Component Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│  Container (Page)                                               │
│  ─────────────────                                              │
│  • Fetches data (RTK Query)                                     │
│  • Manages state                                                │
│  • Handles events                                               │
│  • Passes data to children                                      │
│                                                                 │
│  ┌─────────────────────┐  ┌─────────────────────┐              │
│  │  Feature Component  │  │  Feature Component  │              │
│  │  ─────────────────  │  │  ─────────────────  │              │
│  │  • Receives props   │  │  • Receives props   │              │
│  │  • UI only          │  │  • UI only          │              │
│  │  • No API calls     │  │  • No API calls     │              │
│  └─────────────────────┘  └─────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree

```
Is this component used in multiple pages?
│
├── YES
│   │
│   ├── Is it a simple UI element? (button, input, badge)
│   │   └── YES → src/components/ui/
│   │
│   └── Does it have complex logic? (table with sorting, form with validation)
│       └── YES → src/common/
│
└── NO → src/pages/[Feature]/Components/
```

---

## UI Primitive Pattern

Simple, reusable components in `src/components/ui/`:

```tsx
// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary/90",
        outline: "border border-gray-200 bg-white hover:bg-gray-50",
        ghost: "hover:bg-gray-100",
        destructive: "bg-red-500 text-white hover:bg-red-600",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-10 px-4",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

---

## Feature Component Pattern

Page-specific components in `src/pages/[Feature]/Components/`:

```tsx
// src/pages/Admin/Employees/Components/EmployeeTable.tsx
import { useState } from 'react';
import { Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const EmployeeTable = ({ employees, onEdit, onDelete }: EmployeeTableProps) => {
  return (
    <div className="border border-gray-200 rounded-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
            <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
            <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {employees.map((employee) => (
            <tr key={employee.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">{employee.name}</td>
              <td className="px-4 py-3">{employee.email}</td>
              <td className="px-4 py-3">{employee.role}</td>
              <td className="px-4 py-3 text-right">
                <Button variant="ghost" size="sm" onClick={() => onEdit(employee.id)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDelete(employee.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
```

---

## Common Component Pattern

Complex shared components in `src/common/`:

```tsx
// src/common/StatsCard/StatsCard.tsx
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const StatsCard = ({ title, value, icon: Icon, trend, className }: StatsCardProps) => {
  return (
    <div className={cn(
      "border border-gray-200 rounded-md p-6 bg-[#F8FAFC]",
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        <Icon className="h-5 w-5 text-gray-400" />
      </div>
      <div className="mt-2">
        <p className="text-2xl font-bold">{value}</p>
        {trend && (
          <p className={cn(
            "text-sm mt-1",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            {trend.isPositive ? '+' : ''}{trend.value}%
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
```

---

## Styling Guidelines

### Design Tokens

| Element | Value | Tailwind Class |
|---------|-------|----------------|
| Background | `#F8FAFC` | `bg-[#F8FAFC]` |
| Border Color | `gray-200` | `border-gray-200` |
| Border Radius (small) | `6px` | `rounded-md` |
| Border Radius (medium) | `8px` | `rounded-lg` |
| Text Muted | `gray-500` | `text-gray-500` |
| Text Primary | `gray-900` | `text-gray-900` |

### Class Merging

Always use the `cn` utility for conditional classes:

```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-class another-class",
  condition && "conditional-class",
  className
)}>
```

---

## Animations with Framer Motion

### Basic Animation

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

### Animate Presence (for modals)

```tsx
import { motion, AnimatePresence } from "framer-motion";

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      Modal Content
    </motion.div>
  )}
</AnimatePresence>
```

### Staggered List

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

<motion.ul
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {items.map((item) => (
    <motion.li key={item.id} variants={itemVariants}>
      {item.name}
    </motion.li>
  ))}
</motion.ul>
```

---

## Props Interface Pattern

Always define explicit prop interfaces:

```tsx
// Good
interface MyComponentProps {
  title: string;
  items: Item[];
  onItemClick?: (id: string) => void;
  className?: string;
  children?: React.ReactNode;
}

// Bad - avoid any
interface MyComponentProps {
  data: any;
  onClick: any;
}
```

---

## Component Checklist

- [ ] Props interface defined
- [ ] Uses `cn()` for class merging
- [ ] Accepts `className` prop for customization
- [ ] Follows naming conventions
- [ ] Placed in correct directory
- [ ] Uses existing UI primitives
- [ ] Handles loading/error states (if applicable)
