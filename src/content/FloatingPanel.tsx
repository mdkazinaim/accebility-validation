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
  Sparkles,
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
}) => {
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Color tab state
  const [dominantPalette, setDominantPalette] = useState<string[]>([]);
  const [selectedColorState, setSelectedColorState] = useState<string>("#3B82F6");

  const normalizeToHex = (colorStr: string): string => {
    if (!colorStr) return "#3B82F6";
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
    setSelectedColorState(normalizeToHex(color));
  };
  const selectedColor = selectedColorState;

  // Fonts tab state
  const [scannedFamilies, setScannedFamilies] = useState<ScannedFont[]>([]);
  const [scannedSizes, setScannedSizes] = useState<ScannedFontSize[]>([]);

  // Images tab state
  const [scannedImages, setScannedImages] = useState<ScannedImage[]>([]);

  // Font highlighting state and refs
  const [highlightedFont, setHighlightedFont] = useState<string | null>(null);
  const [highlightedSize, setHighlightedSize] = useState<string | null>(null);
  const highlightedElementsRef = useRef<HTMLElement[]>([]);
  const originalStylesRef = useRef<Map<HTMLElement, { outline: string; outlineOffset: string; boxShadow: string }>>(new Map());

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
    };
  }, []);

  useEffect(() => {
    if (activeTab !== "fonts") {
      clearFontHighlights();
    }
  }, [activeTab]);

  // Listen to native EyeDropper events from ContentApp
  useEffect(() => {
    const handleEyedropperColor = (e: Event) => {
      const color = (e as CustomEvent).detail;
      if (color) {
        setSelectedColor(color);
      }
    };
    window.addEventListener("eyedropper-color-selected", handleEyedropperColor);
    return () => {
      window.removeEventListener("eyedropper-color-selected", handleEyedropperColor);
    };
  }, []);

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
  const handleEyeDropper = async () => {
    if (!("EyeDropper" in window)) {
      alert("EyeDropper API is not supported in this browser. Please use a Chromium-based browser (Chrome, Edge, Brave).");
      return;
    }

    // Temporarily turn off hover inspector if active to prevent conflict
    const wasInspectorActive = inspectorActive;
    if (wasInspectorActive) setInspectorActive(false);

    // Inject styles to temporarily disable hover states on page elements
    const styleEl = document.createElement("style");
    styleEl.id = "accessibility-inspector-eyedropper-style";
    styleEl.textContent = `
      *:not(#accessibility-inspector-extension-root) {
        pointer-events: none !important;
      }
    `;
    document.head.appendChild(styleEl);

    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result && result.sRGBHex) {
        setSelectedColor(result.sRGBHex);
        setActiveTab("colors");
        setIsMinimized(false);
      }
    } catch (e) {
      console.warn("EyeDropper aborted:", e);
    } finally {
      // Remove injected styles
      const targetStyle = document.getElementById("accessibility-inspector-eyedropper-style");
      if (targetStyle) targetStyle.remove();

      if (wasInspectorActive) setInspectorActive(true);
    }
  };

  // Scan and Extract dominant palette
  const handleExtractPalette = () => {
    const rawColors = scanPageColors();
    const hexPalette = extractPalette(rawColors, 8);
    const cleanPalette = hexPalette.filter(Boolean);
    setDominantPalette(cleanPalette);
    if (cleanPalette.length > 0) {
      setSelectedColor(cleanPalette[0]);
    }
  };

  // Scan page typography node-by-node
  const handleScanFonts = () => {
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

    setScannedFamilies(families);
    setScannedSizes(sizes);
  };

  // Scan images
  const handleScanImages = () => {
    const images: ScannedImage[] = [];
    const srcSet = new Set<string>();

    // Scan image elements
    const imgElements = Array.from(document.querySelectorAll("img"));
    for (const img of imgElements) {
      const src = img.src;
      if (src && !src.startsWith("data:") && !srcSet.has(src)) {
        srcSet.add(src);
        images.push({
          src,
          tagName: "img",
          alt: img.alt || "No alternative text",
          dimensions: {
            width: img.naturalWidth || img.clientWidth || 0,
            height: img.naturalHeight || img.clientHeight || 0,
          }
        });
      }
    }

    // Scan element background images
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
            images.push({
              src: match[1],
              tagName: el.tagName.toLowerCase(),
              alt: "CSS Background Image",
              dimensions: {
                width: el.clientWidth || 0,
                height: el.clientHeight || 0,
              }
            });
          }
        }
      } catch {
        // ignore styled errors
      }
    }

    setScannedImages(images);
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
          opacity: isMinimized ? 1 : 0,
          pointerEvents: isMinimized ? "auto" : "none",
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
        className={`fixed z-[2000000] bg-slate-950/95 text-white shadow-2xl hover:bg-slate-900 border border-slate-800 cursor-grab active:cursor-grabbing group ${
          dockEdge === "left"
            ? "rounded-r-2xl border-l-0"
            : "rounded-l-2xl border-r-0"
        }`}
      >
        <Sparkles className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform pointer-events-none" />
      </button>

      {/* Main Panel */}
      <div
        style={{
          top: `${position.y}px`,
          left: isMinimized
            ? (dockEdge === "right" ? `${window.innerWidth}px` : `-384px`)
            : `${position.x}px`,
          height: "calc(100vh - 32px)",
          transition: isDragging ? "none" : "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
          opacity: isMinimized ? 0 : 1,
          pointerEvents: isMinimized ? "none" : "auto",
        }}
        className="fixed w-96 bg-slate-950/95 backdrop-blur-md text-slate-100 rounded-2xl border border-slate-800 shadow-2xl z-[2000000] flex flex-col overflow-hidden font-sans"
      >

      {/* Header Panel */}
      <div
        onMouseDown={handleMouseDown}
        className="p-4 border-b border-slate-900 bg-slate-900/30 flex items-center justify-between cursor-move"
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-white">Visual Inspector</h2>
            <p className="text-[10px] text-slate-400">Design & Accessibility Scanner</p>
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

      {/* Main Controls - Hover Inspector State (Always Visible) */}
      <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-900 flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-300">Hover Inspector</span>
          <span className="text-[10px] text-slate-500">
            {inspectorActive ? "Click element to inspect properties" : "Activate to hover and inspect styles"}
          </span>
        </div>
        <button
          onClick={() => setInspectorActive(!inspectorActive)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md ${inspectorActive
              ? "bg-blue-600 hover:bg-blue-700 text-white ring-2 ring-blue-400/20"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
            }`}
        >
          <MousePointer className={`w-3.5 h-3.5 ${inspectorActive ? "animate-bounce" : ""}`} />
          {inspectorActive ? "Active" : "Disabled"}
        </button>
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
          <span>Images</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">

        {/* INSPECT ELEMENT PANEL */}
        {activeTab === "inspect" && (
          lockedStyles ? (
            <div className="space-y-4 animate-fade-in">
              {/* Selected Elements Horizontal Selector Strip */}
              {lockedItems.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                    Selected Elements ({lockedItems.length})
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-slate-900 scrollbar-thin scrollbar-thumb-slate-850">
                    {lockedItems.map((item, idx) => {
                      const isActive = idx === activeItemIndex;
                      const tagName = item.element.tagName.toLowerCase();
                      const classPart = item.element.className
                        ? typeof item.element.className === "string"
                          ? "." + item.element.className.trim().split(/\s+/)[0]
                          : ""
                        : "";
                      return (
                        <div
                          key={`tag-${idx}-${tagName}`}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-all border shrink-0 ${isActive
                              ? "bg-blue-600/20 border-blue-500 text-blue-400 font-bold"
                              : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200"
                            }`}
                        >
                          <span
                            onClick={() => setActiveItemIndex(idx)}
                            className="cursor-pointer select-none"
                          >
                            {tagName}{classPart.length > 12 ? classPart.slice(0, 12) + "..." : classPart}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveLockedItem(item.element);
                            }}
                            className="text-slate-500 hover:text-red-400 cursor-pointer font-bold ml-1"
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
                className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-slate-850 text-blue-400 border border-slate-800 rounded font-semibold cursor-pointer transition-all"
              >
                Rescan Page
              </button>
            </div>

            {/* Dominant Palette List */}
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase mb-2">Dominant Colors (K-Means Centroids)</div>
              {dominantPalette.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {dominantPalette.map((color, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedColor(color)}
                      className={`group relative rounded-xl border p-1 bg-slate-900 cursor-pointer transition-all flex flex-col items-center ${selectedColor === color ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-800 hover:border-slate-700"
                        }`}
                    >
                      <div
                        className="w-full aspect-square rounded-lg border border-slate-950"
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-[8px] font-mono mt-1 text-slate-400 truncate w-full text-center">
                        {color}
                      </span>
                    </div>
                  ))}
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
                  className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-slate-850 text-blue-400 border border-slate-800 rounded font-semibold cursor-pointer transition-all"
                >
                  Rescan Page
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
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
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
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar pr-0.5">
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

        {/* IMAGES PANEL */}
        {activeTab === "images" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <h3 className="text-xs font-bold tracking-wider uppercase text-slate-400">
                Image Asset Extractor
              </h3>
              <button
                onClick={handleScanImages}
                className="text-[10px] px-2 py-1 bg-slate-900 hover:bg-slate-850 text-blue-400 border border-slate-800 rounded font-semibold cursor-pointer transition-all"
              >
                Rescan Page
              </button>
            </div>

            {/* Scanned Image Grid */}
            {scannedImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                {scannedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-900/50 rounded-xl border border-slate-850 overflow-hidden flex flex-col hover:border-slate-800 transition-all group relative"
                  >
                    {/* Thumbnail Frame */}
                    <div className="aspect-video bg-slate-950 flex items-center justify-center overflow-hidden border-b border-slate-900 relative">
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      {/* Hover Overlay Button to Open Image */}
                      <a
                        href={img.src}
                        target="_blank"
                        rel="noreferrer"
                        title="Open image in new tab"
                        className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 cursor-pointer"
                      >
                        <ExternalLink className="w-5 h-5 text-blue-400" />
                      </a>
                    </div>
                    {/* Image Stats */}
                    <div className="p-2 space-y-0.5 text-[9px] font-mono">
                      <div className="text-slate-400 truncate" title={img.src}>
                        {img.src.split("/").pop()}
                      </div>
                      <div className="text-slate-500 flex justify-between">
                        <span>Tag: &lt;{img.tagName}&gt;</span>
                        <span className="font-bold text-slate-400">
                          {img.dimensions.width}×{img.dimensions.height}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500">
                <Image className="w-8 h-8 text-slate-850 mb-1" />
                <span className="text-xs">No image assets located</span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-900 bg-slate-950 flex items-center justify-between text-[8px] text-slate-500 tracking-wider uppercase font-mono">
        <span>Active Tab: {activeTab}</span>
        <span>Version 1.0.0</span>
      </div>

    </div>
    </>
  );
};
