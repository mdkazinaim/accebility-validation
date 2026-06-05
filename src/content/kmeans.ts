import { RGB, parseColor } from "./styleExtractor";

export interface ColorHarmony {
  type: string;
  colors: string[];
}

export function rgbToHex(rgb: RGB): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace(/^#/, "");
  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);
  return { r, g, b, a: 1 };
}

// Convert RGB to HSL
export function rgbToHsl(rgb: RGB): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Convert HSL to Hex
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const kVal = k(n);
    const color = l - a * Math.max(Math.min(kVal - 3, 9 - kVal, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Extract ALL unique colors from the page, sorted by frequency (most used first).
// No clustering, no merging, no distance thresholds. Every distinct hex is returned.
export function extractPalette(colors: RGB[]): string[] {
  if (colors.length === 0) {
    return [];
  }

  // Count exact frequencies of each hex color
  const frequencyMap = new Map<string, number>();
  for (const c of colors) {
    const hex = rgbToHex(c).toUpperCase();
    frequencyMap.set(hex, (frequencyMap.get(hex) || 0) + 1);
  }

  // Sort by frequency (most used first) and return every unique color
  const sorted = Array.from(frequencyMap.entries()).sort((a, b) => b[1] - a[1]);
  return sorted.map(([hex]) => hex);
}

// Helper: parse a CSS color string to hex, returns null if transparent/invalid
function cssToHex(raw: string): string | null {
  if (!raw || raw === "rgba(0, 0, 0, 0)" || raw === "transparent" || raw === "none") return null;
  const parsed = parseColor(raw);
  if (!parsed || isNaN(parsed.r) || (parsed.a ?? 1) <= 0.05) return null;
  return rgbToHex(parsed).toUpperCase();
}

// Scan the ENTIRE page DOM for every color used on every VISIBLE element.
// Only includes elements that are actually rendered (non-zero dimensions, not hidden).
// Reads: backgroundColor, color, borderColor (all 4 sides), outlineColor, SVG fill & stroke,
// boxShadow colors, backgroundImage gradient colors, textDecorationColor, caretColor, accentColor.
// Returns one RGB entry per element-property occurrence for accurate frequency counting.
export function scanPageColors(): RGB[] {
  const results: RGB[] = [];

  // Ignore our own extension root and its descendants
  const selector = "body *:not(script):not(style):not(link):not(meta):not(head):not(#accessibility-inspector-extension-root):not(#accessibility-inspector-extension-root *)";
  const elements = document.querySelectorAll(selector);

  // Track which hex values we've already added, so we push one RGB per unique hex per element
  // (prevents duplicates from the same element, but counts across elements for frequency)
  const addHex = (hex: string) => {
    const parsed = hexToRgb(hex);
    results.push(parsed);
  };

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as HTMLElement;
    if (el.nodeType !== Node.ELEMENT_NODE) continue;

    // Skip invisible elements — these produce phantom colors
    try {
      if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
      const cs = window.getComputedStyle(el);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") continue;
    } catch {
      continue;
    }

    // Collect all hex values from this element, deduped within the element
    const elementHexes = new Set<string>();

    try {
      const style = window.getComputedStyle(el);

      // Background color
      const bgHex = cssToHex(style.backgroundColor);
      if (bgHex) elementHexes.add(bgHex);

      // Text color
      const colorHex = cssToHex(style.color);
      if (colorHex) elementHexes.add(colorHex);

      // Border colors (each side can differ)
      for (const side of [style.borderTopColor, style.borderRightColor, style.borderBottomColor, style.borderLeftColor]) {
        const h = cssToHex(side);
        if (h) elementHexes.add(h);
      }

      // Outline color
      const outHex = cssToHex(style.outlineColor);
      if (outHex) elementHexes.add(outHex);

      // Text decoration color
      const tdcHex = cssToHex(style.textDecorationColor);
      if (tdcHex) elementHexes.add(tdcHex);

      // SVG fill & stroke (broad tag coverage)
      const tag = el.tagName.toLowerCase();
      if (tag === "svg" || tag === "path" || tag === "rect" || tag === "circle" ||
          tag === "polygon" || tag === "ellipse" || tag === "line" || tag === "polyline" ||
          tag === "g" || tag === "use" || tag === "text" || tag === "tspan") {
        const fillHex = cssToHex(style.fill);
        if (fillHex) elementHexes.add(fillHex);
        const strokeHex = cssToHex(style.stroke);
        if (strokeHex) elementHexes.add(strokeHex);
      }

      // Box-shadow colors
      const shadow = style.boxShadow;
      if (shadow && shadow !== "none") {
        const rgbMatches = shadow.match(/rgba?\([^)]+\)/g);
        if (rgbMatches) {
          for (const m of rgbMatches) {
            const h = cssToHex(m);
            if (h) elementHexes.add(h);
          }
        }
      }

      // Background-image gradient colors
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== "none" && bgImage.includes("gradient")) {
        const gradientColors = bgImage.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/g);
        if (gradientColors) {
          for (const gc of gradientColors) {
            const h = cssToHex(gc);
            if (h) elementHexes.add(h);
          }
        }
      }
    } catch {
      // Ignore unreadable elements
    }

    // Push one entry per unique color from this element
    for (const hex of elementHexes) {
      addHex(hex);
    }
  }

  return results;
}

// Generate color schemes/harmonies
export function generateSuggestions(hexColor: string): ColorHarmony[] {
  const rgb = hexToRgb(hexColor);
  const { h, s, l } = rgbToHsl(rgb);

  return [
    {
      type: "Analogous",
      colors: [
        hslToHex((h + 330) % 360, s, l),
        hslToHex((h + 345) % 360, s, l),
        hexColor,
        hslToHex((h + 15) % 360, s, l),
        hslToHex((h + 30) % 360, s, l)
      ]
    },
    {
      type: "Complementary",
      colors: [
        hexColor,
        hslToHex((h + 180) % 360, s, l)
      ]
    },
    {
      type: "Triadic",
      colors: [
        hexColor,
        hslToHex((h + 120) % 360, s, l),
        hslToHex((h + 240) % 360, s, l)
      ]
    },
    {
      type: "Monochromatic",
      colors: [
        hslToHex(h, s, Math.max(10, l - 30)),
        hslToHex(h, s, Math.max(10, l - 15)),
        hexColor,
        hslToHex(h, s, Math.min(90, l + 15)),
        hslToHex(h, s, Math.min(90, l + 30))
      ]
    }
  ];
}
