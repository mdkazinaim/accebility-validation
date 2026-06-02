import { getContrastRatio, parseColor, resolveBackgroundColor } from "./styleExtractor";

export interface AuditIssue {
  id: string;
  type: "alt" | "contrast" | "heading" | "form" | "landmark";
  severity: "critical" | "warning" | "info";
  elementDescription: string;
  message: string;
  recommendation: string;
  xpath?: string; // We can use unique selectors or inline index references to locate elements
}

// Generate unique selector for locating element on click
function getUniqueSelector(el: HTMLElement): string {
  if (el.id) return `#${el.id}`;
  const path = [];
  let parent = el.parentElement;
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let selector = el.nodeName.toLowerCase();
    if (el.className) {
      const classes = el.className.trim().split(/\s+/).filter(c => !c.includes(":") && !c.includes("[") && !c.includes("]")).join(".");
      if (classes) selector += `.${classes}`;
    }
    
    // Find index among siblings of same tag
    const siblings = parent ? Array.from(parent.children) : [];
    const sameTagSiblings = siblings.filter(s => s.nodeName === el.nodeName);
    if (sameTagSiblings.length > 1) {
      const index = sameTagSiblings.indexOf(el);
      selector += `:nth-of-type(${index + 1})`;
    }
    
    path.unshift(selector);
    el = parent as HTMLElement;
    parent = el ? el.parentElement : null;
  }
  return path.join(" > ");
}

export function runAccessibilityAudit(): AuditIssue[] {
  const issues: AuditIssue[] = [];

  // 1. Missing Image Alt Tags
  const images = Array.from(document.querySelectorAll("img"));
  images.forEach((img, index) => {
    const alt = img.getAttribute("alt");
    if (alt === null) {
      issues.push({
        id: `alt-${index}`,
        type: "alt",
        severity: "critical",
        elementDescription: `<img> Tag (${img.src ? img.src.substring(img.src.lastIndexOf("/") + 1) : "No source"})`,
        message: "Image is missing an 'alt' attribute.",
        recommendation: "Add alt=\"description\" for screen readers. Add alt=\"\" if the image is purely decorative.",
        xpath: getUniqueSelector(img)
      });
    }
  });

  // 2. Missing Form Labels
  const inputs = Array.from(document.querySelectorAll("input, select, textarea")) as HTMLInputElement[];
  inputs.forEach((input, index) => {
    // Ignore buttons, submits, hidden elements
    const ignoredTypes = ["submit", "button", "hidden", "reset", "image"];
    if (ignoredTypes.includes(input.type)) return;

    let hasLabel = false;
    
    // Check if wrapped in <label>
    if (input.closest("label")) {
      hasLabel = true;
    }

    // Check by id/for relationship
    if (!hasLabel && input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) hasLabel = true;
    }

    // Check aria attributes
    if (!hasLabel) {
      const ariaLabel = input.getAttribute("aria-label");
      const ariaLabelledBy = input.getAttribute("aria-labelledby");
      if (ariaLabel || ariaLabelledBy) hasLabel = true;
    }

    if (!hasLabel) {
      issues.push({
        id: `form-${index}`,
        type: "form",
        severity: "critical",
        elementDescription: `<${input.tagName.toLowerCase()}> (name: ${input.name || "none"}, type: ${input.type})`,
        message: "Form control does not have an associated label.",
        recommendation: "Provide a descriptive label using a <label> element or use aria-label/aria-labelledby attributes.",
        xpath: getUniqueSelector(input)
      });
    }
  });

  // 3. Heading Hierarchy Audit
  const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6")) as HTMLElement[];
  let lastLevel = 0;
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName.charAt(1), 10);
    if (index === 0 && level !== 1) {
      issues.push({
        id: `heading-start`,
        type: "heading",
        severity: "info",
        elementDescription: `<${heading.tagName.toLowerCase()}>: ${heading.textContent?.trim().substring(0, 30)}...`,
        message: "Document does not start with an <h1>.",
        recommendation: "It is best practice for pages to begin with an <h1> representing the main page content.",
        xpath: getUniqueSelector(heading)
      });
    } else if (lastLevel > 0 && level > lastLevel + 1) {
      issues.push({
        id: `heading-jump-${index}`,
        type: "heading",
        severity: "warning",
        elementDescription: `<${heading.tagName.toLowerCase()}>: ${heading.textContent?.trim().substring(0, 30)}...`,
        message: `Heading level skipped: jumped from H${lastLevel} to H${level}.`,
        recommendation: `Restructure heading hierarchy so levels increase sequentially (e.g. H${lastLevel} -> H${lastLevel + 1}).`,
        xpath: getUniqueSelector(heading)
      });
    }
    lastLevel = level;
  });

  // 4. ARIA Landmarks Audit
  const mainLandmark = document.querySelector("main, [role='main']");
  if (!mainLandmark) {
    issues.push({
      id: "landmark-main",
      type: "landmark",
      severity: "warning",
      elementDescription: "Document Body",
      message: "No <main> landmark found.",
      recommendation: "Wrap the primary page content in a <main> tag or role=\"main\" to support screen reader landmark navigation."
    });
  }

  // 5. High-Contrast Checker (Fast Check for Typical Typography)
  const typographyElements = Array.from(
    document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, label, a, button")
  ) as HTMLElement[];
  
  let contrastCount = 0;
  typographyElements.forEach((el) => {
    // Cap scanned items to prevent browser freeze on huge pages
    if (contrastCount > 100) return;

    const text = el.textContent?.trim();
    if (!text || text.length === 0) return;

    // Filter hidden elements
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const computedStyle = window.getComputedStyle(el);
    if (computedStyle.display === "none" || computedStyle.visibility === "hidden") return;

    const fgRGB = parseColor(computedStyle.color);
    const bgRGB = resolveBackgroundColor(el);
    const ratio = getContrastRatio(fgRGB, bgRGB);

    // Determine if it is large text
    const sizePx = parseFloat(computedStyle.fontSize);
    const isBold = parseInt(computedStyle.fontWeight, 10) >= 700 || computedStyle.fontWeight === "bold";
    const sizePt = sizePx * 72 / 96; // convert px to pt approximately
    const isLargeText = sizePt >= 18 || (sizePt >= 14 && isBold);

    const minRatio = isLargeText ? 3.0 : 4.5;

    if (ratio < minRatio && fgRGB.a !== 0) {
      contrastCount++;
      issues.push({
        id: `contrast-${contrastCount}`,
        type: "contrast",
        severity: "critical",
        elementDescription: `<${el.tagName.toLowerCase()}> ("${text.substring(0, 20)}...")`,
        message: `Contrast ratio is too low (${ratio.toFixed(2)}:1). WCAG requires a minimum of ${minRatio}:1.`,
        recommendation: `Increase color contrast between text color (${computedStyle.color}) and background (${computedStyle.backgroundColor}).`,
        xpath: getUniqueSelector(el)
      });
    }
  });

  return issues;
}
