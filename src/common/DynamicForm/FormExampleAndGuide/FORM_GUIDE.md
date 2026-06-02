# Enhanced CommonForm Guide

## Overview

The `CommonForm` component is a premium, data-driven form solution built with **React Hook Form**, **Zod**, and **Shadcn UI**. It is designed to handle complex form scenarios with minimal boilerplate while maintaining a high-end aesthetic.

## Key Features

- **25+ Field Types**: Support for everything from standard text to advanced `date-range`, `color-picker`, and `tags`.
- **Automatic Validation**: Schema-driven validation using `generateZodSchema` utility.
- **Smart Layouts**: Responsive vertical, horizontal, and grid-based layouts with column span control.
- **Conditional Rendering**: Show or hide fields dynamically based on other field values.
- **Premium Components**: Custom-styled popovers, calendars, and selection inputs with smooth animations.
- **Type Safety**: Strictly typed configurations ensuring your form data matches your schema.

## Supported Field Types

| Category | Types |
| :--- | :--- |
| **Standard** | `text`, `email`, `password`, `number`, `tel`, `url`, `textarea` |
| **Selection** | `select`, `multiselect`, `checkbox`, `checkbox-group`, `radio`, `toggle` (or `switch`) |
| **Date & Time** | `date`, `date-time`, `date-range`, `time` |
| **Advanced** | `file`, `color`, `tags`, `rich-text`, `range` |

---

## Basic Usage

```tsx
import { CommonForm } from "@/common/DynamicForm/CommonForm";
import { generateZodSchema } from "@/utils/generateZodSchema";
import { FieldConfig } from "@/common/DynamicForm/FormFields/FieldTypes";

const MyForm = () => {
  const fields: FieldConfig[] = [
    { name: "name", label: "Full Name", type: "text", required: true },
    { name: "email", label: "Email", type: "email", required: true },
  ];

  const schema = generateZodSchema(fields);

  const handleSubmit = (data: any) => console.log(data);

  return (
    <CommonForm
      fields={fields}
      schema={schema}
      onSubmit={handleSubmit}
      submitButtonText="Create Account"
    />
  );
};
```

---

## Advanced Field Configurations

### 📅 Date Range Picker
Captures a start and end date in a single field.
```typescript
{
  name: "duration",
  label: "Vacation Period",
  type: "date-range",
  required: true,
  helpText: "Select the start and end dates"
}
```

### 🏷️ Tags Input
Interactive tagging system with suggestions.
```typescript
{
  name: "skills",
  label: "Expertise",
  type: "tags",
  maxTags: 5,
  suggestions: ["React", "TypeScript", "Tailwind"],
}
```

### 🎨 Color Picker
Custom HEX color picker with visual preview.
```typescript
{
  name: "brandColor",
  label: "Brand Identity",
  type: "color",
  defaultValue: "#3b82f6"
}
```

### 🔗 Conditional Logic
Fields can react to values of other fields using the `showWhen` property.
```typescript
{
  name: "otherReason",
  label: "Please specify",
  type: "textarea",
  showWhen: {
    field: "reason",
    operator: "equals",
    value: "other"
  }
}
```

---

## Validation & Schemas

The `generateZodSchema` utility automatically builds a Zod schema from your `fields` array.

### Custom Validation Rules
You can add specific constraints beyond just `required`:
```typescript
{
  name: "username",
  type: "text",
  validation: [
    { rule: "noSpaces", message: "Spaces are not allowed" },
    { rule: "hasNumber", message: "Must include a digit" }
  ]
}
```

**Supported Rules:**
- `hasUppercase`, `hasLowercase`, `hasNumber`, `hasSpecialChar`
- `minWords`, `maxWords`
- `isAlphanumeric`, `noSpaces`

---

## Layout Controls

### Grid Layout
Use `gridCols` at the form level and `grid` span at the field level for complex designs.

```tsx
<CommonForm
  layout="grid"
  gridCols={2}
  fields={[
    { name: "firstName", label: "First Name", type: "text" },
    { name: "lastName", label: "Last Name", type: "text" },
    { 
      name: "bio", 
      label: "Biography", 
      type: "textarea", 
      grid: { col: 2 } // Spans both columns
    }
  ]}
  // ...
/>
```

---

## Styling & UX

- **Popover Alignment**: All selection and date pickers use `var(--radix-popover-trigger-width)` to ensure they match the input width perfectly.
- **Visual Feedback**: Errors are highlighted with red borders and descriptive messages below the field.
- **Interaction**: Password fields include a visibility toggle, and file uploads support real-time previews.

