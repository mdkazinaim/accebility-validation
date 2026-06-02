import React, { useEffect, useState } from "react";
import { ElementStyles, extractElementStyles } from "./styleExtractor";

interface InspectorOverlayProps {
  hoveredElement: HTMLElement | null;
}

export const InspectorOverlay: React.FC<InspectorOverlayProps> = ({
  hoveredElement,
}) => {
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [styles, setStyles] = useState<ElementStyles | null>(null);

  useEffect(() => {
    if (!hoveredElement) {
      setRect(null);
      setStyles(null);
      return;
    }

    // Capture bounding client rect
    const updatePosition = () => {
      const elRect = hoveredElement.getBoundingClientRect();
      setRect(elRect);
      try {
        const elStyles = extractElementStyles(hoveredElement);
        setStyles(elStyles);
      } catch (err) {
        console.warn("Failed style extraction on hover", err);
      }
    };

    updatePosition();

    // Listen to scroll and resize events to update position of outline
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition, { passive: true });

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [hoveredElement]);

  if (!hoveredElement || !rect) return null;

  // Absolute positioning in scroll coordinates
  const top = rect.top + window.scrollY;
  const left = rect.left + window.scrollX;
  const width = rect.width;
  const height = rect.height;

  // Check contrast validation for badge warning
  const contrastValid = styles ? styles.contrastRatio >= 4.5 : true;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 999998,
      }}
    >
      {/* Target Element Outline Highlights */}
      <div
        style={{
          position: "absolute",
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          height: `${height}px`,
          border: "2px dashed #3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.08)",
          boxSizing: "border-box",
          transition: "all 0.05s ease-out",
        }}
      />

      {/* DevTools Info Badge */}
      <div
        style={{
          position: "absolute",
          top: `${top + height + 6}px`,
          left: `${left}px`,
          backgroundColor: "#1e293b",
          color: "#ffffff",
          padding: "6px 12px",
          borderRadius: "6px",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: "12px",
          fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.25)",
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          pointerEvents: "none",
          minWidth: "180px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#3b82f6", fontWeight: "bold" }}>
            {styles?.tagName}
            {hoveredElement.id && <span style={{ color: "#a855f7" }}>#{hoveredElement.id}</span>}
          </span>
          <span style={{ color: "#94a3b8", fontSize: "10px" }}>
            {styles?.dimensions.width} × {styles?.dimensions.height} px
          </span>
        </div>

        {styles && (
          <div style={{ marginTop: "4px", borderTop: "1px solid #334155", paddingTop: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#94a3b8" }}>Font:</span>
              <span>{styles.fontSize} ({styles.fontWeight})</span>
            </div>
            
            {/* Show contrast indicator if text is present */}
            {hoveredElement.textContent?.trim() && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#94a3b8" }}>Contrast:</span>
                <span
                  style={{
                    color: contrastValid ? "#10b981" : "#ef4444",
                    fontWeight: "bold",
                  }}
                >
                  {styles.contrastRatio.toFixed(2)}:1
                  {!contrastValid && " (Low)"}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div style={{ color: "#3b82f6", fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: "4px", textAlign: "center" }}>
          Click to inspect & lock element
        </div>
      </div>
    </div>
  );
};
