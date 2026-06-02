import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  suggestions?: string[];
  allowCustom?: boolean;
  disabled?: boolean;
  className?: string;
  tagColor?: string;
}

const TagsInput = ({
  value = [],
  onChange,
  placeholder = "Add tags...",
  maxTags,
  suggestions = [],
  allowCustom = true,
  disabled = false,
  className = "",
  tagColor = "bg-primary-brand/10 text-primary-text border border-primary-brand/20",
}: TagsInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      !value.includes(suggestion) &&
      suggestion.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();

    if (!trimmedTag) return;

    if (value.includes(trimmedTag)) {
      setInputValue("");
      return;
    }

    if (maxTags && value.length >= maxTags) {
      setInputValue("");
      return;
    }

    if (!allowCustom && !suggestions.includes(trimmedTag)) {
      setInputValue("");
      return;
    }

    onChange([...value, trimmedTag]);
    setInputValue("");
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex flex-wrap gap-2 p-2.5 border border-border rounded-lg min-h-[44px] transition-all duration-200 ${
          disabled
            ? "bg-light-background/50 cursor-not-allowed"
            : "bg-light-background hover:bg-light-background/80 focus-within:bg-primary-background focus-within:border-primary-brand/50 focus-within:ring-4 focus-within:ring-primary-brand/10"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${tagColor}`}
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:bg-black/10 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(true)}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={
            disabled || (maxTags !== undefined && value.length >= maxTags)
          }
          className="flex-1 min-w-[120px] outline-none bg-transparent disabled:cursor-not-allowed text-primary-text placeholder:text-secondary-text"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-primary-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-light-background transition-colors text-primary-text"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Helper Text */}
      {maxTags && (
        <p className="text-xs text-secondary-text mt-1">
          {value.length}/{maxTags} tags
        </p>
      )}
    </div>
  );
};

export default TagsInput;
