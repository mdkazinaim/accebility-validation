import {
  useForm,
  Controller,
  type Path,
  type DefaultValues,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodSchema } from "zod";
import { useState, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import "react-calendar/dist/Calendar.css";
import TagsInput from "./FormFields/TagsInput";
import { SelectField } from "./FormFields/SelectField";
import { MultiSelectField } from "./FormFields/MultiSelectField";
import { DatePicker, DateTimePicker } from "./FormFields/DatePicker";
import { DateRangePicker } from "./FormFields/DateRangePicker";
import { Toggle } from "./FormFields/Toggle";
import { ColorPicker } from "./FormFields/ColorPicker";
import { CheckboxField, CheckboxGroupField } from "./FormFields/CheckboxField";
import { RadioField } from "./FormFields/RadioField";
import type { FieldConfig } from "./FormFields/FieldTypes";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { FileUpload } from "./FormFields/FileUpload";
import { Tooltip } from "@/common/Tooltip";


// ============================================
// 🎨 Helper Components (Outside to prevent remounting)
// ============================================

const FieldLabel = ({
  label,
  required,
  htmlFor,
  error,
  className,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  error?: boolean;
  className?: string;
}) => (
  <Label
    htmlFor={htmlFor}
    className={cn(
      "block text-sm font-semibold mb-2.5 text-foreground/80 transition-colors group-focus-within:text-primary-text",
      error && "text-red-600 group-focus-within:text-red-600",
      className,
    )}
  >
    {label}
    {required && <span className="text-red-400 ml-1">*</span>}
  </Label>
);

const FieldHelper = ({
  text,
  className,
}: {
  text?: string;
  className?: string;
}) =>
  text ? (
    <p
      className={cn(
        "text-[11px] font-medium text-muted-foreground/70 mt-1.5 ml-1",
        className,
      )}
    >
      {text}
    </p>
  ) : null;

const FieldError = ({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) =>
  message ? (
    <p
      className={cn(
        "text-xs font-semibold text-red-600 mt-1.5 ml-1",
        className,
      )}
    >
      {message}
    </p>
  ) : null;

const FieldContainer = ({
  children,
  className,
  isGroup = true,
}: {
  children: React.ReactNode;
  className?: string;
  isGroup?: boolean;
}) => (
  <div
    className={cn(isGroup && "group transition-all duration-200", className)}
  >
    {children}
  </div>
);

interface CommonFormProps<T> {
  fields: FieldConfig[];
  schema: ZodSchema<T>;
  onSubmit: (data: T) => void | Promise<void>;
  defaultValues?: Partial<T>;
  submitButtonText?: string;
  resetButtonText?: string;
  showResetButton?: boolean;
  loading?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal" | "grid";
  gridCols?: number;
}

const CommonForm = <T extends Record<string, unknown>>({
  fields,
  schema,
  onSubmit,
  defaultValues,
  submitButtonText = "Submit",
  resetButtonText = "Reset",
  showResetButton = false,
  loading = false,
  className = "",
  layout = "vertical",
  gridCols = 2,
}: CommonFormProps<T>) => {
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  const formDefaultValues = useMemo(() => {
    const defaults: Record<string, unknown> = {};
    fields.forEach((field) => {
      if (field.defaultValue !== undefined) {
        defaults[field.name] = field.defaultValue;
      }
    });
    return { ...defaults, ...defaultValues } as DefaultValues<T>;
  }, [fields, defaultValues]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: formDefaultValues,
  });

  const onSubmitForm = async (data: T) => {
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const renderField = (field: FieldConfig) => {
    const error = errors[field.name as Path<T>];
    const errorMessage = error?.message as string | undefined;

    switch (field.type) {
      case "text":
      case "email":
      case "number":
      case "password":
      case "url":
      case "tel":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              htmlFor={field.name}
              error={!!error}
            />
            <div className="relative">
              <Input
                id={field.name}
                type={
                  field.type === "password" && showPassword[field.name]
                    ? "text"
                    : field.type
                }
                placeholder={field.placeholder}
                className={cn(
                  "h-11 bg-light-background border-border focus:bg-primary-background focus:border-primary-brand/50 focus:ring-4 focus:ring-primary-brand/10 transition-all duration-200 rounded-lg text-primary-text placeholder:text-secondary-text",
                  error && "border-red-500 focus:ring-primary-brand/10",
                )}
                {...register(field.name as Path<T>)}
              />
              {field.type === "password" && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Tooltip content={showPassword[field.name] ? "Hide Password" : "Show Password"}>
                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => ({
                          ...prev,
                          [field.name]: !prev[field.name],
                        }))
                      }
                      className="text-muted-foreground hover:text-primary-text transition-colors p-1"
                    >
                      {showPassword[field.name] ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "textarea":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              htmlFor={field.name}
              error={!!error}
            />
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              className={cn(
                "min-h-[120px] bg-light-background border-border focus:bg-primary-background focus:border-primary-brand/50 focus:ring-4 focus:ring-primary-brand/10 transition-all duration-200 rounded-lg resize-none text-primary-text placeholder:text-secondary-text",
                error && "border-red-500 focus:ring-primary-brand/10",
              )}
              {...register(field.name as Path<T>)}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "select":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <SelectField
                  options={"options" in field ? field.options || [] : []}
                  value={value as string}
                  onChange={onChange}
                  placeholder={field.placeholder}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "multiselect":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <MultiSelectField
                  options={"options" in field ? field.options || [] : []}
                  value={(value as string[]) || []}
                  onChange={onChange}
                  placeholder={field.placeholder}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "checkbox":
        return (
          <FieldContainer
            key={field.name}
            className={field.className}
            isGroup={false}
          >
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <CheckboxField
                  label={field.label}
                  value={!!value}
                  onChange={onChange}
                  required={field.required}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "checkbox-group":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <CheckboxGroupField
                  options={"options" in field ? field.options || [] : []}
                  value={(value as (string | number)[]) || []}
                  onChange={onChange}
                  inline={"inline" in field ? field.inline : false}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "radio":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <RadioField
                  options={"options" in field ? field.options || [] : []}
                  value={value as string | number}
                  onChange={onChange}
                  inline={"inline" in field ? field.inline : false}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "switch":
      case "toggle":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <Toggle
                  label={field.label}
                  required={field.required}
                  value={!!value}
                  onChange={onChange}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "date":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <DatePicker
                  value={value as Date | string | null}
                  onChange={onChange}
                  placeholder={field.placeholder}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "date-range":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateRangePicker
                  value={value as [Date | null, Date | null] | null}
                  onChange={onChange}
                  placeholder={field.placeholder}
                  label={field.label}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "date-time":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <DateTimePicker
                  value={value as Date | string | null}
                  onChange={onChange}
                  placeholder={field.placeholder}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "time":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              htmlFor={field.name}
              error={!!error}
            />
            <div
              className="relative group/time cursor-pointer"
              onClick={(e) => {
                const input = e.currentTarget.querySelector("input");
                if (input) input.showPicker();
              }}
            >
              <Input
                id={field.name}
                type="time"
                className={cn(
                  "h-11 bg-light-background border-border focus:bg-primary-background focus:border-primary-brand/50 focus:ring-4 focus:ring-primary-brand/10 transition-all duration-200 rounded-lg cursor-pointer text-primary-text",
                  error && "border-red-500 focus:ring-primary-brand/10",
                )}
                {...register(field.name as Path<T>)}
              />
            </div>
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "color":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <ColorPicker
                  value={value as string}
                  onChange={onChange}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "tags":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <TagsInput
                  value={Array.isArray(value) ? value : []}
                  onChange={onChange}
                  placeholder={field.placeholder}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      case "file":
        return (
          <FieldContainer key={field.name} className={field.className}>
            <FieldLabel
              label={field.label}
              required={field.required}
              error={!!error}
            />
            <Controller
              name={field.name as Path<T>}
              control={control}
              render={({ field: { value, onChange } }) => (
                <FileUpload
                  value={value as File | File[] | null}
                  onChange={onChange}
                  accept={field.accept}
                  multiple={"multiple" in field ? field.multiple : false}
                  error={!!error}
                />
              )}
            />
            <FieldHelper text={field.helpText} />
            <FieldError message={errorMessage} />
          </FieldContainer>
        );

      default:
        return null;
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitForm)}
      className={cn(
        "bg-primary-background p-8 shadow-sm border border-border rounded-lg space-y-8",
        className,
      )}
    >
      <div
        className={cn(
          "grid gap-6",
          layout === "grid"
            ? `grid-cols-1 md:grid-cols-${gridCols}`
            : "grid-cols-1",
        )}
      >
        {fields.map((field) => renderField(field))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-border justify-end">
        {showResetButton && (
          <Button
            type="button"
            variant="outline"
            onClick={() => reset(formDefaultValues as DefaultValues<T>)}
            disabled={loading || isSubmitting}
            className="px-8 h-11 rounded-lg font-semibold border-border hover:bg-light-background transition-all active:scale-[0.98] text-primary-text"
          >
            {resetButtonText}
          </Button>
        )}

        <Button
          type="submit"
          disabled={loading || isSubmitting}
          className="px-10 h-11 rounded-lg font-semibold bg-primary-brand hover:bg-primary-brand/90 text-white shadow-lg shadow-primary-brand/20 transition-all active:scale-[0.98]"
        >
          {loading || isSubmitting ? "Submitting..." : submitButtonText}
        </Button>
      </div>

      <style>{`
        .custom-calendar-wrapper .react-calendar {
          background: var(--primary-background);
          color: var(--primary-text);
          border: 1px solid var(--border-color);
          font-family: inherit;
          width: 100% !important;
          border-radius: 8px;
        }
        .custom-calendar-wrapper .react-calendar__navigation {
          display: flex;
          height: 44px;
          margin-bottom: 8px;
        }
        .custom-calendar-wrapper .react-calendar__navigation button {
          min-width: 44px;
          background: none;
          font-size: 16px;
          margin-top: 4px;
          color: var(--primary-text);
        }
        .custom-calendar-wrapper .react-calendar__navigation button:enabled:hover,
        .custom-calendar-wrapper .react-calendar__navigation button:enabled:focus {
          background-color: var(--light-background);
          border-radius: 8px;
        }
        .custom-calendar-wrapper .react-calendar__month-view__weekdays {
          text-align: center;
          text-transform: uppercase;
          font-weight: 700;
          font-size: 11px;
          color: var(--secondary-text);
          padding-bottom: 8px;
        }
        .custom-calendar-wrapper .react-calendar__month-view__weekdays__weekday abbr {
          text-decoration: none;
        }
        .custom-calendar-wrapper .react-calendar__tile {
          max-width: 100%;
          padding: 12px 6.6667px;
          background: none;
          text-align: center;
          line-height: 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--primary-text);
          border-radius: 8px;
        }
        .custom-calendar-wrapper .react-calendar__tile:enabled:hover,
        .custom-calendar-wrapper .react-calendar__tile:enabled:focus {
          background-color: var(--secondary-brand);
          color: white;
        }
        .custom-calendar-wrapper .react-calendar__tile--now {
          background: var(--light-background);
          color: var(--secondary-brand);
          font-weight: bold;
        }
        .custom-calendar-wrapper .react-calendar__tile--active {
          background: var(--secondary-brand) !important;
          color: white !important;
        }
        .custom-calendar-wrapper .react-calendar__tile--selectRange {
          background: var(--secondary-brand);
          color: white;
          border-radius: 0;
        }
        .custom-calendar-wrapper .react-calendar__tile--rangeStart {
          border-top-left-radius: 8px;
          border-bottom-left-radius: 8px;
        }
        .custom-calendar-wrapper .react-calendar__tile--rangeEnd {
          border-top-right-radius: 8px;
          border-bottom-right-radius: 8px;
        }
      `}</style>
    </form>
  );
};

export default CommonForm;
