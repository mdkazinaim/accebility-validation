# Form Implementation Skill

Guidelines for building forms using the modular `CommonForm` architecture, which integrates **React Hook Form**, **Zod**, and **Shadcn UI**.

---

## Core Architecture

The project uses a data-driven approach to form building. Instead of manual JSX for every field, you define a configuration and generate the schema.

| Component | Purpose |
| :--- | :--- |
| `CommonForm` | The main form engine that renders fields and handles state. |
| `FieldConfig` | TypeScript interface defining all available field properties. |
| `generateZodSchema` | Utility to create a validation schema from a field configuration. |

---

## Standard Workflow

### 1. Define Field Configuration
Define your fields as an array of `FieldConfig`.

```tsx
const fields: FieldConfig[] = [
  {
    name: "email",
    label: "Email Address",
    type: "email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    required: true,
    minLength: 8,
  },
];
```

### 2. Generate Schema & Render
Use the utility to create the schema and pass everything to `CommonForm`.

```tsx
import { CommonForm } from "@/common/DynamicForm/CommonForm";
import { generateZodSchema } from "@/utils/generateZodSchema";

const LoginForm = () => {
  const schema = generateZodSchema(fields);
  
  const handleLogin = (data: any) => {
    // data is already validated
  };

  return (
    <CommonForm
      fields={fields}
      schema={schema}
      onSubmit={handleLogin}
      submitButtonText="Login"
    />
  );
};
```

---

## Advanced Features

### Grid Layouts
Forms can be rendered in a grid by setting `layout="grid"` and specifying `gridCols`. Fields can span multiple columns using the `grid.col` property.

```tsx
<CommonForm
  layout="grid"
  gridCols={4}
  fields={[
    { name: "full", label: "Full Width", type: "text", grid: { col: 4 } },
    { name: "half1", label: "Half Width", type: "text", grid: { col: 2 } },
    { name: "half2", label: "Half Width", type: "text", grid: { col: 2 } },
  ]}
  // ...
/>
```

### Conditional Logic
Use `showWhen` to dynamically display fields based on other form values.

```tsx
{
  name: "managerName",
  label: "Manager Name",
  type: "text",
  showWhen: {
    field: "role",
    operator: "equals",
    value: "employee"
  }
}
```

### Custom Validation
Beyond basic Zod types, use the `validation` array to apply domain-specific rules.

```tsx
{
  name: "zipCode",
  label: "ZIP Code",
  type: "text",
  validation: [
    { rule: "isAlphanumeric", message: "Only letters and numbers allowed" },
    { rule: "noSpaces", message: "Cannot contain spaces" }
  ]
}
```

---

## Premium Field Types

- **`date-range`**: Returns an array of two dates.
- **`tags`**: Returns an array of strings.
- **`multiselect`**: Returns an array of strings/numbers.
- **`color`**: Returns a HEX string.
- **`toggle`**: Returns a boolean.

---

## Best Practices

1.  **Prefer Abstraction**: Always use `CommonForm` for standard forms. Only build manual forms for highly irregular layouts.
2.  **Schema Reusability**: If the same fields are used in multiple places, export the `fields` array and `schema` from a common file.
3.  **Loading States**: Pass the `loading` prop to `CommonForm` to automatically disable the submit button and show a spinner.
4.  **Help Text**: Always provide `helpText` for complex inputs like `date-range` or `tags` to guide the user.
5.  **Default Values**: Use the `defaultValues` prop for edit forms rather than setting `defaultValue` in every field config.

---

## Form Checklist

- [ ] Fields defined with appropriate `type` and `name`.
- [ ] `required` flag set where necessary.
- [ ] `generateZodSchema` used for validation.
- [ ] Layout optimized (vertical vs grid).
- [ ] `onSubmit` handles API calls and errors.
- [ ] Success/Error feedback implemented (toasts).
- [ ] Accessibility: All fields have labels and helpful placeholders.
