import React from "react";
import { extractElementStyles, rgbToHex } from "./styleExtractor";

interface InspectorOverlayProps {
  element: HTMLElement;
  label?: string;
  borderColor?: string;
  borderStyle?: string;
  backgroundColor?: string;
  interactive?: boolean; // Added to enable interactions when selection is locked
  onClose?: () => void;  // Callback to close/clear lock state
  showPopover?: boolean; // Controls whether to show the hover popover
}

// Fallback clipboard copying method using document.execCommand
const fallbackCopyText = (text: string) => {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  textArea.style.top = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    console.warn("Fallback copy failed:", err);
  }
  document.body.removeChild(textArea);
};

// Inline SVGs for copy action feedback
const CopyIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const CheckIcon: React.FC = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

// Click-to-copy wrapper component with hover and success state styles
const CopyableValue: React.FC<{
  value: string;
  displayValue?: React.ReactNode;
  label: string;
  interactive?: boolean;
}> = ({ value, displayValue, label, interactive }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    if (!interactive) return;
    e.stopPropagation();
    
    const runCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(value).then(runCopy).catch(() => {
        fallbackCopyText(value);
        runCopy();
      });
    } else {
      fallbackCopyText(value);
      runCopy();
    }
  };

  if (!interactive) {
    return <span style={{ userSelect: "none" }}>{displayValue || value}</span>;
  }

  return (
    <span
      onClick={handleCopy}
      className="overlay-copyable-field"
      style={{
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "1px 4px",
        borderRadius: "3px",
        backgroundColor: copied ? "rgba(16, 185, 129, 0.15)" : "transparent",
        color: copied ? "#10b981" : "inherit",
        transition: "all 0.15s ease",
        userSelect: "text",
        WebkitUserSelect: "text",
      }}
      title={`Click to copy ${label}`}
    >
      <span style={{ userSelect: "text", WebkitUserSelect: "text" }}>{displayValue || value}</span>
      {copied ? <CheckIcon /> : <span className="overlay-copy-icon" style={{ opacity: 0, transition: "opacity 0.15s ease" }}><CopyIcon /></span>}
    </span>
  );
};

