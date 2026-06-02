import { useState, useMemo } from "react";
import CommonForm from "@/common/DynamicForm/CommonForm";
import { generateZodSchema } from "@/utils/generateZodSchema";
import type { FieldConfig } from "@/common/DynamicForm/FormFields/FieldTypes";

// ============================================
// 🎯 Example 1: User Registration Form
// ============================================

// ============================================
// 🎯 Example 1: User Registration Form
// ============================================

const UserRegistrationExample = () => {
  const [formData, setFormData] = useState<unknown>(null);

  // ... fields ...
  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "username",
        label: "Username",
        type: "text",
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: "^[a-zA-Z0-9_]+$",
        helpText: "Only letters, numbers, and underscores",
        defaultValue: "john_doe",
      },
      {
        name: "email",
        label: "Email Address",
        type: "email",
        required: true,
        placeholder: "you@example.com",
        defaultValue: "john@example.com",
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        required: true,
        minLength: 8,
        helpText: "At least 8 characters",
        validation: [
          { rule: "hasUppercase", message: "Must contain uppercase letter" },
          { rule: "hasNumber", message: "Must contain a number" },
        ],
      },
      {
        name: "confirmPassword",
        label: "Confirm Password",
        type: "password",
        required: true,
      },
      {
        name: "phone",
        label: "Phone Number",
        type: "tel",
        placeholder: "+1 (555) 123-4567",
      },
      {
        name: "website",
        label: "Website",
        type: "url",
        placeholder: "https://example.com",
      },
      {
        name: "age",
        label: "Age",
        type: "number",
        min: 18,
        max: 120,
        required: true,
        defaultValue: 25,
      },
      {
        name: "bio",
        label: "Biography",
        type: "textarea",
        rows: 4,
        maxLength: 500,
        showCharCount: true,
        placeholder: "Tell us about yourself...",
        defaultValue:
          "I'm a software developer passionate about React and TypeScript.",
      },
      {
        name: "agreeToTerms",
        label: "I agree to the Terms and Conditions",
        type: "checkbox",
        required: true,
      },
    ],
    [],
  );

  const schema = useMemo(() => generateZodSchema(fields), [fields]);

  const handleSubmit = (data: unknown) => {
    console.log("User Registration Data:", data);
    setFormData(data);
    alert("Form submitted successfully!");
  };

  return (
    <div className=" mx-auto p-8 bg-primary-background rounded-lg shadow-sm border border-border">
      <h2 className="text-2xl font-bold mb-6 text-primary-text">
        User Registration
      </h2>
      <CommonForm
        fields={fields}
        schema={schema}
        onSubmit={handleSubmit}
        submitButtonText="Register"
        showResetButton
        layout="vertical"
      />
      {!!formData && (
        <div className="mt-8 p-6 bg-light-background rounded-lg border border-border">
          <h3 className="font-semibold mb-3 text-primary-text">Submitted Data:</h3>
          <pre className="text-sm overflow-auto text-secondary-text">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// ============================================
// 🎯 Example 2: Job Application Form
// ============================================

const JobApplicationExample = () => {
  const [formData, setFormData] = useState<unknown>(null);

  // ... fields ...
  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "fullName",
        label: "Full Name",
        type: "text",
        required: true,
        defaultValue: "John Doe",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        required: true,
        defaultValue: "john.doe@example.com",
      },
      {
        name: "position",
        label: "Position",
        type: "select",
        required: true,
        options: [
          { value: "frontend", label: "Frontend Developer" },
          { value: "backend", label: "Backend Developer" },
          { value: "fullstack", label: "Full Stack Developer" },
          { value: "devops", label: "DevOps Engineer" },
        ],
        defaultValue: "fullstack",
      },
      {
        name: "experience",
        label: "Years of Experience",
        type: "range",
        min: 0,
        max: 20,
        step: 1,
        showValue: true,
        defaultValue: 5,
      },
      {
        name: "skills",
        label: "Skills",
        type: "tags",
        placeholder: "Add your skills...",
        maxTags: 10,
        suggestions: [
          "JavaScript",
          "TypeScript",
          "React",
          "Vue",
          "Angular",
          "Node.js",
          "Python",
          "Java",
          "Docker",
          "Kubernetes",
        ],
        defaultValue: ["JavaScript", "TypeScript", "React"],
      },
      {
        name: "availability",
        label: "Availability",
        type: "radio",
        required: true,
        options: ["Immediate", "2 Weeks", "1 Month", "Negotiable"],
        inline: true,
        defaultValue: "2 Weeks",
      },
      {
        name: "workType",
        label: "Preferred Work Type",
        type: "checkbox-group",
        options: ["Remote", "Hybrid", "On-site"],
        inline: true,
        defaultValue: ["Remote", "Hybrid"],
      },
      {
        name: "resume",
        label: "Resume",
        type: "file",
        accept: ".pdf,.doc,.docx",
        maxSize: 5 * 1024 * 1024, // 5MB
        required: true,
      },
      {
        name: "coverLetter",
        label: "Cover Letter",
        type: "textarea",
        rows: 6,
        maxLength: 1000,
        showCharCount: true,
        placeholder: "Why do you want to work with us?",
      },
      {
        name: "startDate",
        label: "Preferred Start Date",
        type: "date",
        min: new Date().toISOString().split("T")[0],
        defaultValue: "2024-02-01",
      },
      {
        name: "newsletter",
        label: "Subscribe to newsletter",
        type: "switch",
        defaultValue: true,
      },
    ],
    [],
  );

  const schema = useMemo(() => generateZodSchema(fields), [fields]);

  const handleSubmit = (data: unknown) => {
    console.log("Job Application Data:", data);
    setFormData(data);
    alert("Application submitted successfully!");
  };

  return (
    <div className=" mx-auto p-8 bg-primary-background rounded-lg shadow-sm border border-border">
      <h2 className="text-2xl font-bold mb-6 text-primary-text">
        Job Application
      </h2>
      <CommonForm
        fields={fields}
        schema={schema}
        onSubmit={handleSubmit}
        submitButtonText="Submit Application"
        showResetButton
        layout="grid"
        gridCols={3} // Increased columns to show density
      />
      {!!formData && (
        <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-border">
          <h3 className="font-semibold mb-3 text-primary-text">Submitted Data:</h3>
          <pre className="text-sm overflow-auto max-h-96 text-secondary-text">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// ============================================
// 🎯 Example 3: Conditional Fields Form
// ============================================

const ConditionalFieldsExample = () => {
  const [formData, setFormData] = useState<unknown>(null);

  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "hasExperience",
        label: "Do you have previous experience?",
        type: "radio",
        required: true,
        options: ["Yes", "No"],
        inline: true,
      },
      {
        name: "yearsOfExperience",
        label: "Years of Experience",
        type: "number",
        min: 0,
        max: 50,
        showWhen: {
          field: "hasExperience",
          operator: "equals",
          value: "Yes",
        },
      },
      {
        name: "previousCompany",
        label: "Previous Company",
        type: "text",
        showWhen: {
          field: "hasExperience",
          operator: "equals",
          value: "Yes",
        },
      },
      {
        name: "experienceDetails",
        label: "Describe your experience",
        type: "textarea",
        rows: 4,
        showWhen: {
          field: "hasExperience",
          operator: "equals",
          value: "Yes",
        },
      },
      {
        name: "needsTraining",
        label: "Would you like training?",
        type: "checkbox",
        showWhen: {
          field: "hasExperience",
          operator: "equals",
          value: "No",
        },
      },
      {
        name: "trainingAreas",
        label: "Training Areas",
        type: "multiselect",
        options: [
          "Frontend Development",
          "Backend Development",
          "Database Management",
          "DevOps",
          "Testing",
        ],
        showWhen: {
          field: "needsTraining",
          operator: "equals",
          value: true,
        },
      },
    ],
    [],
  );

  const schema = useMemo(() => generateZodSchema(fields), [fields]);

  const handleSubmit = (data: unknown) => {
    console.log("Conditional Form Data:", data);
    setFormData(data);
    alert("Form submitted successfully!");
  };

  return (
    <div className=" mx-auto p-8 bg-primary-background rounded-lg shadow-sm border border-border">
      <h2 className="text-2xl font-bold mb-6 text-primary-text">
        Conditional Fields Example
      </h2>
      <p className="text-secondary-text mb-4">
        Fields will appear/disappear based on your selections
      </p>
      <CommonForm
        fields={fields}
        schema={schema}
        onSubmit={handleSubmit}
        submitButtonText="Submit"
        showResetButton
      />
      {!!formData && (
        <div className="mt-8 p-6 bg-light-background rounded-lg border border-border">
          <h3 className="font-semibold mb-3 text-primary-text">Submitted Data:</h3>
          <pre className="text-sm overflow-auto text-secondary-text">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// ============================================
// 🎯 Example 4: All Field Types Showcase
// ============================================

const AllFieldTypesExample = () => {
  const [formData, setFormData] = useState<unknown>(null);
  const [layout, setLayout] = useState<"vertical" | "grid">("grid");
  const [gridCols, setGridCols] = useState(2);

  // ... fields (same as before) ...
  const fields: FieldConfig[] = useMemo(
    () => [
      {
        name: "textInput",
        label: "Text Input",
        type: "text",
        placeholder: "Enter text...",
        defaultValue: "Sample text",
      },
      {
        name: "emailInput",
        label: "Email Input",
        type: "email",
        placeholder: "email@example.com",
      },
      {
        name: "passwordInput",
        label: "Password Input",
        type: "password",
        placeholder: "Enter password...",
      },
      {
        name: "numberInput",
        label: "Number Input",
        type: "number",
        min: 0,
        max: 100,
        defaultValue: 50,
      },
      {
        name: "rangeInput",
        label: "Range Slider",
        type: "range",
        min: 0,
        max: 100,
        step: 5,
        showValue: true,
        defaultValue: 50,
      },
      {
        name: "textareaInput",
        label: "Textarea",
        type: "textarea",
        rows: 3,
        maxLength: 200,
        showCharCount: true,
        placeholder: "Enter long text...",
      },
      {
        name: "selectInput",
        label: "Select Dropdown",
        type: "select",
        options: ["Option 1", "Option 2", "Option 3"],
        defaultValue: "Option 2",
      },
      {
        name: "multiselectInput",
        label: "Multi-Select",
        type: "multiselect",
        options: ["Choice A", "Choice B", "Choice C", "Choice D"],
        defaultValue: ["Choice A", "Choice C"],
      },
      {
        name: "checkboxInput",
        label: "Single Checkbox",
        type: "checkbox",
        checkboxLabel: "I agree to the terms",
        defaultValue: true,
      },
      {
        name: "checkboxGroupInput",
        label: "Checkbox Group",
        type: "checkbox-group",
        options: ["Item 1", "Item 2", "Item 3"],
        inline: true,
        defaultValue: ["Item 1"],
      },
      {
        name: "radioInput",
        label: "Radio Buttons",
        type: "radio",
        options: ["Red", "Green", "Blue"],
        inline: true,
        defaultValue: "Green",
      },
      {
        name: "dateInput",
        label: "Date Picker",
        type: "date",
        defaultValue: "2024-01-15",
      },
      {
        name: "timeInput",
        label: "Time Picker",
        type: "time",
        defaultValue: "14:30",
      },
      {
        name: "colorInput",
        label: "Color Picker",
        type: "color",
        defaultValue: "#3b82f6",
      },
      {
        name: "switchInput",
        label: "Toggle Switch",
        type: "switch",
        defaultValue: true,
      },
      {
        name: "tagsInput",
        label: "Tags Input",
        type: "tags",
        placeholder: "Add tags...",
        maxTags: 5,
        suggestions: ["tag1", "tag2", "tag3", "tag4", "tag5"],
        defaultValue: ["tag1", "tag2"],
      },
      {
        name: "dateRangeInput",
        label: "Date Range Picker",
        type: "date-range",
        defaultValue: [new Date("2024-01-01"), new Date("2024-01-15")],
      },
      {
        name: "fileInput",
        label: "File Upload",
        type: "file",
        accept: "image/*",
        preview: true,
      },
    ],
    [],
  );

  const schema = useMemo(() => generateZodSchema(fields), [fields]);

  const handleSubmit = (data: unknown) => {
    console.log("All Fields Data:", data);
    setFormData(data);
    alert("Form submitted successfully!");
  };

  return (
    <div className="w-full  mx-auto p-8 bg-primary-background rounded-lg shadow-sm border border-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary-text">
            Layout Playground
          </h2>
          <p className="text-secondary-text">
            Interactive demo of supported field types and layout options
          </p>
        </div>

        {/* Layout Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-light-background p-2 rounded-lg border border-border">
          <span className="text-sm font-medium text-secondary-text pl-2">
            Layout:
          </span>
          <button
            onClick={() => setLayout("vertical")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              layout === "vertical"
                ? "bg-primary-background text-primary-brand shadow-sm border border-border"
                : "text-secondary-text hover:bg-primary-background/50"
            }`}
          >
            Vertical
          </button>
          <div className="w-px h-4 bg-border mx-1"></div>
          <button
            onClick={() => {
              setLayout("grid");
              setGridCols(2);
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              layout === "grid" && gridCols === 2
                ? "bg-primary-background text-primary-brand shadow-sm border border-border"
                : "text-secondary-text hover:bg-primary-background/50"
            }`}
          >
            Grid (2 Col)
          </button>
          <button
            onClick={() => {
              setLayout("grid");
              setGridCols(3);
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              layout === "grid" && gridCols === 3
                ? "bg-primary-background text-primary-brand shadow-sm border border-border"
                : "text-secondary-text hover:bg-primary-background/50"
            }`}
          >
            Grid (3 Col)
          </button>
          <button
            onClick={() => {
              setLayout("grid");
              setGridCols(4);
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              layout === "grid" && gridCols === 4
                ? "bg-primary-background text-primary-brand shadow-sm border border-border"
                : "text-secondary-text hover:bg-primary-background/50"
            }`}
          >
            Grid (4 Col)
          </button>
        </div>
      </div>

      <CommonForm
        fields={fields}
        schema={schema}
        onSubmit={handleSubmit}
        submitButtonText="Submit All Fields"
        showResetButton
        layout={layout}
        gridCols={gridCols}
      />

      {!!formData && (
        <div className="mt-8 p-6 bg-light-background rounded-lg border border-border">
          <h3 className="font-semibold mb-3 text-primary-text">Submitted Data:</h3>
          <pre className="text-sm overflow-auto max-h-96 text-secondary-text">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

// ============================================
// 🎯 Main Demo Component
// ============================================

const FormExamples = () => {
  const [activeExample, setActiveExample] = useState<string>("registration");

  const examples = [
    {
      id: "registration",
      label: "User Registration",
      component: <UserRegistrationExample />,
    },
    {
      id: "job",
      label: "Job Application",
      component: <JobApplicationExample />,
    },
    {
      id: "conditional",
      label: "Conditional Fields",
      component: <ConditionalFieldsExample />,
    },
    {
      id: "all",
      label: "All Field Types",
      component: <AllFieldTypesExample />,
    },
  ];

  return (
    <div className="min-h-screen w-full py-8">
      <div className="w-full mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-text mb-2">
            Enhanced CommonForm Examples
          </h1>
          <p className="text-secondary-text">
            Comprehensive form component supporting 21 field types with
            validation
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          {examples.map((example) => (
            <button
              key={example.id}
              onClick={() => setActiveExample(example.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeExample === example.id
                  ? "bg-secondary-brand text-white"
                  : "bg-primary-background text-secondary-text hover:bg-light-background"
              }`}
            >
              {example.label}
            </button>
          ))}
        </div>

        {/* Active Example */}
        <div>{examples.find((ex) => ex.id === activeExample)?.component}</div>
      </div>
    </div>
  );
};

export default FormExamples;
