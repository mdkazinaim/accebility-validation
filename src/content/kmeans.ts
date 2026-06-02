import { parseColor, RGB } from "./styleExtractor";

export interface ColorScheme {
  dominant: string; // Hex
  palette: string[]; // Hex list
  suggested: {
    type: string;
    colors: string[];
  }[];
}

// Convert RGB to HEX
export function rgbToHex(rgb: RGB): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
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
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Convert HSL to HEX
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, c)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Simple color distance
function colorDistance(c1: RGB, c2: RGB): number {
  return Math.pow(c1.r - c2.r, 2) + Math.pow(c1.g - c2.g, 2) + Math.pow(c1.b - c2.b, 2);
}

// K-Means clustering algorithm
export function extractPalette(pixels: RGB[], k = 5, iterations = 5): string[] {
  if (pixels.length === 0) {
    return ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#6366f1"]; // default fallback
  }

  // 1. Initialize centroids randomly
  let centroids: RGB[] = [];
  const uniquePixels = Array.from(new Set(pixels.map(p => `${p.r},${p.g},${p.b}`)))
    .map(s => {
      const parts = s.split(",");
      return { r: parseInt(parts[0]), g: parseInt(parts[1]), b: parseInt(parts[2]) };
    });

  // Pick k elements from unique pixels or repeat if unique pixels are fewer than k
  for (let i = 0; i < k; i++) {
    const source = uniquePixels.length > 0 ? uniquePixels : pixels;
    const randIdx = Math.floor(Math.random() * source.length);
    centroids.push(source[randIdx]);
  }

  for (let iter = 0; iter < iterations; iter++) {
    // 2. Assign each pixel to the nearest centroid
    const clusters: RGB[][] = Array.from({ length: k }, () => []);

    for (const pixel of pixels) {
      let minDist = Infinity;
      let centroidIdx = 0;
      
      for (let i = 0; i < k; i++) {
        const dist = colorDistance(pixel, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          centroidIdx = i;
        }
      }
      clusters[centroidIdx].push(pixel);
    }

    // 3. Recompute centroids
    const nextCentroids: RGB[] = [];
    let centroidMoved = false;

    for (let i = 0; i < k; i++) {
      const cluster = clusters[i];
      if (cluster.length === 0) {
        nextCentroids.push(centroids[i]);
        continue;
      }

      const sum = cluster.reduce((acc, p) => ({ r: acc.r + p.r, g: acc.g + p.g, b: acc.b + p.b }), { r: 0, g: 0, b: 0 });
      const nextCentroid = {
        r: Math.round(sum.r / cluster.length),
        g: Math.round(sum.g / cluster.length),
        b: Math.round(sum.b / cluster.length)
      };

      if (colorDistance(nextCentroid, centroids[i]) > 1) {
        centroidMoved = true;
      }
      nextCentroids.push(nextCentroid);
    }

    centroids = nextCentroids;
    if (!centroidMoved) break;
  }

  return centroids.map(rgbToHex);
}

// Generate suggested complementary and analogous schemes based on a base color
export function generateSuggestions(hexColor: string) {
  // Parse base color
  const tempRgb = {
    r: parseInt(hexColor.slice(1, 3), 16),
    g: parseInt(hexColor.slice(3, 5), 16),
    b: parseInt(hexColor.slice(5, 7), 16)
  };
  const { h, s, l } = rgbToHsl(tempRgb);

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

// Scan elements on the page and extract their colors
export function scanPageColors(): RGB[] {
  const elements = Array.from(document.querySelectorAll("body *")) as HTMLElement[];
  const colors: RGB[] = [];

  // Randomly sample up to 300 elements to keep speed high
  const sampledElements = elements.length > 300 
    ? elements.sort(() => 0.5 - Math.random()).slice(0, 300)
    : elements;

  sampledElements.forEach((el) => {
    try {
      const style = window.getComputedStyle(el);
      
      const bg = style.backgroundColor;
      if (bg && bg !== "transparent" && !bg.includes("rgba(0, 0, 0, 0)")) {
        const parsedBg = parseColor(bg);
        if (parsedBg.a === undefined || parsedBg.a > 0.1) {
          // Skip pure black and whites from general palette unless they are the only things
          if (!(parsedBg.r === 255 && parsedBg.g === 255 && parsedBg.b === 255) && 
              !(parsedBg.r === 0 && parsedBg.g === 0 && parsedBg.b === 0)) {
            colors.push(parsedBg);
          }
        }
      }
      
      const fg = style.color;
      if (fg) {
        const parsedFg = parseColor(fg);
        if (!(parsedFg.r === 255 && parsedFg.g === 255 && parsedFg.b === 255) && 
            !(parsedFg.r === 0 && parsedFg.g === 0 && parsedFg.b === 0)) {
          colors.push(parsedFg);
        }
      }
    } catch {
      // ignore style errors
    }
  });

  return colors;
}
