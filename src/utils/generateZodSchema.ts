import { z, ZodTypeAny } from "zod";
import { FieldConfig } from "@/common/DynamicForm/FormFields/FieldTypes";

// ============================================
// 🎯 Enhanced Zod Schema Generator
// ============================================

export const generateZodSchema = (fields: FieldConfig[]) => {
  const shape: Record<string, ZodTypeAny> = {};

  fields.forEach((field) => {
    let validator: ZodTypeAny;

    switch (field.type) {
      // ============================================
      // Text-based fields
      // ============================================
      case "email":
        validator = z.string().email("Invalid email address");
        break;

      case "url":
        validator = z.string().url("Invalid URL");
        break;

      case "tel":
        validator = z
          .string()
          .regex(/^[\d\s\-\+\(\)]+$/, "Invalid phone number");
        break;

      case "text":
      case "password":
      case "textarea":
        validator = z.string();
        break;

      // ============================================
      // Number fields
      // ============================================
      case "number":
      case "range":
        validator = z.coerce.number();

        if ("min" in field && field.min !== undefined) {
          validator = (validator as z.ZodNumber).min(
            field.min,
            `Minimum value is ${field.min}`
          );
        }

        if ("max" in field && field.max !== undefined) {
          validator = (validator as z.ZodNumber).max(
            field.max,
            `Maximum value is ${field.max}`
          );
        }

        if ("step" in field && field.step !== undefined) {
          validator = (validator as z.ZodNumber).multipleOf(
            field.step,
            `Must be a multiple of ${field.step}`
          );
        }
        break;

      // ============================================
      // Select fields
      // ============================================
      case "select":
        validator = z.string();

        if ("options" in field && field.options && field.options.length > 0) {
          const validValues = field.options.map((opt) =>
            typeof opt === "string" ? opt : opt.value.toString()
          );
          validator = z.enum(validValues as [string, ...string[]]);
        }
        break;

      case "multiselect":
      case "checkbox-group":
      case "tags":
        validator = z.array(z.string());

        if ("minSelection" in field && field.minSelection !== undefined) {
          validator = (validator as z.ZodArray<z.ZodString>).min(
            field.minSelection,
            `Select at least ${field.minSelection} option(s)`
          );
        }

        if ("maxSelection" in field && field.maxSelection !== undefined) {
          validator = (validator as z.ZodArray<z.ZodString>).max(
            field.maxSelection,
            `Select at most ${field.maxSelection} option(s)`
          );
        }

        if ("maxTags" in field && field.maxTags !== undefined) {
          validator = (validator as z.ZodArray<z.ZodString>).max(
            field.maxTags,
            `Maximum ${field.maxTags} tags allowed`
          );
        }
        break;

      // ============================================
      // Boolean fields
      // ============================================
      case "checkbox":
      case "switch":
      case "toggle":
        validator = z.boolean();
        break;

      // ============================================
      // Radio fields
      // ============================================
      case "radio":
        if ("options" in field && field.options && field.options.length > 0) {
          const validValues = field.options.map((opt) =>
            typeof opt === "string" ? opt : opt.value.toString()
          );
          validator = z.enum(validValues as [string, ...string[]]);
        } else {
          validator = z.string();
        }
        break;

      // ============================================
      // Date/Time fields
      // ============================================
      case "date":
      case "datetime-local":
      case "time":
        validator = z.any(); // Allow Date or String
        break;

      case "date-range":
        validator = z.array(z.any()).length(2);
        break;

      case "date-time":
        validator = z.any();
        break;

      // ============================================
      // File upload fields
      // ============================================
      case "file":
        // Use z.any() and refine to handle FileList, File, or Array<File>
        validator = z.any().refine((val) => {
          if (!val) return !field.required;
          if (val instanceof File) return true;
          if (val instanceof FileList) return val.length > 0;
          if (Array.isArray(val)) return val.every(v => v instanceof File);
          return false;
        }, "Invalid file input");

        if ("maxSize" in field && field.maxSize !== undefined) {
          const maxSize = field.maxSize;
          const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
          validator = (validator as z.ZodEffects<any>).refine((val) => {
            if (!val) return true;
            const files = val instanceof FileList ? Array.from(val) : (Array.isArray(val) ? val : [val]);
            return files.every((f) => f instanceof File && f.size <= maxSize);
          }, `Each file must be less than ${maxSizeMB}MB`);
        }

        if ("accept" in field && field.accept) {
          const acceptedTypes = field.accept.split(",").map((t) => t.trim().toLowerCase());
          validator = (validator as z.ZodEffects<any>).refine((val) => {
            if (!val) return true;
            const files = val instanceof FileList ? Array.from(val) : (Array.isArray(val) ? val : [val]);
            return files.every((file) => {
              if (!(file instanceof File)) return false;
              return acceptedTypes.some((type) => {
                if (type.startsWith(".")) return file.name.toLowerCase().endsWith(type);
                if (type.includes("/*")) return file.type.startsWith(type.split("/")[0]);
                return file.type === type;
              });
            });
          }, `Invalid file type. Accepted: ${field.accept}`);
        }
        break;

      // ============================================
      // Color picker
      // ============================================
      case "color":
        validator = z
          .string()
          .regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format");
        break;

      // ============================================
      // Rich text
      // ============================================
      case "rich-text":
        validator = z.string();
        break;

      // ============================================
      // Default
      // ============================================
      default:
        validator = z.string();
    }

    // ============================================
    // Apply common validations
    // ============================================

    // Required field validation
    if (field.required !== false) {
      if (validator instanceof z.ZodString) {
        validator = validator.min(1, `${field.label} is required`);
      } else if (validator instanceof z.ZodArray) {
        validator = validator.min(1, `${field.label} is required`);
      } else {
        // For z.any() or other types
        validator = validator.refine(
          (val) => val !== null && val !== undefined && val !== "" && (Array.isArray(val) ? val.length > 0 : true),
          `${field.label} is required`
        );
      }
    } else {
      // Make field optional
      validator = validator.optional();
    }

    // Length validations for string fields
    if (
      validator instanceof z.ZodString ||
      (validator instanceof z.ZodOptional &&
        validator._def.innerType instanceof z.ZodString)
    ) {
      const stringValidator =
        validator instanceof z.ZodOptional
          ? (validator._def.innerType as z.ZodString)
          : validator;

      if ("minLength" in field && field.minLength !== undefined) {
        validator = stringValidator.min(
          field.minLength,
          `Minimum ${field.minLength} characters required`
        );
        if (field.required === false) {
          validator = validator.optional();
        }
      }

      if ("maxLength" in field && field.maxLength !== undefined) {
        validator = stringValidator.max(
          field.maxLength,
          `Maximum ${field.maxLength} characters allowed`
        );
        if (field.required === false) {
          validator = validator.optional();
        }
      }

      // Pattern validation
      if ("pattern" in field && field.pattern) {
        validator = stringValidator.regex(
          new RegExp(field.pattern),
          `Invalid format for ${field.label}`
        );
        if (field.required === false) {
          validator = validator.optional();
        }
      }
    }

    // Custom validation rules
    if (field.validation && field.validation.length > 0) {
      field.validation.forEach((rule) => {
        validator = validator.refine((val) => {
          // Custom validation logic based on rule.rule
          return customValidators[rule.rule]?.(val, rule.value) ?? true;
        }, rule.message);
      });
    }

    shape[field.name] = validator;
  });

  return z.object(shape);
};

