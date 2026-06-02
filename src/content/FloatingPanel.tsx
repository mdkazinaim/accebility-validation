import React, { useState, useEffect } from "react";
import { 
  X, 
  MousePointer, 
  Type, 
  Palette, 
  Sparkles, 
  Image as ImageIcon,
  Pipette,
  Copy,
  ExternalLink,
  RefreshCw,
  Download
} from "lucide-react";
import { ElementStyles } from "./styleExtractor";
import { extractPalette, generateSuggestions, rgbToHex, scanPageColors } from "./kmeans";

interface FloatingPanelProps {
  inspectorActive: boolean;
  setInspectorActive: (active: boolean) => void;
  lockedElement: HTMLElement | null;
  lockedStyles: ElementStyles | null;
  onClearLocked: () => void;
  onClose: () => void;
}

export interface FontStat {
  family: string;
  sizes: string[];
  count: number;
}

export interface ExtractedImage {
  src: string;
  alt: string;
  tagName: string;
  dimensions: string;
  type: "img" | "background";
}

export const FloatingPanel: React.FC<FloatingPanelProps> = ({
  inspectorActive,
  setInspectorActive,
  lockedElement,
  lockedStyles,
  onClearLocked,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"colors" | "fonts" | "images">("colors");
  const [dominantPalette, setDominantPalette] = useState<string[]>([]);
  const [extractedFonts, setExtractedFonts] = useState<FontStat[]>([]);
  const [extractedImages, setExtractedImages] = useState<ExtractedImage[]>([]);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [pickedColor, setPickedColor] = useState<string | null>(null);

  // Copy helper with robust textarea fallback
  const handleCopy = (text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text)
          .then(() => {
            setCopiedText("Copied: " + (text.length > 25 ? text.substring(0, 22) + "..." : text));
            setTimeout(() => setCopiedText(null), 1500);
          })
          .catch(() => {
            fallbackCopy(text);
          });
      } else {
        fallbackCopy(text);
      }
    } catch {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, 99999);
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedText("Copied: " + (text.length > 25 ? text.substring(0, 22) + "..." : text));
      setTimeout(() => setCopiedText(null), 1500);
    } catch (err) {
      console.warn("Failed to copy using fallback:", err);
    }
  };

  // Convert image URL to canvas blob
  const convertImage = (url: string, format: "image/png" | "image/jpeg" | "image/webp"): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas context creation failed"));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Blob conversion failed"));
          }
        }, format, 0.9);
      };
      img.onerror = () => reject(new Error("Failed to load image resource"));
      img.src = url;
    });
  };

  // Copy image as binary PNG to clipboard
  const handleCopyImageBinary = async (url: string) => {
    try {
      setCopiedText("Generating image binary...");
      const blob = await convertImage(url, "image/png");
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob
        })
      ]);
      setCopiedText("Image copied to clipboard!");
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.warn("Failed to copy image binary:", err);
      // Fallback: Copy URL and inform
      handleCopy(url);
      setCopiedText("CORS blocked binary. URL copied!");
      setTimeout(() => setCopiedText(null), 3000);
    }
  };

  // Download image in selected format (PNG, JPEG, WebP)
  const handleDownloadImage = async (url: string, formatName: "PNG" | "JPEG" | "WebP") => {
    const mimeType = formatName === "PNG" ? "image/png" : formatName === "JPEG" ? "image/jpeg" : "image/webp";
    const extension = formatName.toLowerCase();
    try {
      setCopiedText(`Preparing ${formatName} download...`);
      const blob = await convertImage(url, mimeType);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      
      let filename = "extracted_image." + extension;
      try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split("/");
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart && lastPart.includes(".")) {
          filename = lastPart.substring(0, lastPart.lastIndexOf(".")) + "." + extension;
        }
      } catch {}
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setCopiedText(`Downloaded as ${formatName}!`);
      setTimeout(() => setCopiedText(null), 1500);
    } catch (err) {
      console.warn("Failed to download converted image:", err);
      // Direct download fallback
      const a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.download = "downloaded_image";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setCopiedText("Downloaded source image directly!");
      setTimeout(() => setCopiedText(null), 2000);
    }
  };

  // Extract Page Color Palette (K-Means)
  const handleExtractPalette = () => {
    try {
      const rawColors = scanPageColors();
      const hexPalette = extractPalette(rawColors, 8, 6);
      const cleanPalette = Array.from(new Set(hexPalette)).filter(Boolean);
      setDominantPalette(cleanPalette);
    } catch (e) {
      console.warn("Failed to extract color palette:", e);
    }
  };

  // Scan distinct Fonts
  const handleScanFonts = () => {
    try {
      const elements = Array.from(document.querySelectorAll("body *")) as HTMLElement[];
      const fontMap: Record<string, { sizes: Set<string>; count: number }> = {};
      
      // Sample elements for performance
      const sampleSize = Math.min(elements.length, 1200);
      for (let i = 0; i < sampleSize; i++) {
        const el = elements[i];
        try {
          const style = window.getComputedStyle(el);
          const familyStr = style.fontFamily;
          if (!familyStr) continue;
          const family = familyStr.split(",")[0].trim().replace(/['"]/g, "");
          if (!family || family === "inherit" || family === "initial") continue;
          
          const size = style.fontSize;
          
          if (!fontMap[family]) {
            fontMap[family] = { sizes: new Set(), count: 0 };
          }
          if (size) {
            fontMap[family].sizes.add(size);
          }
          fontMap[family].count++;
        } catch {
          // ignore styling errors
        }
      }

      const stats = Object.keys(fontMap).map(family => ({
        family,
        sizes: Array.from(fontMap[family].sizes).sort((a,b) => parseFloat(a) - parseFloat(b)),
        count: fontMap[family].count
      })).sort((a,b) => b.count - a.count);

      setExtractedFonts(stats);
    } catch (e) {
      console.warn("Failed to scan fonts:", e);
    }
  };

  // Scan page Images
  const handleScanImages = () => {
    try {
      const list: ExtractedImage[] = [];
      const srcSet = new Set<string>();

      // 1. Fetch img elements
      const imgElements = Array.from(document.querySelectorAll("img")) as HTMLImageElement[];
      imgElements.forEach((img) => {
        const src = img.src;
        if (src && !src.startsWith("data:") && !srcSet.has(src)) {
          srcSet.add(src);
          list.push({
            src,
            alt: img.alt || "No description",
            tagName: "img",
            dimensions: `${img.naturalWidth || img.width || 0} × ${img.naturalHeight || img.height || 0} px`,
            type: "img"
          });
        }
      });

      // 2. Fetch CSS background-image elements
      const elements = Array.from(document.querySelectorAll("body *")) as HTMLElement[];
      const sampleSize = Math.min(elements.length, 1200);
      for (let i = 0; i < sampleSize; i++) {
        const el = elements[i];
        try {
          const style = window.getComputedStyle(el);
          const bgImg = style.backgroundImage;
          if (bgImg && bgImg.startsWith("url(") && bgImg !== "none") {
            const match = bgImg.match(/url\(['"]?([^'"]+)['"]?\)/);
            if (match && match[1]) {
              const src = match[1];
              if (!src.startsWith("data:") && !srcSet.has(src)) {
                srcSet.add(src);
                const rect = el.getBoundingClientRect();
                list.push({
                  src,
                  alt: "CSS Background Image",
                  tagName: el.tagName.toLowerCase(),
                  dimensions: `${Math.round(rect.width)} × ${Math.round(rect.height)} px`,
                  type: "background"
                });
              }
            }
          }
        } catch {
          // ignore errors
        }
      }

      setExtractedImages(list.slice(0, 48));
    } catch (e) {
      console.warn("Failed to scan images:", e);
    }
  };

  // Scan dynamically on tab toggle
  useEffect(() => {
    if (activeTab === "colors" && dominantPalette.length === 0) {
      handleExtractPalette();
    } else if (activeTab === "fonts" && extractedFonts.length === 0) {
      handleScanFonts();
    } else if (activeTab === "images" && extractedImages.length === 0) {
      handleScanImages();
    }
  }, [activeTab]);

  // Color picker (EyeDropper API) trigger
  const handleColorPicker = async () => {
    if (!("EyeDropper" in window)) {
      setCopiedText("EyeDropper API is not supported. Please use Chrome, Edge, or Brave.");
      setTimeout(() => setCopiedText(null), 3500);
      return;
    }
    try {
      const dropper = new (window as any).EyeDropper();
      const result = await dropper.open();
      const hex = result.sRGBHex;
      setPickedColor(hex);
      handleCopy(hex);
    } catch {
      // User cancelled
    }
  };

  // Locked details values
  const contrastRatio = lockedStyles ? lockedStyles.contrastRatio : 1;
  const isLargeText = lockedStyles 
    ? (parseFloat(lockedStyles.fontSize) >= 24 || (parseFloat(lockedStyles.fontSize) >= 18.6 && parseInt(lockedStyles.fontWeight, 10) >= 700))
    : false;

  const aaPassed = isLargeText ? contrastRatio >= 3.0 : contrastRatio >= 4.5;
  const aaaPassed = isLargeText ? contrastRatio >= 4.5 : contrastRatio >= 7.0;

  const selectedHexColor = lockedStyles ? rgbToHex(lockedStyles.textColorRGB) : "#3b82f6";
  const suggestions = generateSuggestions(selectedHexColor);

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        width: "380px",
        height: "calc(100vh - 40px)",
        backgroundColor: "#0f172a",
        color: "#f8fafc",
        borderRadius: "16px",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
        zIndex: 999999,
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        overflow: "hidden",
        border: "1px solid #1e293b",
        userSelect: "none",
      }}
    >
      {/* 1. Header (Main Menu area) */}
      <div
        style={{
          padding: "16px",
          borderBottom: "1px solid #1e293b",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#1e293b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Sparkles style={{ color: "#3b82f6", width: "18px", height: "18px" }} />
          <h2 style={{ fontSize: "13px", fontWeight: 700, margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Design Inspector
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <X style={{ width: "18px", height: "18px" }} />
        </button>
      </div>

      {/* 2. Interactive Tool Controls */}
      <div 
        style={{ 
          padding: "12px 16px", 
          borderBottom: "1px solid #1e293b", 
          display: "flex", 
          gap: "8px", 
          backgroundColor: "#111827" 
        }}
      >
        <button
          onClick={() => setInspectorActive(!inspectorActive)}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            backgroundColor: inspectorActive ? "#3b82f6" : "#334155",
            color: "#ffffff",
            transition: "all 0.15s ease",
          }}
        >
          <MousePointer style={{ width: "14px", height: "14px" }} />
          {inspectorActive ? "Inspecting..." : "Start Inspector"}
        </button>
        
        {lockedElement && (
          <button
            onClick={onClearLocked}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: "1px solid #334155",
              backgroundColor: "transparent",
              color: "#94a3b8",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* 3. Navigation Tabs */}
      <div style={{ display: "flex", backgroundColor: "#0b0f19", borderBottom: "1px solid #1e293b" }}>
        {(["colors", "fonts", "images"] as const).map((tab) => {
          const Icon = tab === "colors" ? Palette : tab === "fonts" ? Type : ImageIcon;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "12px 0",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
                border: "none",
                background: "none",
                color: activeTab === tab ? "#3b82f6" : "#64748b",
                borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                transition: "color 0.15s ease",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <Icon style={{ width: "12px", height: "12px" }} />
              {tab}
            </button>
          );
        })}
      </div>

      {/* 4. Scrollable Container for Extractors */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        
        {/* TAB: COLORS */}
        {activeTab === "colors" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Locked element colors */}
            {lockedStyles ? (
              <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontSize: "11px", color: "#3b82f6", fontWeight: "bold" }}>
                  <Palette style={{ width: "12px", height: "12px" }} />
                  <span>SELECTED ELEMENT COLORS</span>
                </div>
                
                {/* Swatches */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <div 
                    onClick={() => handleCopy(rgbToHex(lockedStyles.textColorRGB))}
                    style={{ 
                      flex: 1, 
                      backgroundColor: "#0f172a", 
                      padding: "8px", 
                      borderRadius: "6px", 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <div 
                      style={{ 
                        width: "16px", 
                        height: "16px", 
                        borderRadius: "4px", 
                        backgroundColor: rgbToHex(lockedStyles.textColorRGB),
                        border: "1px solid rgba(255,255,255,0.1)"
                      }} 
                    />
                    <div>
                      <div style={{ fontSize: "8px", color: "#64748b" }}>TEXT</div>
                      <div style={{ fontSize: "10px", fontWeight: 600 }}>{rgbToHex(lockedStyles.textColorRGB)}</div>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleCopy(rgbToHex(lockedStyles.bgColorRGB))}
                    style={{ 
                      flex: 1, 
                      backgroundColor: "#0f172a", 
                      padding: "8px", 
                      borderRadius: "6px", 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <div 
                      style={{ 
                        width: "16px", 
                        height: "16px", 
                        borderRadius: "4px", 
                        backgroundColor: rgbToHex(lockedStyles.bgColorRGB),
                        border: "1px solid rgba(255,255,255,0.1)"
                      }} 
                    />
                    <div>
                      <div style={{ fontSize: "8px", color: "#64748b" }}>BACK</div>
                      <div style={{ fontSize: "10px", fontWeight: 600 }}>{rgbToHex(lockedStyles.bgColorRGB)}</div>
                    </div>
                  </div>
                </div>

                {/* Contrast Score */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0f172a", padding: "8px", borderRadius: "6px" }}>
                  <div>
                    <span style={{ fontSize: "8px", color: "#64748b", display: "block" }}>WCAG CONTRAST</span>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: aaPassed ? "#10b981" : "#ef4444" }}>
                      {contrastRatio.toFixed(2)}:1
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <span style={{ fontSize: "9px", padding: "2px 4px", borderRadius: "3px", backgroundColor: aaPassed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: aaPassed ? "#10b981" : "#ef4444", fontWeight: "bold" }}>AA</span>
                    <span style={{ fontSize: "9px", padding: "2px 4px", borderRadius: "3px", backgroundColor: aaaPassed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: aaaPassed ? "#10b981" : "#ef4444", fontWeight: "bold" }}>AAA</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "12px", color: "#475569", border: "1px dashed #1e293b", borderRadius: "8px", fontSize: "11px" }}>
                Select an element with the Inspector to inspect its color contrast.
              </div>
            )}

            {/* Color Extractor Controls & Palette */}
            <div>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <button
                  onClick={handleColorPicker}
                  style={{
                    flex: 1,
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    padding: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <Pipette style={{ width: "12px", height: "12px", color: "#3b82f6" }} />
                  Color Picker
                </button>

                <button
                  onClick={handleExtractPalette}
                  style={{
                    flex: 1,
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "8px",
                    color: "white",
                    padding: "8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px"
                  }}
                >
                  <RefreshCw style={{ width: "12px", height: "12px", color: "#10b981" }} />
                  Color Extractor
                </button>
              </div>

              {/* Extracted Palette Display */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {pickedColor && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#1e293b", padding: "8px 12px", borderRadius: "8px", fontSize: "11px" }}>
                    <span style={{ color: "#94a3b8" }}>Last Picked Color:</span>
                    <div style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: pickedColor, border: "1px solid rgba(255,255,255,0.1)" }} />
                    <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>{pickedColor}</span>
                  </div>
                )}
                
                <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "10px" }}>
                  <h4 style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, margin: "0 0 10px 0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Extracted Page Palette (K-Means)
                  </h4>
                  
                  {dominantPalette.length === 0 ? (
                    <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                      No colors extracted. Click "Color Extractor".
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
                      {dominantPalette.map((color) => (
                        <div key={color} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <div
                            onClick={() => handleCopy(color)}
                            title={`Copy: ${color}`}
                            style={{
                              width: "100%",
                              height: "36px",
                              borderRadius: "6px",
                              backgroundColor: color,
                              cursor: "pointer",
                              border: "1px solid rgba(255,255,255,0.1)",
                              position: "relative"
                            }}
                          />
                          <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#64748b" }}>{color}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analogous suggestions */}
            {lockedStyles && suggestions.length > 0 && (
              <div>
                <h4 style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, margin: "0 0 8px 0", textTransform: "uppercase" }}>
                  Suggested Complementary Schemes
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {suggestions.slice(0, 2).map((scheme) => (
                    <div key={scheme.type} style={{ backgroundColor: "#1e293b", padding: "8px", borderRadius: "6px" }}>
                      <span style={{ fontSize: "9px", color: "#64748b", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                        {scheme.type}
                      </span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {scheme.colors.map((c) => (
                          <div
                            key={c}
                            onClick={() => handleCopy(c)}
                            title={`Copy: ${c}`}
                            style={{
                              flex: 1,
                              height: "20px",
                              borderRadius: "4px",
                              backgroundColor: c,
                              cursor: "pointer",
                              border: "1px solid rgba(255,255,255,0.05)"
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: FONTS */}
        {activeTab === "fonts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Locked element typography details */}
            {lockedStyles ? (
              <div style={{ backgroundColor: "#1e293b", padding: "12px", borderRadius: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontSize: "11px", color: "#3b82f6", fontWeight: "bold" }}>
                  <Type style={{ width: "12px", height: "12px" }} />
                  <span>SELECTED ELEMENT FONTS</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Family:</span>
                    <span style={{ fontWeight: 600 }}>{lockedStyles.fontFamilyChain[0]}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Source:</span>
                    <span style={{ color: lockedStyles.fontSource === "Google Fonts" ? "#10b981" : "#e2e8f0" }}>{lockedStyles.fontSource}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Size:</span>
                    <span>{lockedStyles.fontSize}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Weight:</span>
                    <span>{lockedStyles.fontWeight}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b" }}>Line Height:</span>
                    <span>{lockedStyles.lineHeight}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "12px", color: "#475569", border: "1px dashed #1e293b", borderRadius: "8px", fontSize: "11px" }}>
                Select an element with the Inspector to inspect its typography.
              </div>
            )}

            {/* Font Family Extractor */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <h4 style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, margin: 0, textTransform: "uppercase" }}>
                  Site Font Family & Sizes Extractor
                </h4>
                <button
                  onClick={handleScanFonts}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "#3b82f6",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "10px",
                    fontWeight: 600
                  }}
                >
                  <RefreshCw style={{ width: "10px", height: "10px" }} />
                  Scan Fonts
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {extractedFonts.length === 0 ? (
                  <div style={{ fontSize: "11px", color: "#64748b", fontStyle: "italic" }}>
                    No fonts scanned. Click "Scan Fonts".
                  </div>
                ) : (
                  extractedFonts.map((stat) => (
                    <div 
                      key={stat.family} 
                      style={{ 
                        backgroundColor: "#1e293b", 
                        padding: "10px", 
                        borderRadius: "8px",
                        borderLeft: "3px solid #3b82f6"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontWeight: "bold" }}>
                        <span style={{ fontFamily: stat.family }}>{stat.family}</span>
                        <span style={{ color: "#64748b", fontSize: "9px" }}>{stat.count} nodes</span>
                      </div>
                      
                      {/* Sizes listed */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "6px" }}>
                        {stat.sizes.slice(0, 8).map(s => (
                          <span 
                            key={s} 
                            style={{ 
                              fontSize: "9px", 
                              backgroundColor: "#0f172a", 
                              padding: "2px 5px", 
                              borderRadius: "4px", 
                              color: "#cbd5e1" 
                            }}
                          >
                            {s}
                          </span>
                        ))}
                        {stat.sizes.length > 8 && (
                          <span style={{ fontSize: "9px", color: "#64748b", alignSelf: "center" }}>
                            +{stat.sizes.length - 8} more
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

        {/* TAB: IMAGES */}
        {activeTab === "images" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <h4 style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 700, margin: 0, textTransform: "uppercase" }}>
                Site Image Extractor
              </h4>
              <button
                onClick={handleScanImages}
                style={{
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#3b82f6",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                  fontWeight: 600
                }}
              >
                <RefreshCw style={{ width: "10px", height: "10px" }} />
                Scan Images
              </button>
            </div>

            {extractedImages.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: "#475569", border: "1px dashed #1e293b", borderRadius: "8px", fontSize: "11px" }}>
                <ImageIcon style={{ width: "24px", height: "24px", color: "#475569", margin: "0 auto 8px", display: "block" }} />
                No images scanned. Click "Scan Images" to locate all image elements.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {extractedImages.map((img, i) => (
                  <div 
                    key={i} 
                    style={{ 
                      backgroundColor: "#1e293b", 
                      borderRadius: "10px", 
                      padding: "12px", 
                      display: "flex", 
                      flexDirection: "column", 
                      gap: "10px" 
                    }}
                  >
                    {/* Upper row: Preview and Metadata */}
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      {/* Thumbnail preview - bigger size */}
                      <div 
                        style={{ 
                          width: "80px", 
                          height: "80px", 
                          borderRadius: "6px", 
                          overflow: "hidden", 
                          backgroundColor: "#0f172a",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid rgba(255,255,255,0.05)",
                          flexShrink: 0
                        }}
                      >
                        <img 
                          src={img.src} 
                          alt="Preview" 
                          style={{ 
                            maxWidth: "100%", 
                            maxHeight: "100%", 
                            objectFit: "contain" 
                          }} 
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>

                      {/* Metadata details */}
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div 
                          style={{ 
                            fontSize: "9px", 
                            fontWeight: "bold", 
                            color: "#3b82f6", 
                            textTransform: "uppercase",
                            backgroundColor: "rgba(59, 130, 246, 0.1)",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            width: "fit-content"
                          }}
                        >
                          {img.type === "img" ? "IMG" : `CSS BG (${img.tagName})`}
                        </div>
                        <div 
                          style={{ 
                            fontSize: "11px", 
                            color: "#cbd5e1", 
                            fontWeight: 500,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            lineHeight: "1.3"
                          }}
                          title={img.alt}
                        >
                          {img.alt === "No description" || img.alt === "CSS Background Image" ? (
                            <span style={{ color: "#475569", fontStyle: "italic" }}>{img.alt}</span>
                          ) : (
                            img.alt
                          )}
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                          {img.dimensions}
                        </div>
                      </div>
                    </div>

                    {/* Lower row: Copy & Download Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "8px" }}>
                      
                      {/* Copy actions row */}
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleCopy(img.src)}
                          style={{
                            flex: 1,
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "4px",
                            color: "#cbd5e1",
                            padding: "6px 8px",
                            fontSize: "10px",
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                          title="Copy Source URL"
                        >
                          <Copy style={{ width: "10px", height: "10px" }} />
                          Copy URL
                        </button>

                        <button
                          onClick={() => handleCopyImageBinary(img.src)}
                          style={{
                            flex: 1,
                            backgroundColor: "#0f172a",
                            border: "none",
                            borderRadius: "4px",
                            color: "#cbd5e1",
                            padding: "6px 8px",
                            fontSize: "10px",
                            fontWeight: 500,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "6px"
                          }}
                          title="Copy Image binary to clipboard"
                        >
                          <Copy style={{ width: "10px", height: "10px" }} />
                          Copy Image
                        </button>
                      </div>

                      {/* Download actions row */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "9px", color: "#64748b", fontWeight: 500 }}>Download as:</span>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {(["PNG", "JPEG", "WebP"] as const).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => handleDownloadImage(img.src, fmt)}
                              style={{
                                backgroundColor: "rgba(59, 130, 246, 0.1)",
                                border: "none",
                                borderRadius: "4px",
                                color: "#3b82f6",
                                padding: "4px 8px",
                                fontSize: "9px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px"
                              }}
                            >
                              <Download style={{ width: "8px", height: "8px" }} />
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Open original link */}
                      <a
                        href={img.src}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: "9px",
                          color: "#64748b",
                          textDecoration: "none",
                          alignSelf: "flex-end",
                          display: "flex",
                          alignItems: "center",
                          gap: "3px"
                        }}
                      >
                        <ExternalLink style={{ width: "8px", height: "8px" }} />
                        Open original
                      </a>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Global Copied Notification */}
        {copiedText && (
          <div 
            style={{ 
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: copiedText.includes("not supported") || copiedText.includes("blocked") || copiedText.includes("failed") ? "#f59e0b" : "#10b981", 
              color: "#ffffff", 
              fontSize: "11px", 
              fontWeight: 600,
              padding: "6px 14px", 
              borderRadius: "20px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
              zIndex: 9999999,
              whiteSpace: "nowrap",
              textAlign: "center"
            }}
          >
            {copiedText}
          </div>
        )}

      </div>
    </div>
  );
};
