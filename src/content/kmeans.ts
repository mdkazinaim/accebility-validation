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
    return ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
  }

  // Pick k random points as initial centroids
  let centroids = colors.slice(0, k).map(c => ({ ...c }));
  while (centroids.length < k) {
    centroids.push({ r: Math.random() * 255, g: Math.random() * 255, b: Math.random() * 255 });
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
  const elements = Array.from(document.querySelectorAll("body, body *"));
  
  // Sample up to 300 elements
  const sampleStep = Math.max(1, Math.floor(elements.length / 300));
  for (let i = 0; i < elements.length; i += sampleStep) {
    const el = elements[i] as HTMLElement;
    if (el.nodeType !== Node.ELEMENT_NODE) continue;
    
    try {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      const fg = style.color;
      
      if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        const parsedBg = parseColor(bg);
        if (parsedBg && parsedBg.a !== 0 && !isNaN(parsedBg.r)) {
          colors.push(parsedBg);
        }
      }
      if (fg && fg !== "rgba(0, 0, 0, 0)" && fg !== "transparent") {
        const parsedFg = parseColor(fg);
        if (parsedFg && parsedFg.a !== 0 && !isNaN(parsedFg.r)) {
          colors.push(parsedFg);
        }
      }
    } catch {
      // ignore styles exceptions
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