// ============================================
// 🔧 Custom Validators
// ============================================

const customValidators: Record<
  string,
  (value: unknown, ruleValue?: unknown) => boolean
> = {
  hasUppercase: (value) => {
    if (typeof value !== "string") return false;
    return /[A-Z]/.test(value);
  },
  hasLowercase: (value) => {
    if (typeof value !== "string") return false;
    return /[a-z]/.test(value);
  },
  hasNumber: (value) => {
    if (typeof value !== "string") return false;
    return /\d/.test(value);
  },
  hasSpecialChar: (value) => {
    if (typeof value !== "string") return false;
    return /[!@#$%^&*(),.?":{}|<>]/.test(value);
  },
  minWords: (value, min) => {
    if (typeof value !== "string" || typeof min !== "number") return false;
    return value.trim().split(/\s+/).length >= min;
  },
  maxWords: (value, max) => {
    if (typeof value !== "string" || typeof max !== "number") return false;
    return value.trim().split(/\s+/).length <= max;
  },
  isAlphanumeric: (value) => {
    if (typeof value !== "string") return false;
    return /^[a-zA-Z0-9]+$/.test(value);
  },
  noSpaces: (value) => {
    if (typeof value !== "string") return false;
    return !/\s/.test(value);
  },
};

// Export custom validators for external use
export { customValidators };
