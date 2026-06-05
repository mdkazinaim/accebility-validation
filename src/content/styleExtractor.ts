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
  fontStyle: string;
  lineHeight: string;
  letterSpacing: string;
  textAlign: string;
  textTransform: string;
  color: string;
  backgroundColor: string;
  textColorRGB: RGB;
  bgColorRGB: RGB;
  contrastRatio: number;
  dimensions: { width: number; height: number };
  margin: string;
  padding: string;
}



let tempEl: HTMLElement | null = null;

// Convert rgb/rgba or hex string to RGB
export function parseColor(colorStr: string): RGB {
  const str = colorStr.trim().toLowerCase();
  
  if (str === "transparent" || str === "rgba(0,0,0,0)" || str === "rgba(0, 0, 0, 0)" || str === "none") {
    return { r: 0, g: 0, b: 0, a: 0 };
  }

  // If it's already a clean hex, parse it fast without DOM lookup
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
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255
      };
    }
  }

  // Fast path for rgb() and rgba() strings (most common from getComputedStyle)
  if (str.startsWith("rgb")) {
    const match = str.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.%]+))?\)/);
    if (match) {
      const alphaStr = match[4];
      let a = 1;
      if (alphaStr) {
        if (alphaStr.endsWith("%")) {
          a = parseFloat(alphaStr) / 100;
        } else {
          a = parseFloat(alphaStr);
        }
      }
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a
      };
    }
  }

  // Use the browser's native CSS engine for parsing anything else
  try {
    if (!tempEl) {
      tempEl = document.createElement("div");
      tempEl.id = "accessibility-inspector-color-parser-temp";
      tempEl.style.display = "none";
      tempEl.style.position = "absolute";
      tempEl.style.width = "0";
      tempEl.style.height = "0";
      const root = document.body || document.documentElement;
      if (root) root.appendChild(tempEl);
    }

    tempEl.style.color = "";
    tempEl.style.color = colorStr;
    const computed = window.getComputedStyle(tempEl).color;

    // Computed style color is always returned as rgb(r, g, b) or rgba(r, g, b, a) by the browser
    const match = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1
      };
    }
  } catch (e) {
    console.warn("Native color parse failed, falling back:", e);
  }



  const colors: Record<string, RGB> = {
    white: { r: 255, g: 255, b: 255, a: 1 },
    black: { r: 0, g: 0, b: 0, a: 1 },
    red: { r: 255, g: 0, b: 0, a: 1 },
    green: { r: 0, g: 255, b: 0, a: 1 },
    blue: { r: 0, g: 0, b: 255, a: 1 }
  };

  return colors[str] || { r: 0, g: 0, b: 0, a: 1 };
}

// Convert RGB to HEX
export function rgbToHex(rgb: RGB): string {
  const r = Math.round(rgb.r).toString(16).padStart(2, "0");
  const g = Math.round(rgb.g).toString(16).padStart(2, "0");
  const b = Math.round(rgb.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`.toUpperCase();
}

// Get shorthand for margin/padding
function getShorthand(top: string, right: string, bottom: string, left: string): string {
  const t = Math.round(parseFloat(top)) || 0;
  const r = Math.round(parseFloat(right)) || 0;
  const b = Math.round(parseFloat(bottom)) || 0;
  const l = Math.round(parseFloat(left)) || 0;
  if (t === r && r === b && b === l) return `${t}`;
  if (t === b && r === l) return `${t} ${r}`;
  if (r === l) return `${t} ${r} ${b}`;
  return `${t} ${r} ${b} ${l}`;
}

// Climb DOM tree to find and composite background colors
export function resolveBackgroundColor(element: HTMLElement): RGB {
  let el: HTMLElement | null = element;
  const layers: RGB[] = [];
  
  while (el) {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const parsed = parseColor(bgColor);
    if (parsed.a !== undefined && parsed.a > 0) {
      layers.push(parsed);
      if (parsed.a === 1) break; // Found fully opaque background
    }
    if (el.tagName === "HTML") break;
    el = el.parentElement;
  }
  
  // Composite from bottom (body) to top (element)
  let finalColor = { r: 255, g: 255, b: 255, a: 1 }; // Default white background
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    const a = layer.a !== undefined ? layer.a : 1;
    finalColor = {
      r: Math.round(layer.r * a + finalColor.r * (1 - a)),
      g: Math.round(layer.g * a + finalColor.g * (1 - a)),
      b: Math.round(layer.b * a + finalColor.b * (1 - a)),
      a: 1
    };
  }
  return finalColor;
}

// Compute relative luminance
export function getLuminance(rgb: RGB): number {
  const [rs, gs, bs] = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((val) => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Compute contrast ratio
export function getContrastRatio(fg: RGB, bg: RGB): number {
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Extract computed styles
export function extractElementStyles(element: HTMLElement): ElementStyles {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  const fontFamily = style.fontFamily;
  const fontFamilyChain = fontFamily.split(",").map(f => f.trim().replace(/['"]/g, ""));
  
  let textColorRGB = parseColor(style.color);
  const bgColorRGB = resolveBackgroundColor(element);

  // Composite translucent text color over the resolved background
  if (textColorRGB.a !== undefined && textColorRGB.a < 1) {
    const a = textColorRGB.a;
    textColorRGB = {
      r: Math.round(textColorRGB.r * a + bgColorRGB.r * (1 - a)),
      g: Math.round(textColorRGB.g * a + bgColorRGB.g * (1 - a)),
      b: Math.round(textColorRGB.b * a + bgColorRGB.b * (1 - a)),
      a: 1
    };
  }

  const contrastRatio = getContrastRatio(textColorRGB, bgColorRGB);

  const margin = getShorthand(style.marginTop, style.marginRight, style.marginBottom, style.marginLeft);
  const padding = getShorthand(style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft);

  return {
    tagName: element.tagName.toLowerCase(),
    className: element.className,
    fontFamily,
    fontFamilyChain,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle || "normal",
    lineHeight: style.lineHeight,
    letterSpacing: style.letterSpacing,
    textAlign: style.textAlign || "left",
    textTransform: style.textTransform || "none",
    color: rgbToHex(textColorRGB),
    backgroundColor: rgbToHex(bgColorRGB),
    textColorRGB,
    bgColorRGB,
    contrastRatio,
    dimensions: {
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    },
    margin,
    padding
  };
}
