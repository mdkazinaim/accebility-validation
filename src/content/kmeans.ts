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

// Extract dominant colors using simple k-means approximation
export function extractPalette(colors: RGB[], k = 6): string[] {
  if (colors.length === 0) {
    return ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
  }

  // Get unique colors first to prevent initial centroid duplicates
  const uniqueColorsMap = new Map<string, RGB>();
  for (const c of colors) {
    const hex = rgbToHex(c);
    if (!uniqueColorsMap.has(hex)) {
      uniqueColorsMap.set(hex, c);
    }
  }
  const uniqueColors = Array.from(uniqueColorsMap.values());

  // Pick k unique points as initial centroids if possible
  let centroids = uniqueColors.slice(0, k).map(c => ({ ...c }));
  while (centroids.length < k) {
    centroids.push({
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256)
    });
  }

  const maxIterations = 5;
  for (let iter = 0; iter < maxIterations; iter++) {
    // Assign colors to centroids
    const clusters: RGB[][] = Array.from({ length: k }, () => []);
    
    for (const color of colors) {
      let minDist = Infinity;
      let clusterIndex = 0;
      
      for (let i = 0; i < k; i++) {
        const c = centroids[i];
        const dist = Math.pow(color.r - c.r, 2) + Math.pow(color.g - c.g, 2) + Math.pow(color.b - c.b, 2);
        if (dist < minDist) {
          minDist = dist;
          clusterIndex = i;
        }
      }
      clusters[clusterIndex].push(color);
    }

    // Update centroids
    for (let i = 0; i < k; i++) {
      const cluster = clusters[i];
      if (cluster.length > 0) {
        const sum = cluster.reduce((acc, curr) => ({ r: acc.r + curr.r, g: acc.g + curr.g, b: acc.b + curr.b }), { r: 0, g: 0, b: 0 });
        centroids[i] = {
          r: Math.round(sum.r / cluster.length),
          g: Math.round(sum.g / cluster.length),
          b: Math.round(sum.b / cluster.length)
        };
      }
    }
  }

  // Convert to unique hex color strings
  const hexes = centroids.map(rgbToHex);
  return Array.from(new Set(hexes));
}

// Scan webpage elements for colors
export function scanPageColors(): RGB[] {
  const colors: RGB[] = [];
  // Ignore scripts, styles, and the extension's own container elements
  const selector = "body *:not(script):not(style):not(#accessibility-inspector-extension-root):not(#accessibility-inspector-extension-root *)";
  const elements = Array.from(document.querySelectorAll(selector));
  
  // Sample up to 1000 elements for accuracy while preserving excellent performance
  let sampledElements = elements;
  if (elements.length > 1000) {
    const step = Math.floor(elements.length / 1000);
    sampledElements = [];
    for (let i = 0; i < elements.length; i += step) {
      sampledElements.push(elements[i]);
    }
  }

  for (const el of sampledElements) {
    const htmlEl = el as HTMLElement;
    if (htmlEl.nodeType !== Node.ELEMENT_NODE) continue;
    
    try {
      const style = window.getComputedStyle(htmlEl);
      
      // 1. Background colors
      const bg = style.backgroundColor;
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        const parsedBg = parseColor(bg);
        if (parsedBg && parsedBg.a !== 0 && !isNaN(parsedBg.r)) {
          colors.push(parsedBg);
        }
      }
      
      // 2. Text colors (only if element has direct text content, avoiding redundant inherits)
      let hasDirectText = false;
      for (let j = 0; j < htmlEl.childNodes.length; j++) {
        if (htmlEl.childNodes[j].nodeType === Node.TEXT_NODE && htmlEl.childNodes[j].nodeValue?.trim()) {
          hasDirectText = true;
          break;
        }
      }
      
      if (hasDirectText) {
        const fg = style.color;
        if (fg && fg !== "rgba(0, 0, 0, 0)" && fg !== "transparent") {
          const parsedFg = parseColor(fg);
          if (parsedFg && parsedFg.a !== 0 && !isNaN(parsedFg.r)) {
            colors.push(parsedFg);
          }
        }
      }

      // 3. SVG colors (fill & stroke)
      const tagName = htmlEl.tagName.toLowerCase();
      if (tagName === "path" || tagName === "rect" || tagName === "circle" || tagName === "polygon" || tagName === "ellipse") {
        const fill = style.fill;
        if (fill && fill !== "none" && fill !== "rgba(0, 0, 0, 0)" && fill !== "transparent") {
          const parsedFill = parseColor(fill);
          if (parsedFill && parsedFill.a !== 0 && !isNaN(parsedFill.r)) {
            colors.push(parsedFill);
          }
        }
        
        const stroke = style.stroke;
        if (stroke && stroke !== "none" && stroke !== "rgba(0, 0, 0, 0)" && stroke !== "transparent") {
          const parsedStroke = parseColor(stroke);
          if (parsedStroke && parsedStroke.a !== 0 && !isNaN(parsedStroke.r)) {
            colors.push(parsedStroke);
          }
        }
      }
    } catch {
      // ignore style reading exceptions
    }
  }
  return colors;
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