export const InspectorOverlay: React.FC<InspectorOverlayProps> = ({
  element,
  label,
  borderColor = "#3b82f6",
  borderStyle = "solid",
  backgroundColor = "rgba(59, 130, 246, 0.05)",
  interactive = false,
  onClose,
  showPopover = true
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
    border: `2px ${borderStyle} ${borderColor}`,
    backgroundColor: backgroundColor,
    pointerEvents: "none",
    zIndex: 999999,
    boxSizing: "border-box",
  };

  // Position of popover (placed to the side if room, else above/below)
  const popoverWidth = 280;
  const popoverHeight = 320;
  const margin = 12;

  const spaceRight = window.innerWidth - rect.right;
  const spaceLeft = rect.left;

  let popoverLeft = rect.left;
  let popoverTop = rect.bottom;
  let placement: "right" | "left" | "below" | "above" = "below";

  if (spaceRight >= popoverWidth + 24) {
    // Position to the right of the element
    popoverLeft = rect.right + margin;
    popoverTop = rect.top;
    placement = "right";
  } else if (spaceLeft >= popoverWidth + 24) {
    // Position to the left of the element
    popoverLeft = rect.left - popoverWidth - margin;
    popoverTop = rect.top;
    placement = "left";
  } else {
    // Fallback to above/below
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < popoverHeight + 20 && rect.top > popoverHeight + 20;
    popoverLeft = rect.left;
    popoverTop = showAbove 
      ? rect.top - popoverHeight - margin 
      : rect.bottom + margin;
    placement = showAbove ? "above" : "below";
  }

  // Horizontal bounds constraint
  if (popoverLeft + popoverWidth > window.innerWidth - 16) {
    popoverLeft = window.innerWidth - popoverWidth - 16;
  }
  if (popoverLeft < 16) {
    popoverLeft = 16;
  }
  const finalLeft = popoverLeft + scrollX;

  // Vertical bounds constraint
  if (placement === "right" || placement === "left") {
    if (popoverTop + popoverHeight > window.innerHeight - 16) {
      popoverTop = window.innerHeight - popoverHeight - 16;
    }
    if (popoverTop < 16) {
      popoverTop = 16;
    }
  } else {
    if (placement === "below") {
      if (popoverTop + popoverHeight > window.innerHeight - 16) {
        if (rect.top > popoverHeight + 20) {
          popoverTop = rect.top - popoverHeight - margin;
        } else {
          popoverTop = window.innerHeight - popoverHeight - 16;
        }
      }
    } else { // above
      if (popoverTop < 16) {
        if (window.innerHeight - rect.bottom > popoverHeight + 20) {
          popoverTop = rect.bottom + margin;
        } else {
          popoverTop = 16;
        }
      }
    }
  }
  const finalTop = popoverTop + scrollY;

  const popoverStyle: React.CSSProperties = {
    position: "absolute",
    top: finalTop,
    left: finalLeft,
    width: `${popoverWidth}px`,
    backgroundColor: "#0B1329", // Deep Navy/Slate background
    color: "#E2E8F0",
    borderRadius: "8px",
    border: "1px solid #1C2B3C",
    boxShadow: "0 12px 30px -10px rgba(0,0,0,0.7), 0 8px 12px -8px rgba(0,0,0,0.5)",
    padding: "16px",
    fontSize: "11px",
    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
    pointerEvents: interactive ? "auto" : "none", // Enable cursor actions only when interactive
    userSelect: interactive ? "text" : "none",    // Enable text selection only when interactive
    WebkitUserSelect: interactive ? "text" : "none",
    zIndex: 1000000,
    boxSizing: "border-box",
  };

  // Weight name mapping helper
  const getWeightName = (weight: string) => {
    const w = parseInt(weight) || 400;
    if (w <= 100) return `${w} (Thin)`;
    if (w <= 200) return `${w} (Extra Light)`;
    if (w <= 300) return `${w} (Light)`;
    if (w <= 400) return `${w} (Regular)`;
    if (w <= 500) return `${w} (Medium)`;
    if (w <= 600) return `${w} (Semi Bold)`;
    if (w <= 700) return `${w} (Bold)`;
    if (w <= 800) return `${w} (Extra Bold)`;
    return `${w} (Black)`;
  };

  // Contrast value formatting
  const contrastRatio = styles ? styles.contrastRatio : 1;
  const isLargeText = styles 
    ? (parseFloat(styles.fontSize) >= 24 || (parseFloat(styles.fontSize) >= 18.6 && parseInt(styles.fontWeight, 10) >= 700))
    : false;
  const aaPassed = isLargeText ? contrastRatio >= 3.0 : contrastRatio >= 4.5;
  const contrastColor = aaPassed ? "#10b981" : "#f97316"; // Green if passed, orange/red if not

  // Format label values for separate styling
  let labelTag = "";
  let labelClasses = "";
  if (styles) {
    if (label) {
      if (label.startsWith("selected: ")) {
        labelTag = "selected";
        labelClasses = `: ${label.substring(10)}`;
      } else {
        labelTag = label;
      }
    } else {
      labelTag = styles.tagName;
      labelClasses = styles.className
        ? typeof styles.className === "string"
          ? " " + styles.className.split(/\s+/).filter(Boolean).map(c => `.${c}`).join(" ")
          : ""
        : "";
    }
  }

  return (
    <>
      {/* Dashed outline around element */}
      <div style={outlineStyle} />

      {/* Inject animation styles for blinking dot and copy buttons */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes overlay-dot-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .inspecting-dot-blink {
          animation: overlay-dot-blink 1.5s infinite;
        }
        .overlay-copyable-field:hover {
          background-color: rgba(255, 255, 255, 0.08) !important;
        }
        .overlay-copyable-field:hover .overlay-copy-icon {
          opacity: 0.7 !important;
        }
        .popover-close-btn:hover {
          background-color: rgba(239, 68, 68, 0.2) !important;
          color: #ef4444 !important;
        }
      `}} />

      {/* Styled Popover tooltip */}
      {showPopover && styles && (
        <div style={popoverStyle}>
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1C2B3C", paddingBottom: "8px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", overflow: "hidden", whiteSpace: "nowrap", marginRight: "8px" }}>
              <span style={{ fontWeight: "bold", color: "#D0BCFF", fontSize: "13px", fontFamily: "monospace" }}>
                {labelTag}
              </span>
              <span style={{ color: "#64748B", fontSize: "11px", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>
                {labelClasses}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ 
                border: "1px solid #1C2B3C", 
                borderRadius: "4px", 
                padding: "2px 6px", 
                fontSize: "9px", 
                color: "#94A3B8", 
                fontFamily: "monospace",
                letterSpacing: "0.5px"
              }}>
                LUME v1.0
              </span>
              {interactive && onClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#94A3B8",
                    cursor: "pointer",
                    fontSize: "14px",
                    lineHeight: "1",
                    fontWeight: "bold",
                    padding: "2px 5px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "4px",
                    transition: "all 0.15s ease",
                  }}
                  className="popover-close-btn"
                  title="Close Inspector Overlay"
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Typography Row */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ color: "#94A3B8", fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontFamily: "serif", fontSize: "11px", fontStyle: "italic", fontWeight: "bold" }}>Tt</span> TYPOGRAPHY
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div>
                <div style={{ color: "#64748B", fontSize: "8px", letterSpacing: "0.5px", marginBottom: "2px" }}>FAMILY</div>
                <div style={{ color: "#F1F5F9", fontSize: "11px", fontWeight: "500", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={styles.fontFamily}>
                  <CopyableValue 
                    value={styles.fontFamilyChain[0] || styles.fontFamily} 
                    label="Font Family" 
                    interactive={interactive} 
                  />
                </div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "8px", letterSpacing: "0.5px", marginBottom: "2px" }}>SIZE / LEADING</div>
                <div style={{ color: "#F1F5F9", fontSize: "11px", fontWeight: "500", fontFamily: "monospace" }}>
                  <CopyableValue 
                    value={`${styles.fontSize} / ${styles.lineHeight === "normal" ? "normal" : styles.lineHeight}`} 
                    label="Font Size / Leading" 
                    interactive={interactive} 
                  />
                </div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "8px", letterSpacing: "0.5px", marginBottom: "2px" }}>WEIGHT</div>
                <div style={{ color: "#F1F5F9", fontSize: "11px", fontWeight: "500", fontFamily: "monospace" }}>
                  <CopyableValue 
                    value={styles.fontWeight} 
                    displayValue={getWeightName(styles.fontWeight)}
                    label="Font Weight" 
                    interactive={interactive} 
                  />
                </div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "8px", letterSpacing: "0.5px", marginBottom: "2px" }}>STYLE</div>
                <div style={{ color: "#F1F5F9", fontSize: "11px", fontWeight: "500", fontFamily: "monospace" }}>
                  <CopyableValue 
                    value={styles.fontStyle} 
                    displayValue={styles.fontStyle.charAt(0).toUpperCase() + styles.fontStyle.slice(1)}
                    label="Font Style" 
                    interactive={interactive} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Row */}
          <div style={{ marginBottom: "12px", borderTop: "1px solid #1C2B3C", paddingTop: "8px" }}>
            <div style={{ color: "#94A3B8", fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              🎨 APPEARANCE
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {/* Primary Color */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: styles.color, border: "1px solid rgba(255,255,255,0.15)" }} />
                  <span style={{ color: "#94A3B8", fontSize: "11px" }}>Primary Color</span>
                </div>
                <span style={{ color: "#F1F5F9", fontSize: "11px", fontFamily: "monospace" }}>
                  <CopyableValue 
                    value={rgbToHex(styles.textColorRGB)} 
                    label="Primary Color Hex" 
                    interactive={interactive} 
                  />
                </span>
              </div>
              
              {/* Background */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: styles.backgroundColor, border: "1px solid rgba(255,255,255,0.15)" }} />
                  <span style={{ color: "#94A3B8", fontSize: "11px" }}>Background</span>
                </div>
                <span style={{ color: "#F1F5F9", fontSize: "11px", fontFamily: "monospace" }}>
                  <CopyableValue 
                    value={rgbToHex(styles.bgColorRGB)} 
                    label="Background Color Hex" 
                    interactive={interactive} 
                  />
                </span>
              </div>

              {/* Contrast */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: contrastColor, border: "1px solid rgba(255,255,255,0.15)" }} />
                  <span style={{ color: "#94A3B8", fontSize: "11px" }}>Contrast Ratio</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: contrastColor, fontSize: "11px", fontWeight: "bold", fontFamily: "monospace" }}>
                    <CopyableValue 
                      value={`${contrastRatio.toFixed(2)}:1`} 
                      label="Contrast Ratio" 
                      interactive={interactive} 
                    />
                  </span>
                  <span style={{ 
                    fontSize: "8px", 
                    color: "#0B1329", 
                    backgroundColor: contrastColor, 
                    padding: "1px 4px", 
                    borderRadius: "3px",
                    fontWeight: "bold",
                    fontFamily: "monospace"
                  }}>
                    {aaPassed ? "PASS" : "FAIL"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Box Model Row */}
          <div style={{ marginBottom: "12px", borderTop: "1px solid #1C2B3C", paddingTop: "8px" }}>
            <div style={{ color: "#94A3B8", fontSize: "9px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>
              📐 BOX MODEL
            </div>
            
            <div style={{ 
              border: "1px dashed rgba(148, 163, 184, 0.3)", 
              borderRadius: "4px", 
              padding: "10px", 
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "8px",
              backgroundColor: "rgba(30, 41, 59, 0.1)"
            }}>
              <span style={{ position: "absolute", top: "2px", left: "6px", fontSize: "8px", color: "#64748B", fontFamily: "monospace" }}>
                margin: <CopyableValue value={styles.margin} label="Margin shorthand" interactive={interactive} />
              </span>
              
              <div style={{ 
                border: "1px solid rgba(148, 163, 184, 0.25)", 
                borderRadius: "3px", 
                padding: "8px 12px", 
                width: "90%",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                backgroundColor: "rgba(30, 41, 59, 0.15)"
              }}>
                <span style={{ position: "absolute", top: "2px", left: "6px", fontSize: "8px", color: "#64748B", fontFamily: "monospace" }}>
                  padding: <CopyableValue value={styles.padding} label="Padding shorthand" interactive={interactive} />
                </span>
                
                <div style={{ 
                  backgroundColor: "rgba(208, 188, 255, 0.15)", 
                  border: "1px solid rgba(208, 188, 255, 0.3)",
                  borderRadius: "2px",
                  padding: "4px 8px",
                  fontSize: "10px",
                  color: "#D0BCFF",
                  fontFamily: "monospace",
                  fontWeight: "bold",
                  textAlign: "center",
                  width: "100%",
                  boxSizing: "border-box"
                }}>
                  <CopyableValue 
                    value={`${styles.dimensions.width} × ${styles.dimensions.height}`} 
                    label="Width × Height" 
                    interactive={interactive} 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: "10px", fontFamily: "monospace" }}>
              <div>
                <span>Width</span>
                <span style={{ color: "#F1F5F9", marginLeft: "8px" }}>
                  <CopyableValue 
                    value={`${styles.dimensions.width.toFixed(1)}px`} 
                    label="Element Width" 
                    interactive={interactive} 
                  />
                </span>
              </div>
              <div>
                <span>Height</span>
                <span style={{ color: "#F1F5F9", marginLeft: "8px" }}>
                  <CopyableValue 
                    value={`${styles.dimensions.height.toFixed(1)}px`} 
                    label="Element Height" 
                    interactive={interactive} 
                  />
                </span>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div style={{ 
            borderTop: "1px solid #1C2B3C", 
            paddingTop: "8px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            fontSize: "9px"
          }}>
            <span style={{ color: "#64748B", display: "flex", alignItems: "center", gap: "3px" }}>
              ⓘ Alt + Click to Lock
            </span>
            <span style={{ color: "#10b981", display: "flex", alignItems: "center", gap: "4px", fontWeight: "bold", letterSpacing: "0.5px" }}>
              <span className="inspecting-dot-blink" style={{ 
                width: "6px", 
                height: "6px", 
                backgroundColor: "#10b981", 
                borderRadius: "50%",
                display: "inline-block"
              }} />
              INSPECTING
            </span>
          </div>
        </div>
      )}
    </>
  );
};
