import React, { useEffect, useState } from "react";
import { InspectorOverlay } from "./InspectorOverlay";
import { FloatingPanel } from "./FloatingPanel";
import { ElementStyles, extractElementStyles } from "./styleExtractor";
import {
  MousePointer,
  Type,
  Palette,
  Image,
  Search,
  Layout,
  Power,
  Pipette,
  X,
  Copy,
  Check
} from "lucide-react";

const isTextElement = (el: HTMLElement): boolean => {
  const shadowHost = document.getElementById("accessibility-inspector-extension-root");
  if (shadowHost && shadowHost.contains(el)) return false;

  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === 3 && node.textContent && node.textContent.trim().length > 0) {
      if (/[a-zA-Z0-9]/.test(node.textContent)) {
        return true;
      }
    }
  }
  return false;
};

const isElementVisible = (el: HTMLElement, rect: DOMRect): boolean => {
  // 1. Viewport bounds check
  if (
    rect.bottom < 0 ||
    rect.right < 0 ||
    rect.top > window.innerHeight ||
    rect.left > window.innerWidth
  ) {
    return false;
  }

  // 2. CSS visibility/opacity check
  const style = window.getComputedStyle(el);
  if (style.opacity === "0" || style.visibility === "hidden" || style.display === "none") {
    return false;
  }

  // 3. Overflow occlusion check (climbing the DOM tree)
  let parent = el.parentElement;
  while (parent) {
    const parentStyle = window.getComputedStyle(parent);
    if (parentStyle.overflow !== "visible" && parentStyle.overflow !== "") {
      const parentRect = parent.getBoundingClientRect();
      if (
        rect.bottom <= parentRect.top ||
        rect.top >= parentRect.bottom ||
        rect.right <= parentRect.left ||
        rect.left >= parentRect.right
      ) {
        return false;
      }
    }
    parent = parent.parentElement;
  }
  return true;
};

