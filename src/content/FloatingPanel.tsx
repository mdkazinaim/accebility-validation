import React, { useState, useEffect, useRef } from "react";
import {
  X,
  MousePointer,
  Type,
  Palette,
  Image,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Pipette
} from "lucide-react";
import { ElementStyles, parseColor } from "./styleExtractor";
import { extractPalette, generateSuggestions, rgbToHex, scanPageColors } from "./kmeans";

interface FloatingPanelProps {
  inspectorActive: boolean;
  setInspectorActive: (active: boolean) => void;
  lockedItems: { element: HTMLElement; styles: ElementStyles }[];
  onRemoveLockedItem: (element: HTMLElement) => void;
  onClearAllLocked: () => void;
  onClose: () => void;
  activeTab: "inspect" | "colors" | "fonts" | "images";
  setActiveTab: (tab: "inspect" | "colors" | "fonts" | "images") => void;
  showContrastTooltips: boolean;
  setShowContrastTooltips: (show: boolean) => void;
  onTriggerEyeDropper?: () => void;
  hidden?: boolean;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

interface ScannedFont {
  family: string;
  count: number;
}

interface ScannedFontSize {
  size: string;
  count: number;
}

interface ScannedImage {
  src: string;
  tagName: string;
  alt: string;
  dimensions: { width: number; height: number };
  type: "image" | "video";
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  inspectorActive,
  setInspectorActive,
  lockedItems,
  onRemoveLockedItem,
  onClearAllLocked,
  onClose,
  activeTab,
  setActiveTab,
  showContrastTooltips,
  setShowContrastTooltips,
  onTriggerEyeDropper,
  hidden,
  selectedColor,
  setSelectedColor: onSetSelectedColor,
}) => {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Color tab state
  const [dominantPalette, setDominantPalette] = useState<string[]>([]);

  const normalizeToHex = (colorStr: string): string => {
    if (!colorStr) return "";
    const clean = colorStr.trim();
    if (clean.startsWith("#") && (clean.length === 7 || clean.length === 4)) {
      return clean.toUpperCase();
    }
    const parsed = parseColor(clean);
    if (parsed && !isNaN(parsed.r)) {
      const r = Math.round(parsed.r).toString(16).padStart(2, "0");
      const g = Math.round(parsed.g).toString(16).padStart(2, "0");
      const b = Math.round(parsed.b).toString(16).padStart(2, "0");
      return `#${r}${g}${b}`.toUpperCase();
    }
    return clean;
  };

  const setSelectedColor = (color: string) => {
    onSetSelectedColor(normalizeToHex(color));
  };

  // Fonts tab state
  const [scannedFamilies, setScannedFamilies] = useState<ScannedFont[]>([]);
  const [scannedSizes, setScannedSizes] = useState<ScannedFontSize[]>([]);

  // Scanning overlay animations state
  const [isScanningColors, setIsScanningColors] = useState(false);
  const [isScanningFonts, setIsScanningFonts] = useState(false);
  const [isScanningMedia, setIsScanningMedia] = useState(false);

  // Images tab state
  // Images tab state
  const [scannedImages, setScannedImages] = useState<ScannedImage[]>([]);
  const [downloadFormat, setDownloadFormat] = useState<"original" | "png" | "jpeg" | "webp">("original");
  const [downloadQuality, setDownloadQuality] = useState<number>(1.0);
  const [selectedMediaSrcs, setSelectedMediaSrcs] = useState<Set<string>>(new Set());
  const [downloadingItems, setDownloadingItems] = useState<Record<string, boolean>>({});

  // Font highlighting state and refs
  const [highlightedFont, setHighlightedFont] = useState<string | null>(null);
  const [highlightedSize, setHighlightedSize] = useState<string | null>(null);
  const highlightedElementsRef = useRef<HTMLElement[]>([]);
  const originalStylesRef = useRef<Map<HTMLElement, { outline: string; outlineOffset: string; boxShadow: string }>>(new Map());

  // Color highlighting refs
  const highlightedColorElementsRef = useRef<HTMLElement[]>([]);
  const originalColorStylesRef = useRef<Map<HTMLElement, { outline: string; outlineOffset: string; boxShadow: string }>>(new Map());

  // Drag state for open panel
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: 16 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  // Drag state for minimized logo button
  const [dockEdge, setDockEdge] = useState<"left" | "right">("right");
  const [logoY, setLogoY] = useState(100);
  const [isDraggingLogo, setIsDraggingLogo] = useState(false);
  const logoDragStartOffset = useRef({ x: 0, y: 0 });
  const logoClickStartPos = useRef({ x: 0, y: 0 });
  const [logoDragPos, setLogoDragPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y
      });
    };
    const handleMouseUp = () => {
      setIsDragging(false);
      setPosition(prev => {
        const isCloserToLeft = prev.x < (window.innerWidth - 384) / 2;
        const edge = isCloserToLeft ? "left" : "right";
        setDockEdge(edge);
        setLogoY(prev.y);
        return prev;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent, isMinimizedButton: boolean = false) => {
    // Prevent dragging if clicking an interactive button inside the main header
    if (!isMinimizedButton && (e.target as HTMLElement).closest("button")) return;
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  useEffect(() => {
    if (!isDraggingLogo) return;
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - logoDragStartOffset.current.x;
      const y = e.clientY - logoDragStartOffset.current.y;
      setLogoDragPos({ x, y });
    };

    const handleMouseUp = (e: MouseEvent) => {
      setIsDraggingLogo(false);
      
      const dx = Math.abs(e.clientX - logoClickStartPos.current.x);
      const dy = Math.abs(e.clientY - logoClickStartPos.current.y);
      
      if (dx < 5 && dy < 5) {
        // Quick click - restore panel to default position
        setIsMinimized(false);
        setPosition({
          x: dockEdge === "right" ? window.innerWidth - 400 : 16,
          y: 16
        });
      } else {
        // Reposition and snap to nearest edge
        const isCloserToLeft = e.clientX < window.innerWidth / 2;
        const finalEdge = isCloserToLeft ? "left" : "right";
        setDockEdge(finalEdge);
        
        const finalY = Math.max(16, Math.min(e.clientY - logoDragStartOffset.current.y, window.innerHeight - 80));
        setLogoY(finalY);
        
        setPosition({
          x: finalEdge === "right" ? window.innerWidth - 400 : 16,
          y: 16
        });
      }
      setLogoDragPos(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingLogo]);

  const handleLogoMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLogo(true);
    const startX = dockEdge === "left" ? 0 : window.innerWidth - 48;
    logoDragStartOffset.current = {
      x: e.clientX - startX,
      y: e.clientY - logoY
    };
    logoClickStartPos.current = { x: e.clientX, y: e.clientY };
  };

  // Reset minimize on tab change
  useEffect(() => {
    setIsMinimized(false);
  }, [activeTab]);

  const clearFontHighlights = () => {
    highlightedElementsRef.current.forEach(el => {
      const orig = originalStylesRef.current.get(el);
      if (orig) {
        el.style.outline = orig.outline;
        el.style.outlineOffset = orig.outlineOffset;
        el.style.boxShadow = orig.boxShadow;
      }
    });
    highlightedElementsRef.current = [];
    originalStylesRef.current.clear();
    setHighlightedFont(null);
    setHighlightedSize(null);
  };

  const clearColorHighlights = () => {
    highlightedColorElementsRef.current.forEach(el => {
      const orig = originalColorStylesRef.current.get(el);
      if (orig) {
        el.style.outline = orig.outline;
        el.style.outlineOffset = orig.outlineOffset;
        el.style.boxShadow = orig.boxShadow;
      }
    });
    highlightedColorElementsRef.current = [];
    originalColorStylesRef.current.clear();
  };

  const highlightColorElements = (colorHex: string | null) => {
    clearColorHighlights();
    if (!colorHex) return;

    const targetHex = colorHex.toUpperCase();
    const allElements = Array.from(document.querySelectorAll("*")) as HTMLElement[];
    const shadowHost = document.getElementById("accessibility-inspector-extension-root");

    const isMatch = (colorStr: string): boolean => {
      if (!colorStr || colorStr === "rgba(0, 0, 0, 0)" || colorStr === "transparent" || colorStr === "none") return false;
      return normalizeToHex(colorStr) === targetHex;
    };

    const matches = allElements.filter(el => {
      if (shadowHost && shadowHost.contains(el)) return false;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;

      try {
        const style = window.getComputedStyle(el);
        if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;

        // Background color
        if (isMatch(style.backgroundColor)) return true;

        // Text color
        if (isMatch(style.color)) return true;

        // Border colors (all 4 sides)
        if (isMatch(style.borderTopColor) || isMatch(style.borderRightColor) ||
            isMatch(style.borderBottomColor) || isMatch(style.borderLeftColor)) return true;

        // Outline color
        if (isMatch(style.outlineColor)) return true;

        // Text decoration color
        if (isMatch(style.textDecorationColor)) return true;

        // SVG fill & stroke
        const tag = el.tagName.toLowerCase();
        if (tag === "svg" || tag === "path" || tag === "rect" || tag === "circle" ||
            tag === "polygon" || tag === "ellipse" || tag === "line" || tag === "polyline" ||
            tag === "g" || tag === "use" || tag === "text" || tag === "tspan") {
          if (isMatch(style.fill) || isMatch(style.stroke)) return true;
        }

        // Box-shadow colors
        const shadow = style.boxShadow;
        if (shadow && shadow !== "none") {
          const rgbMatches = shadow.match(/rgba?\([^)]+\)/g);
          if (rgbMatches) {
            for (const m of rgbMatches) {
              if (isMatch(m)) return true;
            }
          }
        }

        // Background-image gradient colors
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== "none" && bgImage.includes("gradient")) {
          const gradientColors = bgImage.match(/rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}/g);
          if (gradientColors) {
            for (const gc of gradientColors) {
              if (isMatch(gc)) return true;
            }
          }
        }

        return false;
      } catch {
        return false;
      }
    });

    matches.forEach(el => {
      originalColorStylesRef.current.set(el, {
        outline: el.style.outline,
        outlineOffset: el.style.outlineOffset,
        boxShadow: el.style.boxShadow,
      });

      el.style.outline = "3px dashed #3b82f6";
      el.style.outlineOffset = "-3px";
      el.style.boxShadow = "0 0 12px rgba(59, 130, 246, 0.7)";
    });

    highlightedColorElementsRef.current = matches;
  };

  const highlightFontProperty = (type: "family" | "size", value: string) => {
    clearFontHighlights();

    const allElements = Array.from(document.querySelectorAll("*")) as HTMLElement[];
    const shadowHost = document.getElementById("accessibility-inspector-extension-root");

    const matches = allElements.filter(el => {
      if (shadowHost && shadowHost.contains(el)) return false;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) return false;

      // Ensure we only highlight actual text nodes or form inputs, avoiding structural wrappers
      const tagName = el.tagName.toLowerCase();
      const isInput = tagName === "input" || tagName === "textarea" || tagName === "select";
      let hasDirectText = false;

      for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === 3 && node.textContent && node.textContent.trim().length > 0) {
          hasDirectText = true;
          break;
        }
      }

      if (!isInput && !hasDirectText) return false;

      try {
        const computed = window.getComputedStyle(el);
        if (type === "family") {
          const cleanFontName = value.toLowerCase().replace(/['"]/g, "");
          const cleanComputed = computed.fontFamily.toLowerCase().replace(/['"]/g, "");
          return cleanComputed.includes(cleanFontName);
        } else {
          return computed.fontSize === value;
        }
      } catch {
        return false;
      }
    });

    if (type === "family") {
      setHighlightedFont(value);
    } else {
      setHighlightedSize(value);
    }

    matches.forEach(el => {
      originalStylesRef.current.set(el, {
        outline: el.style.outline,
        outlineOffset: el.style.outlineOffset,
        boxShadow: el.style.boxShadow,
      });

      el.style.outline = "2px dashed #0082fa";
      el.style.outlineOffset = "2px";
      el.style.boxShadow = "0 0 8px rgba(0, 130, 250, 0.5)";
    });

    highlightedElementsRef.current = matches;
  };

  // Cleanup highlights on unmount or tab switch
  useEffect(() => {
    return () => {
      clearFontHighlights();
      clearColorHighlights();
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "fonts") {
      clearFontHighlights();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "colors" && selectedColor) {
      highlightColorElements(selectedColor);
    } else {
      clearColorHighlights();
    }
  }, [selectedColor, activeTab]);



  // Auto scan on load & when tab changes
  useEffect(() => {
    handleExtractPalette();
    handleScanFonts();
    handleScanImages();
  }, []);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1500);
  };

  // Eyedropper API handler
  const handleEyeDropper = () => {
    if (!("EyeDropper" in window)) {
      alert("EyeDropper API is not supported in this browser. Please use a Chromium-based browser (Chrome, Edge, Brave).");
      return;
    }
    if (onTriggerEyeDropper) {
      onTriggerEyeDropper();
    }
  };

  // Scan and Extract every color from full DOM
  const handleExtractPalette = () => {
    setIsScanningColors(true);
    const rawColors = scanPageColors();
    const hexPalette = extractPalette(rawColors);
    const cleanPalette = hexPalette.filter(Boolean);
    setTimeout(() => {
      setDominantPalette(cleanPalette);
      if (cleanPalette.length > 0) {
        setSelectedColor(cleanPalette[0]);
      }
      setIsScanningColors(false);
    }, 700);
  };

  // Scan page typography node-by-node
  const handleScanFonts = () => {
    setIsScanningFonts(true);
    const familyMap: Record<string, number> = {};
    const sizeMap: Record<string, number> = {};
    const elements = Array.from(document.querySelectorAll("body, body *"));
    const maxScan = Math.min(elements.length, 600);

    for (let i = 0; i < maxScan; i++) {
      const el = elements[i] as HTMLElement;
      if (!el || el.nodeType !== Node.ELEMENT_NODE) continue;

      let hasText = false;
      for (let j = 0; j < el.childNodes.length; j++) {
        const node = el.childNodes[j];
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue?.trim()) {
          hasText = true;
          break;
        }
      }

      if (hasText) {
        try {
          const style = window.getComputedStyle(el);
          const family = style.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
          const size = style.fontSize;

          if (family) familyMap[family] = (familyMap[family] || 0) + 1;
          if (size) sizeMap[size] = (sizeMap[size] || 0) + 1;
        } catch {
          // ignore styled errors
        }
      }
    }

    const families = Object.entries(familyMap)
      .map(([family, count]) => ({ family, count }))
      .sort((a, b) => b.count - a.count);

    const sizes = Object.entries(sizeMap)
      .map(([size, count]) => ({ size, count }))
      .sort((a, b) => (parseFloat(b.size) || 0) - (parseFloat(a.size) || 0));

    setTimeout(() => {
      setScannedFamilies(families);
      setScannedSizes(sizes);
      setIsScanningFonts(false);
    }, 700);
  };

  // Scan images and videos (media assets)
  const handleScanImages = () => {
    setIsScanningMedia(true);
    const mediaList: ScannedImage[] = [];
    const srcSet = new Set<string>();

    // 1. Scan video elements
    const videoElements = Array.from(document.querySelectorAll("video"));
    for (const vid of videoElements) {
      let src = vid.src;
      if (!src) {
        const sources = vid.querySelectorAll("source");
        for (const source of Array.from(sources)) {
          if (source.src) {
            src = source.src;
            break;
          }
        }
      }
      
      if (src && !src.startsWith("data:") && !srcSet.has(src)) {
        srcSet.add(src);
        mediaList.push({
          src,
          tagName: "video",
          alt: vid.getAttribute("aria-label") || vid.title || "Video Element",
          dimensions: {
            width: vid.videoWidth || vid.clientWidth || 0,
            height: vid.videoHeight || vid.clientHeight || 0,
          },
          type: "video"
        });
      }
    }

    // 2. Scan image elements
    const imgElements = Array.from(document.querySelectorAll("img"));
    for (const img of imgElements) {
      const src = img.src;
      if (src && !src.startsWith("data:") && !srcSet.has(src)) {
        srcSet.add(src);
        mediaList.push({
          src,
          tagName: "img",
          alt: img.alt || "No alternative text",
          dimensions: {
            width: img.naturalWidth || img.clientWidth || 0,
            height: img.naturalHeight || img.clientHeight || 0,
          },
          type: "image"
        });
      }
    }

    // 3. Scan element background images
    const allElements = Array.from(document.querySelectorAll("body, body *"));
    const maxBgCheck = Math.min(allElements.length, 300);
    for (let i = 0; i < maxBgCheck; i++) {
      const el = allElements[i] as HTMLElement;
      try {
        const style = window.getComputedStyle(el);
        const bgImg = style.backgroundImage;
        if (bgImg && bgImg !== "none") {
          const match = bgImg.match(/url\(['"]?(.*?)['"]?\)/);
          if (match && match[1] && !match[1].startsWith("data:") && !srcSet.has(match[1])) {
            srcSet.add(match[1]);
            mediaList.push({
              src: match[1],
              tagName: el.tagName.toLowerCase(),
              alt: "CSS Background Image",
              dimensions: {
                width: el.clientWidth || 0,
                height: el.clientHeight || 0,
              },
              type: "image"
            });
          }
        }
      } catch {
        // ignore styled errors
      }
    }

    setTimeout(() => {
      setScannedImages(mediaList);
      // Reset selection list on new scan
      setSelectedMediaSrcs(new Set());
      setIsScanningMedia(false);
    }, 700);
  };

  const toggleSelectMedia = (src: string) => {
    setSelectedMediaSrcs(prev => {
      const next = new Set(prev);
      if (next.has(src)) {
        next.delete(src);
      } else {
        next.add(src);
      }
      return next;
    });
  };

  const downloadMedia = async (src: string, type: "image" | "video", customFormat?: string, customQuality?: number) => {
    setDownloadingItems(prev => ({ ...prev, [src]: true }));
    try {
      const response = await new Promise<{ success: boolean; base64?: string; contentType?: string; error?: string }>((resolve) => {
        chrome.runtime.sendMessage({ action: "fetch-media", url: src }, resolve);
      });

      if (!response || !response.success || !response.base64) {
        throw new Error(response?.error || "Failed to fetch media resource from background context");
      }

      const binary = atob(response.base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const mimeType = response.contentType || (type === "video" ? "video/mp4" : "image/png");
      const blob = new Blob([bytes], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);

      const originalName = src.split("/").pop()?.split("?")[0] || (type === "video" ? "video.mp4" : "image.png");
      const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;

      const targetFormat = customFormat || downloadFormat;
      const targetQuality = customQuality !== undefined ? customQuality : downloadQuality;

      if (type === "video" || targetFormat === "original") {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = originalName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
      } else {
        const img = new window.Image();
        img.src = blobUrl;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });

        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 400;
        canvas.height = img.naturalHeight || img.height || 300;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          let formatMime = "image/png";
          let ext = ".png";
          if (targetFormat === "jpeg") {
            formatMime = "image/jpeg";
            ext = ".jpg";
            ctx.globalCompositeOperation = "destination-over";
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          } else if (targetFormat === "webp") {
            formatMime = "image/webp";
            ext = ".webp";
          }

          const exportDataUrl = canvas.toDataURL(formatMime, targetQuality);
          const a = document.createElement("a");
          a.href = exportDataUrl;
          a.download = `${baseName}${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
        URL.revokeObjectURL(blobUrl);
      }
    } catch (err) {
      console.error("Error downloading media:", err);
      alert(`Download failed for: ${src}\nError: ${err instanceof Error ? err.message : err}`);
    } finally {
      setDownloadingItems(prev => ({ ...prev, [src]: false }));
    }
  };

  const downloadSelectedMedia = async () => {
    const itemsToDownload = scannedImages.filter(item => selectedMediaSrcs.has(item.src));
    if (itemsToDownload.length === 0) {
      alert("No media items selected.");
      return;
    }

    for (const item of itemsToDownload) {
      await downloadMedia(item.src, item.type);
    }
  };

  // Harmony generators
  const harmonies = generateSuggestions(selectedColor);

  // Sync activeItemIndex bounds when locked items list changes
  useEffect(() => {
    if (activeItemIndex >= lockedItems.length) {
      setActiveItemIndex(Math.max(0, lockedItems.length - 1));
    }
  }, [lockedItems, activeItemIndex]);

  // Auto-focus the last added locked item
  const prevCountRef = React.useRef(lockedItems.length);
  useEffect(() => {
    if (lockedItems.length > prevCountRef.current) {
      setActiveItemIndex(lockedItems.length - 1);
    }
    prevCountRef.current = lockedItems.length;
  }, [lockedItems]);

  const activeItem = lockedItems[activeItemIndex] || null;
  const lockedStyles = activeItem ? activeItem.styles : null;

  // Contrast calculations for inspection card
  const contrastRatio = lockedStyles ? lockedStyles.contrastRatio : 1;
  const isLargeText = lockedStyles
    ? (parseFloat(lockedStyles.fontSize) >= 24 || (parseFloat(lockedStyles.fontSize) >= 18.6 && parseInt(lockedStyles.fontWeight, 10) >= 700))
    : false;

  const aaPassed = isLargeText ? contrastRatio >= 3.0 : contrastRatio >= 4.5;
  const aaaPassed = isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7.0;

  // Computed minimized logo coordinates
  const logoLeft = isDraggingLogo && logoDragPos
    ? logoDragPos.x
    : (dockEdge === "left" ? 0 : window.innerWidth - 48);
  const logoTop = isDraggingLogo && logoDragPos
    ? logoDragPos.y
    : logoY;

  return (
    <>
      {/* Minimized Logo Button */}
      <button
        onMouseDown={handleLogoMouseDown}
        style={{
          left: `${logoLeft}px`,
          top: `${logoTop}px`,
          transition: isDraggingLogo ? "none" : "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
          opacity: isMinimized && !hidden ? 1 : 0,
          pointerEvents: isMinimized && !hidden ? "auto" : "none",
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        className={`fixed z-[2000000] bg-slate-950/95 text-white shadow-2xl hover:bg-slate-900 cursor-grab active:cursor-grabbing group border-0 ${
          dockEdge === "left"
            ? "rounded-r-lg"
            : "rounded-l-lg"
        }`}
      >
        <img
          src={chrome.runtime.getURL("layers.png")}
          className="w-5 h-5 object-contain group-hover:scale-110 transition-transform pointer-events-none"
          alt="Logo"
        />
      </button>

      {/* Main Panel */}
      <div
        style={{
          top: `${position.y}px`,
          left: isMinimized
            ? (dockEdge === "right" ? `${window.innerWidth}px` : `-384px`)
            : `${position.x}px`,
          height: "calc(100vh - 32px)",
          transition: isDragging || hidden ? "none" : "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
          opacity: isMinimized || hidden ? 0 : 1,
          pointerEvents: isMinimized || hidden ? "none" : "auto",
        }}
        className="fixed w-96 bg-slate-950/95 backdrop-blur-md text-slate-100 rounded-lg border border-slate-800 shadow-2xl z-[2000000] flex flex-col overflow-hidden font-sans"
      >

      {/* Header Panel */}
      <div
        onMouseDown={handleMouseDown}
        className="p-4 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between cursor-move"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <img
            src={chrome.runtime.getURL("layers.png")}
            className="w-5 h-5 object-contain"
            alt="Logo"
          />
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-white">Frontend Dev Tool</h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Eyedropper API Button */}
          {"EyeDropper" in window && (
            <button
              onClick={handleEyeDropper}
              title="Pick pixel color from screen"
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
            >
              <Pipette className="w-4 h-4" />
            </button>
          )}
          {/* Inspector Toggle Switch */}
          <button
            onClick={() => setInspectorActive(!inspectorActive)}
            title={inspectorActive ? "Inspector On — click to disable" : "Inspector Off — click to enable"}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
              inspectorActive
                ? "bg-blue-600/20 border-blue-500/60 text-blue-300 hover:bg-blue-600/30"
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
            }`}
          >
            {/* Pill toggle track */}
            <span className={`relative inline-flex w-7 h-3.5 rounded-full transition-colors duration-200 flex-shrink-0 ${
              inspectorActive ? "bg-blue-500" : "bg-slate-700"
            }`}>
              <span className={`absolute top-0.5 left-0.5 w-2.5 h-2.5 rounded-full bg-white shadow transition-transform duration-200 ${
                inspectorActive ? "translate-x-3.5" : "translate-x-0"
              }`} />
            </span>
            <MousePointer className="w-3 h-3" />
          </button>
          {/* Minimize Button */}
          <button
            onClick={() => setIsMinimized(true)}
            title="Minimize Panel"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          {/* Close Button */}
          <button
            onClick={onClose}
            title="Close Extension Overlay"
            className="p-1.5 rounded-lg bg-red-950/50 border border-red-900/30 hover:bg-red-950/80 text-red-400 hover:text-red-300 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>



      {/* Tab Navigation */}
      <div className="flex border-b border-slate-900 bg-slate-950">
        <button
          onClick={() => setActiveTab("inspect")}
          className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex flex-col items-center gap-1 cursor-pointer ${activeTab === "inspect" ? "border-blue-500 text-blue-400 bg-slate-900/10" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
        >
          <MousePointer className="w-4 h-4" />
          <span>Inspect</span>
        </button>
        <button
          onClick={() => { setActiveTab("colors"); handleExtractPalette(); }}
          className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex flex-col items-center gap-1 cursor-pointer ${activeTab === "colors" ? "border-blue-500 text-blue-400 bg-slate-900/10" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
        >
          <Palette className="w-4 h-4" />
          <span>Colors</span>
        </button>
        <button
          onClick={() => { setActiveTab("fonts"); handleScanFonts(); }}
          className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex flex-col items-center gap-1 cursor-pointer ${activeTab === "fonts" ? "border-blue-500 text-blue-400 bg-slate-900/10" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
        >
          <Type className="w-4 h-4" />
          <span>Fonts</span>
        </button>
        <button
          onClick={() => { setActiveTab("images"); handleScanImages(); }}
          className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex flex-col items-center gap-1 cursor-pointer ${activeTab === "images" ? "border-blue-500 text-blue-400 bg-slate-900/10" : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
        >
          <Image className="w-4 h-4" />
          <span>Media</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4 relative">
        {(isScanningColors || isScanningFonts || isScanningMedia) && (
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[0.5px] z-[50] pointer-events-none overflow-hidden rounded-b-lg">
            {/* Elegant sweep scanline */}
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500/80 to-transparent shadow-[0_0_12px_rgba(59,130,246,1)] animate-sweep absolute left-0" />
            
            {/* Glowing tech scanner HUD info */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40">
              <div className="flex flex-col items-center gap-2 bg-slate-900/90 px-4 py-3 rounded-xl border border-slate-800/80 shadow-2xl backdrop-blur-md animate-pulse">
                <svg className="w-6 h-6 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[10px] uppercase tracking-widest text-slate-300 font-bold">Scanning Page...</span>
              </div>
            </div>
          </div>
        )}

        {/* INSPECT ELEMENT PANEL */}
        {activeTab === "inspect" && (
          lockedStyles ? (
            <div className="space-y-4 animate-fade-in">
              {/* Selected Elements — Vertical stacked list */}
              {lockedItems.length > 0 && (
                <div className="space-y-1 border-b border-slate-900 pb-3">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">
                    Selected Elements ({lockedItems.length})
                  </div>
                  <div className="flex flex-col gap-1">
                    {lockedItems.map((item, idx) => {
                      const isActive = idx === activeItemIndex;
                      const tagName = item.element.tagName.toLowerCase();
                      const classPart = item.element.className
                        ? typeof item.element.className === "string"
                          ? "." + item.element.className.trim().split(/\s+/).filter(Boolean).join(".")
                          : ""
                        : "";
                      const label = `${tagName}${classPart}`;
                      return (
                        <div
                          key={`tag-${idx}-${tagName}`}
                          onClick={() => setActiveItemIndex(idx)}
                          className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs font-mono transition-all border cursor-pointer ${
                            isActive
                              ? "bg-blue-600/20 border-blue-500 text-blue-400"
                              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                          }`}
                        >
                          <span className="truncate select-none flex-1" title={label}>
                            {label.length > 32 ? label.slice(0, 32) + "…" : label}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveLockedItem(item.element);
                            }}
                            className="text-slate-500 hover:text-red-400 cursor-pointer font-bold ml-2 shrink-0"
                            style={{ background: "none", border: "none", padding: 0 }}
                          >
                            &times;
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Element Heading Info */}
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-blue-400 font-mono">
                    &lt;{lockedStyles.tagName}&gt;
                  </span>
                  <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400 font-mono">
                    {lockedStyles.dimensions.width}px × {lockedStyles.dimensions.height}px
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono max-h-16 overflow-y-auto break-all">
                  {lockedStyles.className ? `.${lockedStyles.className.trim().split(/\s+/).join(".")}` : "No CSS classes"}
                </div>
              </div>

              {/* Typography Details */}
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 border-b border-slate-800 pb-1">
                  Typography Properties
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Font Size</div>
                    <div className="text-white font-mono">{lockedStyles.fontSize}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Font Weight</div>
                    <div className="text-white font-mono">{lockedStyles.fontWeight}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Line Height</div>
                    <div className="text-white font-mono">{lockedStyles.lineHeight}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Letter Spacing</div>
                    <div className="text-white font-mono">{lockedStyles.letterSpacing}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Font Family Chain</div>
                    <div className="text-white break-words text-[11px] font-mono mt-0.5">
                      {lockedStyles.fontFamily}
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout & Spacing Details */}
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 border-b border-slate-800 pb-1">
                  Layout & Spacing
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Padding</div>
                    <div className="text-white font-mono">{lockedStyles.padding}px</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Margin</div>
                    <div className="text-white font-mono">{lockedStyles.margin}px</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Gap</div>
                    <div className="text-white font-mono">{lockedStyles.gap || "normal"}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-semibold uppercase">Roundness</div>
                    <div className="text-white font-mono truncate" title={lockedStyles.borderRadius}>
                      {lockedStyles.borderRadius || "0px"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Details & WCAG Contrast */}
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-2.5">
                <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400 border-b border-slate-800 pb-1">
                  Colors & Contrast Ratio
                </h3>

                {/* Foreground & Background colors */}
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => {
                      const hex = rgbToHex(lockedStyles.textColorRGB);
                      setSelectedColor(hex);
                      setActiveTab("colors");
                    }}
                    className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition-all"
                  >
                    <div
                      className="w-6 h-6 rounded-md border border-slate-750 shrink-0"
                      style={{ backgroundColor: lockedStyles.color }}
                    />
                    <div className="overflow-hidden">
                      <div className="text-[8px] text-slate-500 font-bold uppercase">Text Color</div>
                      <div className="text-white font-mono text-[10px] truncate">{rgbToHex(lockedStyles.textColorRGB)}</div>
                    </div>
                  </div>

                  <div
                    onClick={() => {
                      const hex = rgbToHex(lockedStyles.bgColorRGB);
                      setSelectedColor(hex);
                      setActiveTab("colors");
                    }}
                    className="bg-slate-950 p-2 rounded-lg border border-slate-850 flex items-center gap-2 cursor-pointer hover:border-slate-700 transition-all"
                  >
                    <div
                      className="w-6 h-6 rounded-md border border-slate-750 shrink-0"
                      style={{ backgroundColor: rgbToHex(lockedStyles.bgColorRGB) }}
                    />
                    <div className="overflow-hidden">
                      <div className="text-[8px] text-slate-500 font-bold uppercase">Background</div>
                      <div className="text-white font-mono text-[10px] truncate">{rgbToHex(lockedStyles.bgColorRGB)}</div>
                    </div>
                  </div>
                </div>

                {/* WCAG Contrast Ratio Checker */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 flex items-center justify-between">
                  <div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">WCAG 2.1 Contrast</div>
                    <div className="text-lg font-black text-white font-mono">
                      {contrastRatio.toFixed(2)}:1
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-slate-500">AA</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${aaPassed ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30" : "bg-red-950 text-red-400 border border-red-900/30"
                        }`}>
                        {aaPassed ? "PASS" : "FAIL"}
                      </span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[8px] font-bold text-slate-500">AAA</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black ${aaaPassed ? "bg-emerald-950 text-emerald-400 border border-emerald-900/30" : "bg-red-950 text-red-400 border border-red-900/30"
                        }`}>
                        {aaaPassed ? "PASS" : "FAIL"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clear selected items actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onRemoveLockedItem(activeItem.element)}
                  className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 hover:text-white transition-all cursor-pointer"
                >
                  Clear Active Selection
                </button>
                {lockedItems.length > 1 && (
                  <button
                    onClick={onClearAllLocked}
                    className="py-2 px-3 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold text-xs rounded-xl border border-red-900/30 hover:text-red-350 transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-500">
              <MousePointer className="w-8 h-8 text-slate-700 mb-2 animate-bounce" />
              <p className="text-xs font-semibold text-slate-400">No element selected</p>
              <p className="text-[10px] mt-1">Activate the Hover Inspector, then hover and click on any element on the page to view detailed measurements.</p>
            </div>
          )
        )}

        {/* COLORS PANEL */}
        {activeTab === "colors" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Page Color Extractor
              </h3>
              <button
                onClick={handleExtractPalette}
                disabled={isScanningColors}
                className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-slate-850 text-blue-400 border border-slate-800 rounded font-semibold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {isScanningColors ? (
                  <>
                    <svg className="w-3 h-3 animate-spin text-blue-450" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Scanning...</span>
                  </>
                ) : (
                  "Rescan Page"
                )}
              </button>
            </div>

            {/* Dominant Palette List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-slate-500 font-bold uppercase">All Page Colors</div>
                {dominantPalette.length > 0 && (
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {dominantPalette.length} colors
                  </span>
                )}
              </div>
              {dominantPalette.length > 0 ? (
                <div className="pr-1">
                  <div className="grid grid-cols-5 gap-1.5">
                    {dominantPalette.map((color, i) => (
                      <div
                        key={i}
                        onClick={() => setSelectedColor(selectedColor === color ? "" : color)}
                        className={`group relative rounded-lg border p-0.5 bg-slate-900 cursor-pointer transition-all flex flex-col items-center ${selectedColor === color ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-800 hover:border-slate-700"
                          }`}
                      >
                        <div
                          className="w-full aspect-square rounded-md border border-slate-950"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-[7px] font-mono mt-0.5 text-slate-400 truncate w-full text-center">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No page colors resolved. Try rescanning.</p>
              )}
            </div>

            {/* Harmony Generator for Selected Swatch */}
            {selectedColor && (
              <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-slate-950" style={{ backgroundColor: selectedColor }} />
                    <span className="text-xs font-bold text-white font-mono">{selectedColor}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(selectedColor)}
                    className="p-1 rounded bg-slate-950 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-[10px]"
                  >
                    {copiedText === selectedColor ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === selectedColor ? "Copied" : "Copy"}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase">Generated Color Combinations</h4>
                  {harmonies.map((scheme, sIdx) => (
                    <div key={sIdx} className="space-y-1">
                      <div className="text-[9px] text-slate-400 font-semibold">{scheme.type}</div>
                      <div className="flex rounded-lg overflow-hidden h-7 border border-slate-950">
                        {scheme.colors.map((c, cIdx) => (
                          <div
                            key={cIdx}
                            style={{ backgroundColor: c }}
                            onClick={() => setSelectedColor(c)}
                            title={`Click to inspect: ${c}`}
                            className="flex-1 cursor-pointer hover:opacity-90 relative group/cell"
                          >
                            <span className="absolute inset-0 flex items-center justify-center text-[7px] text-white opacity-0 group-hover/cell:opacity-100 bg-black/40 font-mono transition-opacity">
                              {c}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FONTS PANEL */}
        {activeTab === "fonts" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Site Fonts & Sizes
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowContrastTooltips(!showContrastTooltips)}
                  className={`text-[10px] px-2 py-1 border rounded font-semibold cursor-pointer transition-all ${showContrastTooltips
                      ? "bg-emerald-950/40 border-emerald-600/80 text-emerald-400 font-bold"
                      : "bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800"
                    }`}
                >
                  {showContrastTooltips ? "Hide Contrast" : "Show Contrast"}
                </button>
                <button
                  onClick={handleScanFonts}
                  disabled={isScanningFonts}
                  className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-slate-850 text-blue-400 border border-slate-800 rounded font-semibold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
                >
                  {isScanningFonts ? (
                    <>
                      <svg className="w-3 h-3 animate-spin text-blue-450" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Scanning...</span>
                    </>
                  ) : (
                    "Rescan Page"
                  )}
                </button>
              </div>
            </div>

            {/* Font Families List */}
            <div className="space-y-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase flex justify-between items-center">
                <span>Detected Font Families</span>
                {(highlightedFont || highlightedSize) && (
                  <button
                    onClick={clearFontHighlights}
                    className="text-[9px] text-red-400 hover:text-red-300 font-bold cursor-pointer transition-all border-none bg-transparent"
                  >
                    Clear Highlights
                  </button>
                )}
              </div>
              {scannedFamilies.length > 0 ? (
                <div className="space-y-1.5 pr-0.5">
                  {scannedFamilies.map((font, idx) => {
                    const isHighlighted = highlightedFont === font.family;
                    return (
                      <div
                        key={`family-${idx}-${font.family}`}
                        onClick={() => {
                          if (isHighlighted) {
                            clearFontHighlights();
                          } else {
                            highlightFontProperty("family", font.family);
                          }
                        }}
                        className={`px-3 py-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${isHighlighted
                            ? "bg-blue-950/35 border-blue-500/80 shadow-md shadow-blue-500/10"
                            : "bg-slate-900/50 border-slate-850 hover:border-slate-800"
                          }`}
                      >
                        <div className="font-mono text-xs text-white truncate max-w-[200px]" style={{ fontFamily: font.family }}>
                          {font.family}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {isHighlighted && (
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-black tracking-wider uppercase">
                              Active
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-slate-400 font-semibold font-mono">
                            {font.count}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No font families detected. Run rescan.</p>
              )}
            </div>

            {/* Font Sizes List */}
            <div className="space-y-2 pt-2">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Detected Font Sizes</div>
              {scannedSizes.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 pr-0.5">
                  {scannedSizes.slice(0, 14).map((size, idx) => {
                    const isHighlighted = highlightedSize === size.size;
                    return (
                      <div
                        key={`size-${idx}-${size.size}`}
                        onClick={() => {
                          if (isHighlighted) {
                            clearFontHighlights();
                          } else {
                            highlightFontProperty("size", size.size);
                          }
                        }}
                        className={`px-2 py-1.5 rounded-lg border flex items-center justify-between font-mono text-xs cursor-pointer transition-all ${isHighlighted
                            ? "bg-blue-950/35 border-blue-500/80 shadow-md shadow-blue-500/10"
                            : "bg-slate-900/50 border-slate-850 hover:border-slate-800"
                          }`}
                      >
                        <span className="text-white font-bold">{size.size}</span>
                        <div className="flex items-center gap-1">
                          {isHighlighted && (
                            <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded font-black">
                              ON
                            </span>
                          )}
                          <span className="text-[9px] text-slate-500">{size.count}×</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No font sizes detected.</p>
              )}
            </div>
          </div>
        )}

        {/* MEDIA PANEL (IMAGES & VIDEOS) */}
        {activeTab === "images" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Media Asset Extractor
              </h3>
              <button
                onClick={handleScanImages}
                disabled={isScanningMedia}
                className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-slate-850 text-blue-400 border border-slate-800 rounded font-semibold cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1"
              >
                {isScanningMedia ? (
                  <>
                    <svg className="w-3 h-3 animate-spin text-blue-450" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Scanning...</span>
                  </>
                ) : (
                  "Rescan Page"
                )}
              </button>
            </div>

            {/* Download Settings (Format, Quality, Bulk Action) */}
            {scannedImages.length > 0 && (
              <div className="py-3 rounded-xl space-y-3">
                {/* Row 1: Heading */}
                <div className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  Download Options
                </div>

                {/* Row 2: Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (selectedMediaSrcs.size === scannedImages.length) {
                        setSelectedMediaSrcs(new Set());
                      } else {
                        setSelectedMediaSrcs(new Set(scannedImages.map(item => item.src)));
                      }
                    }}
                    className="flex-1 text-[10px] text-slate-200 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 py-1.5 rounded-lg cursor-pointer transition-all font-semibold text-center"
                  >
                    {selectedMediaSrcs.size === scannedImages.length ? "Deselect All" : "Select All"}
                  </button>
                  <button
                    onClick={downloadSelectedMedia}
                    disabled={selectedMediaSrcs.size === 0}
                    className={`flex-1 text-[10px] py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      selectedMediaSrcs.size > 0
                        ? "bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 shadow-md shadow-blue-500/10"
                        : "bg-slate-900/40 border border-slate-850 text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    Download Selected ({selectedMediaSrcs.size})
                  </button>
                </div>

                {/* Row 3: Format & Quality Controls */}
                <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-900/50 pt-2.5">
                  {/* Format selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-semibold uppercase pb-1">Convert Format</label>
                    <select
                      value={downloadFormat}
                      onChange={(e) => setDownloadFormat(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-1.5 py-1 outline-none cursor-pointer text-[10px]"
                    >
                      <option value="original">Original Format</option>
                      <option value="png">PNG Format</option>
                      <option value="jpeg">JPEG Format</option>
                      <option value="webp">WebP Format</option>
                    </select>
                  </div>

                  {/* Quality selector */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-slate-500 font-semibold uppercase pb-1">Quality Preset</label>
                    <select
                      value={downloadQuality}
                      onChange={(e) => setDownloadQuality(parseFloat(e.target.value))}
                      disabled={downloadFormat === "original"}
                      className={`w-full bg-slate-950 border border-slate-800 text-slate-300 rounded px-1.5 py-1 outline-none cursor-pointer text-[10px] ${
                        downloadFormat === "original" ? "opacity-40 cursor-not-allowed" : ""
                      }`}
                    >
                      <option value="1.0">High (100% Quality)</option>
                      <option value="0.7">Medium (70% Quality)</option>
                      <option value="0.4">Low (40% Quality)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Scanned Media Grid */}
            {scannedImages.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 pr-1">
                {scannedImages.map((img, idx) => {
                  const isSelected = selectedMediaSrcs.has(img.src);
                  const isDownloading = downloadingItems[img.src];
                  return (
                    <div
                      key={idx}
                      className={`bg-slate-900/50 rounded-xl overflow-hidden flex flex-col transition-all group relative ${
                        isSelected ? "ring-2 ring-blue-500 bg-slate-900/70" : ""
                      }`}
                    >
                      {/* Selection Checkbox (Hover-controlled) */}
                      <button
                        onClick={() => toggleSelectMedia(img.src)}
                        className={`absolute top-2 left-2 z-30 w-5 h-5 rounded border flex items-center justify-center cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-blue-600 border-blue-500 text-white opacity-100 scale-100"
                            : "bg-slate-950/80 border-slate-700 hover:border-slate-500 text-transparent opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100"
                        }`}
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                      </button>

                      {/* Thumbnail Frame */}
                      <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-900 relative">
                        {img.type === "video" ? (
                          <video
                            src={img.src}
                            className="max-w-full max-h-full object-contain"
                            preload="metadata"
                            muted
                            playsInline
                            onMouseEnter={(e) => {
                              (e.target as HTMLVideoElement).play().catch(() => {});
                            }}
                            onMouseLeave={(e) => {
                              (e.target as HTMLVideoElement).pause();
                            }}
                          />
                        ) : (
                          <img
                            src={img.src}
                            alt={img.alt}
                            className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        )}
                        {/* Hover Overlay Buttons */}
                        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
                          <a
                            href={img.src}
                            target="_blank"
                            rel="noreferrer"
                            title="Open in new tab"
                            className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => downloadMedia(img.src, img.type)}
                            disabled={isDownloading}
                            title={isDownloading ? "Downloading..." : "Download file"}
                            className="p-2 rounded-lg bg-blue-600 border border-blue-500 hover:bg-blue-500 text-white transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isDownloading ? (
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Media Stats */}
                      <div className="p-2 text-[9px] font-mono flex items-center justify-between text-slate-400">
                        <span className="truncate max-w-[70%] font-semibold text-slate-300" title={img.src}>
                          {img.src.split("/").pop()?.split("?")[0] || img.type}
                        </span>
                        <span className="font-semibold text-slate-500 shrink-0 pl-2">
                          {img.dimensions.width > 0 && img.dimensions.height > 0
                            ? `${img.dimensions.width}×${img.dimensions.height}`
                            : img.type === "video"
                            ? "Video"
                            : "Auto"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500">
                <Image className="w-8 h-8 text-slate-850 mb-1" />
                <span className="text-xs">No media assets located</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer Info + Quick Inspector Toggle */}
      <div className="p-2.5 border-t border-slate-900 bg-slate-950 flex items-center justify-between text-[8px] text-slate-500 tracking-wider uppercase font-mono">
        <span>Active Tab: {activeTab}</span>

        {/* Floating Inspector Status Pill */}
        <button
          onClick={() => setInspectorActive(!inspectorActive)}
          title={inspectorActive ? "Inspector On — click to disable" : "Inspector Off — click to enable"}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
            inspectorActive
              ? "bg-blue-950/60 border-blue-700/60 text-blue-300 hover:bg-blue-900/50"
              : "bg-slate-900/80 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
          }`}
        >
          {/* Live status dot */}
          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
            inspectorActive ? "bg-blue-400 animate-pulse" : "bg-slate-700"
          }`} />
          Inspector {inspectorActive ? "On" : "Off"}
        </button>
      </div>

    </div>
    </>
  );
};
