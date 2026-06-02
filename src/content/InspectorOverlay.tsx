import React from "react";
import { extractElementStyles } from "./styleExtractor";

interface InspectorOverlayProps {
  element: HTMLElement;
  label?: string;
  borderColor?: string;
  backgroundColor?: string;
}

export const InspectorOverlay: React.FC<InspectorOverlayProps> = ({
  element,
  label,
  borderColor = "#3b82f6",
  backgroundColor = "rgba(59, 130, 246, 0.05)"
}) => {
  const rect = element.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;

  // Extract computed styles dynamically for the popover
  let styles;
  try {
    styles = extractElementStyles(element);
  } catch (err) {
    console.warn("Failed style extraction in overlay:", err);
  }

  // Position of outline
  const outlineStyle: React.CSSProperties = {
    position: "absolute",
    top: rect.top + scrollY,
    left: rect.left + scrollX,
    width: rect.width,
    height: rect.height,
    border: `2px dashed ${borderColor}`,
    backgroundColor: backgroundColor,
    pointerEvents: "none",
    zIndex: 999999,
    boxSizing: "border-box",
  };

  // Position of popover (placed below if room, else above)
  const popoverHeight = 110; // approximate height
  const spaceBelow = window.innerHeight - rect.bottom;
  const showAbove = spaceBelow < popoverHeight + 20 && rect.top > popoverHeight + 20;
  
  const popoverTop = showAbove 
    ? rect.top + scrollY - popoverHeight - 8 
    : rect.bottom + scrollY + 8;

  const popoverStyle: React.CSSProperties = {
    position: "absolute",
    top: popoverTop,
    left: rect.left + scrollX,
    width: "220px",
    backgroundColor: "#111827", // Slate dark background
    color: "#f3f4f6",
    borderRadius: "8px",
    border: "1px solid #1f2937",
    boxShadow: "0 10px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.3)",
    padding: "10px 12px",
    fontSize: "11px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    pointerEvents: "none",
    zIndex: 1000000,
    boxSizing: "border-box",
  };

  // Contrast value formatting
  const contrastRatio = styles ? styles.contrastRatio : 1;
  const isLargeText = styles 
    ? (parseFloat(styles.fontSize) >= 24 || (parseFloat(styles.fontSize) >= 18.6 && parseInt(styles.fontWeight, 10) >= 700))
    : false;
  const aaPassed = isLargeText ? contrastRatio >= 3.0 : contrastRatio >= 4.5;
  const contrastColor = aaPassed ? "#10b981" : "#f97316"; // Green if passed, orange/red if not

  return (
    <>
      {/* Dashed outline around element */}
      <div style={outlineStyle} />

      {/* Styled Popover tooltip */}
      {styles && (
        <div style={popoverStyle}>
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "between", alignItems: "center", borderBottom: "1px solid #1f2937", paddingBottom: "6px", marginBottom: "6px" }}>
            <span style={{ fontWeight: "bold", color: "#3b82f6", fontSize: "12px", fontFamily: "monospace" }}>
              {label || styles.tagName}
            </span>
            <span style={{ marginLeft: "auto", color: "#9ca3af", fontSize: "10px", fontFamily: "monospace" }}>
              {styles.dimensions.width} × {styles.dimensions.height} px
            </span>
          </div>

          {/* Typography Row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ color: "#9ca3af" }}>Font:</span>
            <span style={{ fontWeight: "bold", color: "#f9fafb" }}>
              {styles.fontSize} ({styles.fontWeight})
            </span>
          </div>

          {/* Contrast Row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
            <span style={{ color: "#9ca3af" }}>Contrast:</span>
            <span style={{ fontWeight: "bold", color: contrastColor }}>
              {contrastRatio.toFixed(2)}:1
            </span>
          </div>

          {/* Action Footer */}
          <div style={{ fontSize: "8.5px", fontWeight: "bold", color: "#3b82f6", letterSpacing: "0.5px", marginTop: "6px", textTransform: "uppercase", textAlign: "center" }}>
            Click to Inspect & Lock Element
          </div>
        </div>
      )}
    </>
  );
};
