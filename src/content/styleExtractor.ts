export interface RGB {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface ElementStyles {
  tagName: string;
  className: string;
  fontFamily: string;
  fontFamilyChain: string[];
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  color: string;
  backgroundColor: string;
  textColorRGB: RGB;
  bgColorRGB: RGB;
  contrastRatio: number;
  fontSource: "Google Fonts" | "Adobe Typekit" | "Local System" | "Web Font (Self-Hosted)" | "Unknown";
  dimensions: { width: number; height: number };
}

// Parse hex, rgb, or rgba color strings to RGB object
export function parseColor(colorStr: string): RGB {
  const str = colorStr.trim().toLowerCase();
  
  // Handle rgba/rgb
  if (str.startsWith("rgb")) {
    const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1
      };
    }
  }

  // Handle Hex
  if (str.startsWith("#")) {
    const hex = str.slice(1);
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    }
    if (hex.length === 6 || hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
      };
    }
  }

  // Fallback map for common color names
  const colors: Record<string, RGB> = {
    transparent: { r: 0, g: 0, b: 0, a: 0 },
    white: { r: 255, g: 255, b: 255, a: 1 },
    black: { r: 0, g: 0, b: 0, a: 1 },
    red: { r: 255, g: 0, b: 0, a: 1 },
    green: { r: 0, g: 255, b: 0, a: 1 },
    blue: { r: 0, g: 0, b: 255, a: 1 }
  };

  return colors[str] || { r: 0, g: 0, b: 0, a: 1 };
}

// Climb DOM tree to find non-transparent background color
export function resolveBackgroundColor(element: HTMLElement): RGB {
  let el: HTMLElement | null = element;
  
  while (el) {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const parsed = parseColor(bgColor);
    
    // If background-color is solid or has significant opacity, return it
    if (parsed.a !== undefined && parsed.a > 0.05) {
      // If parent has opacity, merge colors? Simpler to just use it for contrast.
      return parsed;
    }
    
    // Check if it's HTML/Body and default to white if transparent
    if (el.tagName === "HTML") {
      break;
    }
    
    el = el.parentElement;
  }
  
  return { r: 255, g: 255, b: 255, a: 1 };
}

// Compute relative luminance
export function getLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Compute contrast ratio between foreground and background
export function getContrastRatio(fg: RGB, bg: RGB): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Inspect stylesheets to determine the font's load source
export function detectFontSource(fontFamily: string): "Google Fonts" | "Adobe Typekit" | "Local System" | "Web Font (Self-Hosted)" | "Unknown" {
  const cleanFamily = fontFamily.split(",")[0].trim().replace(/['"]/g, "").toLowerCase();
  
  // Standard list of system fonts
  const systemFonts = [
    "arial", "helvetica", "georgia", "times new roman", "times", "courier new", 
    "courier", "verdana", "tahoma", "trebuchet ms", "impact", "comic sans ms",
    "sans-serif", "serif", "monospace", "cursive", "fantasy", "system-ui", "-apple-system"
  ];
  
  if (systemFonts.includes(cleanFamily)) {
    return "Local System";
  }

  // Iterate stylesheets to find @font-face rules
  try {
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        if (!rules) continue;
        
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j];
          if (rule.type === CSSRule.FONT_FACE_RULE) {
            const fontFaceRule = rule as CSSFontFaceRule;
            const faceFamily = fontFaceRule.style.getPropertyValue("font-family").replace(/['"]/g, "").toLowerCase();
            
            if (faceFamily === cleanFamily) {
              const src = fontFaceRule.style.getPropertyValue("src") || "";
              if (src.includes("fonts.gstatic.com") || src.includes("fonts.googleapis.com")) {
                return "Google Fonts";
              }
              if (src.includes("use.typekit.net") || src.includes("typekit")) {
                return "Adobe Typekit";
              }
              return "Web Font (Self-Hosted)";
            }
          }
        }
      } catch {
        // Cross-origin stylesheet issues - ignore
      }
    }
  } catch {
    // Top-level sheet listing failed
  }

  // If the page imports google fonts links
  const links = Array.from(document.querySelectorAll("link[href*='fonts.googleapis.com']"));
  if (links.length > 0) {
    // If we can't find @font-face, but Google fonts link exists, assume it might be google
    return "Google Fonts";
  }

  return "Unknown";
}

// Main computed style extractor
export function extractElementStyles(element: HTMLElement): ElementStyles {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();

  const fontFamily = style.fontFamily;
  const fontFamilyChain = fontFamily.split(",").map(f => f.trim().replace(/['"]/g, ""));
  
  const textColorRGB = parseColor(style.color);
  const bgColorRGB = resolveBackgroundColor(element);
  const contrastRatio = getContrastRatio(textColorRGB, bgColorRGB);

  return {
    tagName: element.tagName.toLowerCase(),
    className: element.className,
    fontFamily,
    fontFamilyChain,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    color: style.color,
    backgroundColor: style.backgroundColor,
    textColorRGB,
    bgColorRGB,
    contrastRatio,
    fontSource: detectFontSource(fontFamily),
    dimensions: {
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    }
  };
}