export const ContentApp: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Overlay starts closed
  const [inspectorActive, setInspectorActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [lockedItems, setLockedItems] = useState<{ element: HTMLElement; styles: ElementStyles }[]>([]);
  const [focusedTab, setFocusedTab] = useState<"inspect" | "colors" | "fonts" | "images">("inspect");
  const [showContrastTooltips, setShowContrastTooltips] = useState(false);
  const [activeOverlayModes, setActiveOverlayModes] = useState<Set<"fontSize" | "fontWeight" | "fontFamily" | "contrast">>(new Set());
  const [fullPageTooltips, setFullPageTooltips] = useState<{
    id: string;
    top: number;
    left: number;
    segments: { value: string; bgColor: string }[];
  }[]>([]);
  const [hoveredTooltipId, setHoveredTooltipId] = useState<string | null>(null);

  // Text Inspector States
  const [textInspectorActive, setTextInspectorActive] = useState(false);
  const [hoveredTextElement, setHoveredTextElement] = useState<HTMLElement | null>(null);
  const [hoveredTextStyles, setHoveredTextStyles] = useState<ElementStyles | null>(null);
  const [selectedTextElements, setSelectedTextElements] = useState<{ id: string; element: HTMLElement; styles: ElementStyles; textContent: string }[]>([]);
  const [activeSelectedTextId, setActiveSelectedTextId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  };

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

  const handleCopyField = (fieldName: string, value: string) => {
    copyToClipboard(value);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 1500);
  };

  // Sync state and respond to messages from popup or background scripts
  useEffect(() => {
    const handleMessage = (
      message: any,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      const action = message.action;

      if (action === "query-status") {
        sendResponse({ inspectorActive, isOpen, isMenuOpen });
      } else if (action === "toggle-extension") {
        const next = !isMenuOpen;
        setIsMenuOpen(next);
        if (!next) {
          setIsOpen(false);
          setInspectorActive(false);
          setTextInspectorActive(false);
          setShowContrastTooltips(false);
          setActiveOverlayModes(new Set());
        }
        sendResponse({ isMenuOpen: next });
      } else if (action === "toggle-inspector") {
        const nextState = !inspectorActive;
        setInspectorActive(nextState);
        if (nextState) setHoveredElement(null);
        sendResponse({ inspectorActive: nextState });
      } else if (action === "activate-eyedropper") {
        triggerNativeEyeDropper();
        sendResponse({ status: "eyedropper-triggered" });
      } else if (action === "open-colors") {
        setIsOpen(true);
        setFocusedTab("colors");
        sendResponse({ status: "colors-opened" });
      } else if (action === "open-fonts") {
        setIsOpen(true);
        setFocusedTab("fonts");
        sendResponse({ status: "fonts-opened" });
      } else if (action === "open-images") {
        setIsOpen(true);
        setFocusedTab("images");
        sendResponse({ status: "images-opened" });
      } else if (action === "toggle-sidebar") {
        const nextOpen = !isOpen;
        setIsOpen(nextOpen);
        sendResponse({ isOpen: nextOpen });
      } else {
        sendResponse({ status: "unknown" });
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [inspectorActive, isOpen, isMenuOpen]);

  // Native EyeDropper triggering inside content script
  const triggerNativeEyeDropper = async () => {
    if (!("EyeDropper" in window)) return;
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
        // Force-open panel and set tab to colors
        setIsOpen(true);
        setFocusedTab("colors");
        // Dispatch custom event to let FloatingPanel sync selected color if necessary
        const event = new CustomEvent("eyedropper-color-selected", { detail: result.sRGBHex });
        window.dispatchEvent(event);
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

  // Listen for keyboard shortcuts when menu is open
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === "INPUT" || 
        activeEl.tagName === "TEXTAREA" || 
        (activeEl as HTMLElement).isContentEditable
      )) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "m") {
        e.preventDefault();
        setInspectorActive(prev => !prev);
        setTextInspectorActive(false);
      } else if (key === "e") {
        e.preventDefault();
        triggerNativeEyeDropper();
      } else if (key === "t") {
        e.preventDefault();
        setTextInspectorActive(prev => !prev);
        setInspectorActive(false);
      } else if (key === "i") {
        e.preventDefault();
        setFocusedTab("inspect");
        setIsOpen(true);
      } else if (key === "c") {
        e.preventDefault();
        setFocusedTab("colors");
        setIsOpen(true);
      } else if (key === "f") {
        e.preventDefault();
        setFocusedTab("fonts");
        setIsOpen(true);
      } else if (key === "g") {
        e.preventDefault();
        setFocusedTab("images");
        setIsOpen(true);
      } else if (key === "v") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      } else if (key === "q") {
        e.preventDefault();
        setIsMenuOpen(false);
        setIsOpen(false);
        setInspectorActive(false);
        setTextInspectorActive(false);
        setShowContrastTooltips(false);
        setActiveOverlayModes(new Set());
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  // Hover handler for Text Inspector
  useEffect(() => {
    if (!textInspectorActive) {
      setHoveredTextElement(null);
      setHoveredTextStyles(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      if (isTextElement(target)) {
        setHoveredTextElement(target);
        try {
          const styles = extractElementStyles(target);
          setHoveredTextStyles(styles);
        } catch {
          setHoveredTextStyles(null);
        }
      } else {
        setHoveredTextElement(null);
        setHoveredTextStyles(null);
      }
    };

    const handleMouseLeave = () => {
      setHoveredTextElement(null);
      setHoveredTextStyles(null);
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [textInspectorActive]);

  // Click handler for Text Inspector (select multiple elements)
  useEffect(() => {
    if (!textInspectorActive) return;

    const handleTextClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const shadowHost = document.getElementById("accessibility-inspector-extension-root");
      if (shadowHost && shadowHost.contains(target)) return;

      if (isTextElement(target)) {
        e.preventDefault();
        e.stopPropagation();

        const alreadySelected = selectedTextElements.some(item => item.element === target);
        if (!alreadySelected) {
          try {
            const styles = extractElementStyles(target);
            const textContent = target.textContent?.trim().slice(0, 20) || "Text Element";
            const id = `text-el-${Date.now()}`;
            setSelectedTextElements(prev => [...prev, { id, element: target, styles, textContent }]);
            setActiveSelectedTextId(id);
          } catch (err) {
            console.warn("Failed style extraction on text click:", err);
          }
        } else {
          const item = selectedTextElements.find(item => item.element === target);
          if (item) {
            setActiveSelectedTextId(item.id);
          }
        }
      }
    };

    document.addEventListener("click", handleTextClick, true);
    return () => {
      document.removeEventListener("click", handleTextClick, true);
    };
  }, [textInspectorActive, selectedTextElements]);

  // Document hover handler (works even if sidebar is closed)
  useEffect(() => {
    if (!inspectorActive) {
      setHoveredElement(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Ignore our extension container
      const shadowHost = document.getElementById("accessibility-inspector-extension-root");
      if (shadowHost && shadowHost.contains(target)) {
        setHoveredElement(null);
        return;
      }

      setHoveredElement(target);
    };

    const handleMouseLeave = () => {
      setHoveredElement(null);
    };

    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [inspectorActive]);

  // Document click handler (locks element and auto-opens sidebar to inspect tab)
  useEffect(() => {
    if (!inspectorActive) return;

    const handleElementClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const shadowHost = document.getElementById("accessibility-inspector-extension-root");
      if (shadowHost && shadowHost.contains(target)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // Check if element is already in the selected list
      const alreadyLocked = lockedItems.some(item => item.element === target);
      if (!alreadyLocked) {
        try {
          const styles = extractElementStyles(target);
          setLockedItems(prev => [...prev, { element: target, styles }]);
          setFocusedTab("inspect");
          setIsOpen(true); // Always open panel when an element is locked
        } catch (err) {
          console.warn("Failed style extraction on click", err);
        }
      }

      setHoveredElement(null);
    };

    document.addEventListener("click", handleElementClick, true);
    return () => {
      document.removeEventListener("click", handleElementClick, true);
    };
  }, [inspectorActive, lockedItems]);

  const handleClearAllLocked = () => {
    setLockedItems([]);
  };

  const handleRemoveLockedItem = (element: HTMLElement) => {
    setLockedItems(prev => prev.filter(item => item.element !== element));
  };

  const MODE_CONFIG: Record<string, { bgColor: (styles: ReturnType<typeof extractElementStyles>) => string; getValue: (styles: ReturnType<typeof extractElementStyles>) => string }> = {
    fontSize:   { bgColor: () => "#1e3a8a", getValue: s => s.fontSize },
    fontWeight: { bgColor: () => "#3730a3", getValue: s => s.fontWeight },
    fontFamily: { bgColor: () => "#4c1d95", getValue: s => { const v = s.fontFamilyChain[0] || s.fontFamily; return v.length > 15 ? v.substring(0, 12) + "..." : v; } },
    contrast:   { bgColor: s => {
      const isLargeText = parseFloat(s.fontSize) >= 24 || (parseFloat(s.fontSize) >= 18.6 && parseInt(s.fontWeight, 10) >= 700);
      return (isLargeText ? s.contrastRatio >= 3.0 : s.contrastRatio >= 4.5) ? "#064e3b" : "#7f1d1d";
    }, getValue: s => `${s.contrastRatio.toFixed(1)}:1` },
  };

  const scanFullPageTooltips = () => {
    if (activeOverlayModes.size === 0) {
      setFullPageTooltips([]);
      return;
    }

    const allElements = Array.from(document.querySelectorAll("*")) as HTMLElement[];
    const shadowHost = document.getElementById("accessibility-inspector-extension-root");
    const activeModes = Array.from(activeOverlayModes);

    const tooltips: { id: string; top: number; left: number; segments: { value: string; bgColor: string }[] }[] = [];

    allElements.forEach((el, idx) => {
      if (shadowHost && shadowHost.contains(el)) return;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) return;

      // Find the first non-empty direct text node that contains letters or numbers
      let firstTextNode: Text | null = null;
      for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === 3 && node.textContent && node.textContent.trim().length > 0) {
          if (/[a-zA-Z0-9]/.test(node.textContent)) {
            firstTextNode = node as Text;
            break;
          }
        }
      }

      if (firstTextNode) {
        try {
          // Use Range to get the actual text bounding box (not the element box)
          const range = document.createRange();
          range.selectNode(firstTextNode);
          const textRect = range.getBoundingClientRect();
          if (textRect.width < 2 || textRect.height < 2) return;

          // Check if element is currently visible to the user
          if (!isElementVisible(el, textRect)) return;

          const styles = extractElementStyles(el);

          // One container per element – all active modes shown side by side
          const segments = activeModes.map(mode => ({
            value: MODE_CONFIG[mode].getValue(styles),
            bgColor: MODE_CONFIG[mode].bgColor(styles),
          }));

          tooltips.push({
            id: `fp-tooltip-${idx}`,
            // Center over the actual text, not the full element width
            top: textRect.top - 24,
            left: textRect.left + textRect.width / 2,
            segments,
          });
        } catch {
          // ignore
        }
      }
    });

    setFullPageTooltips(tooltips);
  };

  useEffect(() => {
    if (activeOverlayModes.size === 0) {
      setFullPageTooltips([]);
      return;
    }

    scanFullPageTooltips();

    let scrollTimeout: number;
    const handleScrollOrResize = () => {
      cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(() => {
        scanFullPageTooltips();
      });
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize, true);

    const observer = new MutationObserver(() => {
      handleScrollOrResize();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize, true);
      observer.disconnect();
      cancelAnimationFrame(scrollTimeout);
    };
  }, [activeOverlayModes]);

  // Track mouse coordinates to detect which tooltip is hovered, since tooltips have pointer-events: none
  useEffect(() => {
    if (activeOverlayModes.size === 0 || fullPageTooltips.length === 0) {
      setHoveredTooltipId(null);
      return;
    }

    let frameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        const x = e.clientX;
        const y = e.clientY;
        let foundId: string | null = null;

        const shadowHost = document.getElementById("accessibility-inspector-extension-root");
        const shadowRoot = shadowHost?.shadowRoot;

        for (let i = 0; i < fullPageTooltips.length; i++) {
          const tip = fullPageTooltips[i];
          const el = shadowRoot ? shadowRoot.getElementById(tip.id) : null;
          if (el) {
            const rect = el.getBoundingClientRect();
            // Check if cursor is within the tooltip bounds (with a tiny 2px padding for better user feel)
            if (
              x >= rect.left - 2 &&
              x <= rect.right + 2 &&
              y >= rect.top - 2 &&
              y <= rect.bottom + 2
            ) {
              foundId = tip.id;
              break;
            }
          }
        }
        setHoveredTooltipId(foundId);
      });
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(frameId);
    };
  }, [fullPageTooltips, activeOverlayModes]);

  // Synchronize showContrastTooltips with activeOverlayModes
  useEffect(() => {
    if (showContrastTooltips) {
      setActiveOverlayModes(prev => { const next = new Set(prev); next.add("contrast"); return next; });
    } else {
      setActiveOverlayModes(prev => { const next = new Set(prev); next.delete("contrast"); return next; });
    }
  }, [showContrastTooltips]);

  useEffect(() => {
    setShowContrastTooltips(activeOverlayModes.has("contrast"));
  }, [activeOverlayModes]);

  // Turn off contrast tooltips if the user navigates away from the fonts/colors tab
  useEffect(() => {
    if (focusedTab !== "fonts" && focusedTab !== "colors") {
      setActiveOverlayModes(prev => { const next = new Set(prev); next.delete("contrast"); return next; });
    }
  }, [focusedTab]);

  // Turn off overlay modes if the text inspector becomes inactive
  useEffect(() => {
    if (!textInspectorActive) {
      setActiveOverlayModes(new Set());
    }
  }, [textInspectorActive]);

  return (
    <>
      {/* Hover Outline - Active even when panel is closed */}
      {inspectorActive && hoveredElement && (
        <InspectorOverlay element={hoveredElement} />
      )}

      {/* Selected Element Outlines - Persistent if selection locked */}
      {lockedItems.map((item, idx) => (
        <InspectorOverlay 
          key={`locked-${idx}-${item.element.tagName}`}
          element={item.element} 
          borderColor="#10b981" 
          backgroundColor="rgba(16, 185, 129, 0.04)"
          label={`selected: ${item.element.tagName.toLowerCase()}`}
          interactive={true}
          onClose={() => handleRemoveLockedItem(item.element)}
        />
      ))}

      {/* Hover Outline for Text Inspector */}
      {textInspectorActive && hoveredTextElement && (
        <InspectorOverlay 
          element={hoveredTextElement} 
          borderColor="#3b82f6" 
          backgroundColor="rgba(59, 130, 246, 0.05)" 
          label="text element"
          showPopover={false}
        />
      )}

      {/* Selected Text Outlines */}
      {textInspectorActive && selectedTextElements.map((item) => (
        <InspectorOverlay
          key={item.id}
          element={item.element}
          borderColor="#3b82f6"
          borderStyle="dashed"
          backgroundColor="rgba(59, 130, 246, 0.02)"
          label={`selected text: ${item.textContent}`}
          interactive={true}
          showPopover={false}
          onClose={() => {
            setSelectedTextElements(prev => prev.filter(x => x.id !== item.id));
            if (activeSelectedTextId === item.id) {
              setActiveSelectedTextId(null);
            }
          }}
        />
      ))}

      {/* Full Page Visual Overlay Tooltips – one container per element, chips side-by-side */}
      {activeOverlayModes.size > 0 && fullPageTooltips.map((tip) => {
        const isHovered = hoveredTooltipId === tip.id;
        return (
          <div
            key={tip.id}
            id={tip.id}
            style={{
              position: "fixed",
              top: Math.max(0, tip.top),
              left: tip.left,
              transform: "translateX(-50%)",
              display: "inline-flex",
              alignItems: "center",
              gap: "2px",
              pointerEvents: "none",
              zIndex: isHovered ? 999999 : 999998,
              opacity: isHovered ? 1 : 0.35,
              transition: "opacity 0.15s ease-in-out, z-index 0.15s ease-in-out",
            }}
          >
            {/* Wrapper that holds chips + caret as a single column */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* Row of coloured chips */}
              <div style={{ display: "inline-flex", gap: "2px", borderRadius: "4px", overflow: "hidden", boxShadow: "0 2px 6px rgba(0,0,0,0.45)" }}>
                {tip.segments.map((seg, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: seg.bgColor,
                      color: "#f8fafc",
                      fontSize: "9px",
                      fontWeight: "700",
                      fontFamily: "monospace",
                      padding: "2px 5px",
                      lineHeight: 1.4,
                      whiteSpace: "nowrap",
                      borderRight: i < tip.segments.length - 1 ? "1px solid rgba(255,255,255,0.15)" : "none",
                    }}
                  >
                    {seg.value}
                  </span>
                ))}
              </div>
              {/* Single indicator triangle centered under the chip row */}
              <div style={{
                width: 0,
                height: 0,
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: `5px solid ${tip.segments[0]?.bgColor ?? "#1e3a8a"}`,
              }} />
            </div>
          </div>
        );
      })}

      {isOpen && (
        <FloatingPanel
          inspectorActive={inspectorActive}
          setInspectorActive={setInspectorActive}
          lockedItems={lockedItems}
          onRemoveLockedItem={handleRemoveLockedItem}
          onClearAllLocked={handleClearAllLocked}
          onClose={() => setIsOpen(false)}
          activeTab={focusedTab}
          setActiveTab={setFocusedTab}
          showContrastTooltips={showContrastTooltips}
          setShowContrastTooltips={setShowContrastTooltips}
        />
      )}

      {isMenuOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2000000] flex flex-col items-center gap-2 pointer-events-none select-none">
          {/* Detailed Properties Card */}
          {textInspectorActive && (() => {
            const activeItem = selectedTextElements.find(item => item.id === activeSelectedTextId);
            if (!activeItem) return null;
            return (
              <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-2xl w-[500px] pointer-events-auto flex flex-col gap-3 text-slate-100 text-xs select-text">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="font-semibold text-blue-400 font-mono">"{activeItem.textContent}" Properties</span>
                  <button
                    onClick={() => setActiveSelectedTextId(null)}
                    className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 font-mono text-[11px]">
                  <div 
                    onClick={() => handleCopyField("fontFamily", activeItem.styles.fontFamily)}
                    className="flex justify-between border-b border-slate-900/50 py-1.5 px-1 hover:bg-slate-900/50 rounded cursor-pointer transition-colors group select-all"
                  >
                    <span className="text-slate-400 group-hover:text-slate-300">Font Family</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-200 text-right truncate max-w-[150px]" title={activeItem.styles.fontFamily}>
                        {copiedField === "fontFamily" ? "Copied!" : activeItem.styles.fontFamily.split(",")[0]}
                      </span>
                      {copiedField === "fontFamily" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  <div 
                    onClick={() => handleCopyField("fontSize", activeItem.styles.fontSize)}
                    className="flex justify-between border-b border-slate-900/50 py-1.5 px-1 hover:bg-slate-900/50 rounded cursor-pointer transition-colors group select-all"
                  >
                    <span className="text-slate-400 group-hover:text-slate-300">Font Size</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-200">
                        {copiedField === "fontSize" ? "Copied!" : activeItem.styles.fontSize}
                      </span>
                      {copiedField === "fontSize" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  <div 
                    onClick={() => handleCopyField("fontWeight", activeItem.styles.fontWeight)}
                    className="flex justify-between border-b border-slate-900/50 py-1.5 px-1 hover:bg-slate-900/50 rounded cursor-pointer transition-colors group select-all"
                  >
                    <span className="text-slate-400 group-hover:text-slate-300">Font Weight</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-200">
                        {copiedField === "fontWeight" ? "Copied!" : activeItem.styles.fontWeight}
                      </span>
                      {copiedField === "fontWeight" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  <div 
                    onClick={() => handleCopyField("lineHeight", activeItem.styles.lineHeight)}
                    className="flex justify-between border-b border-slate-900/50 py-1.5 px-1 hover:bg-slate-900/50 rounded cursor-pointer transition-colors group select-all"
                  >
                    <span className="text-slate-400 group-hover:text-slate-300">Line Height</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-200">
                        {copiedField === "lineHeight" ? "Copied!" : activeItem.styles.lineHeight}
                      </span>
                      {copiedField === "lineHeight" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  <div 
                    onClick={() => handleCopyField("color", activeItem.styles.color)}
                    className="flex justify-between border-b border-slate-900/50 py-1.5 px-1 hover:bg-slate-900/50 rounded cursor-pointer transition-colors group select-all"
                  >
                    <span className="text-slate-400 group-hover:text-slate-300">Text Color</span>
                    <div className="flex items-center gap-1.5">
                      {copiedField !== "color" && (
                        <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: activeItem.styles.color }} />
                      )}
                      <span className="text-slate-200">
                        {copiedField === "color" ? "Copied!" : activeItem.styles.color}
                      </span>
                      {copiedField === "color" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  <div 
                    onClick={() => handleCopyField("backgroundColor", activeItem.styles.backgroundColor)}
                    className="flex justify-between border-b border-slate-900/50 py-1.5 px-1 hover:bg-slate-900/50 rounded cursor-pointer transition-colors group select-all"
                  >
                    <span className="text-slate-400 group-hover:text-slate-300">Background</span>
                    <div className="flex items-center gap-1.5">
                      {copiedField !== "backgroundColor" && (
                        <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: activeItem.styles.backgroundColor }} />
                      )}
                      <span className="text-slate-200">
                        {copiedField === "backgroundColor" ? "Copied!" : activeItem.styles.backgroundColor}
                      </span>
                      {copiedField === "backgroundColor" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  <div 
                    onClick={() => handleCopyField("contrast", activeItem.styles.contrastRatio.toFixed(1) + ":1")}
                    className="flex justify-between border-b border-slate-900/50 py-1.5 px-1 hover:bg-slate-900/50 rounded cursor-pointer transition-colors group select-all"
                  >
                    <span className="text-slate-400 group-hover:text-slate-300">Contrast</span>
                    <div className="flex items-center gap-1">
                      <span className={copiedField === "contrast" ? "text-emerald-400" : `font-bold ${activeItem.styles.contrastRatio >= 4.5 ? "text-emerald-400" : "text-rose-400"}`}>
                        {copiedField === "contrast" ? "Copied!" : `${activeItem.styles.contrastRatio.toFixed(1)}:1`}
                      </span>
                      {copiedField === "contrast" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>

                  <div 
                    onClick={() => handleCopyField("textAlign", activeItem.styles.textAlign)}
                    className="flex justify-between border-b border-slate-900/50 py-1.5 px-1 hover:bg-slate-900/50 rounded cursor-pointer transition-colors group select-all"
                  >
                    <span className="text-slate-400 group-hover:text-slate-300">Text Align</span>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-200">
                        {copiedField === "textAlign" ? "Copied!" : activeItem.styles.textAlign}
                      </span>
                      {copiedField === "textAlign" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Secondary Top Bar for Text Inspector */}
          {textInspectorActive && (
            <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-2.5 rounded-xl shadow-xl w-[500px] pointer-events-auto flex flex-col gap-2">
              {/* Row 1: Toggles & Preview */}
              <div className="flex items-center justify-between gap-3">
                {/* Left: Toggles */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                  {(["fontSize", "fontWeight", "fontFamily", "contrast"] as const).map(mode => {
                    const label = mode === "fontSize" ? "Font Size"
                                : mode === "fontWeight" ? "Font Weight"
                                : mode === "fontFamily" ? "Font Family"
                                : "Contrast";
                    const isActive = activeOverlayModes.has(mode);
                    const activeColor = mode === "fontSize" ? "bg-blue-600 border-blue-500"
                                     : mode === "fontWeight" ? "bg-indigo-600 border-indigo-500"
                                     : mode === "fontFamily" ? "bg-purple-600 border-purple-500"
                                     : "bg-emerald-700 border-emerald-600";
                    return (
                      <button
                        key={mode}
                        onClick={() => {
                          setActiveOverlayModes(prev => {
                            const next = new Set(prev);
                            if (next.has(mode)) next.delete(mode);
                            else next.add(mode);
                            return next;
                          });
                        }}
                        className={`px-2 py-1 rounded-md border cursor-pointer transition-all ${
                          isActive
                            ? `${activeColor} text-white shadow-sm font-semibold`
                            : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="border-l border-slate-800 h-6" />

                {/* Right: Hover Preview */}
                <div className="flex items-center justify-end text-[10px] font-mono text-slate-300 truncate max-w-[160px]">
                  {hoveredTextStyles ? (
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-slate-400 font-semibold">{hoveredTextStyles.fontSize}</span>
                      <span className="text-slate-400 truncate max-w-[50px]">{hoveredTextStyles.fontFamily.split(",")[0]}</span>
                      <span className={`font-bold ${hoveredTextStyles.contrastRatio >= 4.5 ? "text-emerald-400" : "text-rose-400"}`}>
                        {hoveredTextStyles.contrastRatio.toFixed(1)}:1
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Hover to preview</span>
                  )}
                </div>
              </div>

              {/* Row 2: Selected Items Pills */}
              {selectedTextElements.length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 border-t border-slate-900/50">
                  <span className="text-[9px] text-slate-500 font-mono uppercase tracking-wider pr-1">Selected:</span>
                  {selectedTextElements.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setActiveSelectedTextId(item.id === activeSelectedTextId ? null : item.id)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-mono border cursor-pointer transition-all ${
                        item.id === activeSelectedTextId
                          ? "bg-blue-600/25 border-blue-500 text-blue-300"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-750"
                      }`}
                    >
                      <span className="truncate max-w-[70px]">{item.textContent}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTextElements(prev => prev.filter(x => x.id !== item.id));
                          if (activeSelectedTextId === item.id) {
                            setActiveSelectedTextId(null);
                          }
                        }}
                        className="hover:text-rose-455 p-0.5"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Toolbar Pill */}
          <div className="flex items-center gap-3 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 px-3.5 py-1.5 rounded-xl shadow-2xl pointer-events-auto">
            {/* Group 1: Tools */}
            <div className="flex items-center gap-1.5 pr-2.5 border-r border-slate-800">
              {/* Mouse Inspector */}
              <button
                onClick={() => {
                  setInspectorActive(!inspectorActive);
                  setTextInspectorActive(false);
                }}
                className={`flex flex-col items-center justify-center w-9 h-9 rounded-md cursor-pointer transition-all ${
                  inspectorActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Hover Inspector (Key: M)"
              >
                <MousePointer className="w-3.5 h-3.5" />
                <span className={`text-[8px] font-bold font-mono mt-0.5 ${inspectorActive ? "text-blue-200" : "text-slate-500"}`}>M</span>
              </button>

              {/* Eyedropper Color Picker */}
              {"EyeDropper" in window && (
                <button
                  onClick={triggerNativeEyeDropper}
                  className="flex flex-col items-center justify-center w-9 h-9 rounded-md cursor-pointer text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
                  title="Color Picker / Eyedropper (Key: E)"
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span className="text-[8px] font-bold font-mono mt-0.5 text-slate-500">E</span>
                </button>
              )}

              {/* Text Inspector Toggle */}
              <button
                onClick={() => {
                  setTextInspectorActive(!textInspectorActive);
                  setInspectorActive(false);
                }}
                className={`flex flex-col items-center justify-center w-9 h-9 rounded-md cursor-pointer transition-all ${
                  textInspectorActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Text Inspector (Key: T)"
              >
                <Type className="w-3.5 h-3.5" />
                <span className={`text-[8px] font-bold font-mono mt-0.5 ${textInspectorActive ? "text-blue-200" : "text-slate-500"}`}>T</span>
              </button>
            </div>

            {/* Group 2: Sidebar Tabs */}
            <div className="flex items-center gap-1.5 px-1 pr-2.5 border-r border-slate-800">
              {/* Inspect tab */}
              <button
                onClick={() => {
                  setFocusedTab("inspect");
                  setIsOpen(true);
                }}
                className={`flex flex-col items-center justify-center w-9 h-9 rounded-md cursor-pointer transition-all ${
                  isOpen && focusedTab === "inspect"
                    ? "bg-slate-800 text-blue-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Inspect Elements (Key: I)"
              >
                <Search className="w-3.5 h-3.5" />
                <span className={`text-[8px] font-bold font-mono mt-0.5 ${isOpen && focusedTab === "inspect" ? "text-blue-300" : "text-slate-500"}`}>I</span>
              </button>

              {/* Colors tab */}
              <button
                onClick={() => {
                  setFocusedTab("colors");
                  setIsOpen(true);
                }}
                className={`flex flex-col items-center justify-center w-9 h-9 rounded-md cursor-pointer transition-all ${
                  isOpen && focusedTab === "colors"
                    ? "bg-slate-800 text-blue-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Color Analyzer (Key: C)"
              >
                <Palette className="w-3.5 h-3.5" />
                <span className={`text-[8px] font-bold font-mono mt-0.5 ${isOpen && focusedTab === "colors" ? "text-blue-300" : "text-slate-500"}`}>C</span>
              </button>

              {/* Fonts tab */}
              <button
                onClick={() => {
                  setFocusedTab("fonts");
                  setIsOpen(true);
                }}
                className={`flex flex-col items-center justify-center w-9 h-9 rounded-md cursor-pointer transition-all ${
                  isOpen && focusedTab === "fonts"
                    ? "bg-slate-800 text-blue-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Typography Analyzer (Key: F)"
              >
                <Type className="w-3.5 h-3.5" />
                <span className={`text-[8px] font-bold font-mono mt-0.5 ${isOpen && focusedTab === "fonts" ? "text-blue-300" : "text-slate-500"}`}>F</span>
              </button>

              {/* Images tab */}
              <button
                onClick={() => {
                  setFocusedTab("images");
                  setIsOpen(true);
                }}
                className={`flex flex-col items-center justify-center w-9 h-9 rounded-md cursor-pointer transition-all ${
                  isOpen && focusedTab === "images"
                    ? "bg-slate-800 text-blue-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Image Analyzer (Key: G)"
              >
                <Image className="w-3.5 h-3.5" />
                <span className={`text-[8px] font-bold font-mono mt-0.5 ${isOpen && focusedTab === "images" ? "text-blue-300" : "text-slate-500"}`}>G</span>
              </button>
            </div>

            {/* Group 3: Control Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Toggle Sidebar */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex flex-col items-center justify-center w-9 h-9 rounded-md cursor-pointer transition-all ${
                  isOpen
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Toggle Sidebar (Key: V)"
              >
                <Layout className="w-3.5 h-3.5" />
                <span className={`text-[8px] font-bold font-mono mt-0.5 ${isOpen ? "text-blue-300" : "text-slate-500"}`}>V</span>
              </button>

              {/* Close Menu */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsOpen(false);
                  setInspectorActive(false);
                  setTextInspectorActive(false);
                  setShowContrastTooltips(false);
                }}
                className="flex flex-col items-center justify-center w-9 h-9 rounded-md cursor-pointer text-rose-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                title="Close Visual Inspector (Key: Q)"
              >
                <Power className="w-3.5 h-3.5" />
                <span className="text-[8px] font-bold font-mono mt-0.5 text-rose-600 hover:text-rose-400">Q</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContentApp;
