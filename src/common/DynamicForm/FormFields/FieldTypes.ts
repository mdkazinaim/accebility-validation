import { ReactNode } from "react";

// ============================================
// 📦 Field Type Definitions
// ============================================

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "tel"
  | "url"
  | "textarea"
  | "select"
  | "multiselect"
  | "checkbox"
  | "checkbox-group"
  | "radio"
  | "date"
  | "datetime-local"
  | "date-time"
  | "date-range"
  | "time"
  | "file"
  | "range"
  | "color"
  | "switch"
  | "toggle"
  | "tags"
  | "rich-text";

export type ColumnAlignment = "left" | "center" | "right";

// ============================================
// 📋 Option Types
// ============================================

export interface Option {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

// ============================================
// 🔍 Validation Types
// ============================================

export interface ValidationRule {
  rule: string;
  message: string;
  value?: unknown;
}

export interface ConditionalRule {
  field: string;
  operator?: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan";
  value?: unknown;
}

// ============================================
// 📝 Base Field Configuration
// ============================================

export interface BaseFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  defaultValue?: unknown;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  helpText?: string;
  className?: string;
  showWhen?: ConditionalRule;
  validation?: ValidationRule[];
  grid?: {
    col?: number; // Grid column span (1-12)
    row?: number; // Grid row span
  };
}

// ============================================
// 📄 Text Input Fields
// ============================================

export interface TextFieldConfig extends BaseFieldConfig {
  type: "text" | "email" | "password" | "url" | "tel";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  showPasswordToggle?: boolean; // For password fields
}

// ============================================
// 🔢 Number Fields
// ============================================

export interface NumberFieldConfig extends BaseFieldConfig {
  type: "number" | "range";
  min?: number;
  max?: number;
  step?: number;
  prefix?: ReactNode;
  suffix?: ReactNode;
  showValue?: boolean; // For range slider
}

// ============================================
// 📝 Textarea Fields
// ============================================

export interface TextareaFieldConfig extends BaseFieldConfig {
  type: "textarea";
  rows?: number;
  cols?: number;
  minLength?: number;
  maxLength?: number;
  showCharCount?: boolean;
  autoResize?: boolean;
}

// ============================================
// 📋 Select Fields
// ============================================

export interface SelectFieldConfig extends BaseFieldConfig {
  type: "select" | "multiselect";
  options: Option[] | string[];
  searchable?: boolean;
  clearable?: boolean;
  minSelection?: number; // For multiselect
  maxSelection?: number; // For multiselect
}

// ============================================
// ☑️ Checkbox Fields
// ============================================

export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: "checkbox";
  checkboxLabel?: string; // Label next to checkbox
}

export interface CheckboxGroupFieldConfig extends BaseFieldConfig {
  type: "checkbox-group";
  options: Option[] | string[];
  minSelection?: number;
  maxSelection?: number;
  inline?: boolean; // Display inline or stacked
}

// ============================================
// 🔘 Radio Fields
// ============================================

export interface RadioFieldConfig extends BaseFieldConfig {
  type: "radio";
  options: Option[] | string[];
  inline?: boolean; // Display inline or stacked
}

// ============================================
// 📅 Date/Time Fields
// ============================================

export interface DateFieldConfig extends BaseFieldConfig {
  type: "date" | "datetime-local" | "date-time" | "time";
  min?: string | Date;
  max?: string | Date;
  format?: string; // Display format
}

export interface DateRangeFieldConfig extends BaseFieldConfig {
  type: "date-range";
  min?: string | Date;
  max?: string | Date;
}

// ============================================
// 📁 File Upload Fields
// ============================================

export interface FileFieldConfig extends BaseFieldConfig {
  type: "file";
  accept?: string; // e.g., "image/*", ".pdf,.doc"
  multiple?: boolean;
  maxSize?: number; // In bytes
  maxFiles?: number;
  preview?: boolean; // Show image/file preview
  dragDrop?: boolean; // Enable drag and drop
}

// ============================================
// 🎨 Color Picker Fields
// ============================================

export interface ColorFieldConfig extends BaseFieldConfig {
  type: "color";
  format?: "hex" | "rgb" | "hsl";
}

// ============================================
// 🔄 Switch/Toggle Fields
// ============================================

export interface SwitchFieldConfig extends BaseFieldConfig {
  type: "switch" | "toggle";
  onLabel?: string;
  offLabel?: string;
}

// ============================================
// 🏷️ Tags Fields
// ============================================

export interface TagsFieldConfig extends BaseFieldConfig {
  type: "tags";
  maxTags?: number;
  suggestions?: string[];
  allowCustom?: boolean;
  validateTag?: (tag: string) => boolean;
  tagColor?: string;
}

// ============================================
// 📝 Rich Text Fields
// ============================================

export interface RichTextFieldConfig extends BaseFieldConfig {
  type: "rich-text";
  toolbar?: string[]; // Toolbar options
  minLength?: number;
  maxLength?: number;
}

// ============================================
// 🎯 Union Type for All Fields
// ============================================

export type FieldConfig =
  | TextFieldConfig
  | NumberFieldConfig
  | TextareaFieldConfig
  | SelectFieldConfig
  | CheckboxFieldConfig
  | CheckboxGroupFieldConfig
  | RadioFieldConfig
  | DateFieldConfig
  | DateRangeFieldConfig
  | FileFieldConfig
  | ColorFieldConfig
  | SwitchFieldConfig
  | TagsFieldConfig
  | RichTextFieldConfig;

// ============================================
// 📋 Form Configuration
// ============================================

export interface FormConfig<T = unknown> {
  fields: FieldConfig[];
  onSubmit: (data: T) => void | Promise<void>;
  defaultValues?: Partial<T>;
  submitButtonText?: string;
  resetButtonText?: string;
  showResetButton?: boolean;
  loading?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal" | "grid";
  gridCols?: number; // Number of columns for grid layout
}

// ============================================
// 🎨 Field Group Configuration
// ============================================

export interface FieldGroup {
  title?: string;
  description?: string;
  fields: string[]; // Field names in this group
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  className?: string;
}

// ============================================
// 📊 Multi-Step Form Configuration
// ============================================

export interface FormStep {
  title: string;
  description?: string;
  fields: string[]; // Field names in this step
  validate?: boolean; // Validate before moving to next step
}

export interface MultiStepFormConfig<T = unknown> extends Omit<FormConfig<T>, "fields"> {
  steps: FormStep[];
  fields: FieldConfig[];
  showStepIndicator?: boolean;
  allowStepNavigation?: boolean;
}
