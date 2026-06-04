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
  X
} from "lucide-react";

const isTextElement = (el: HTMLElement): boolean => {
  const shadowHost = document.getElementById("accessibility-inspector-extension-root");
  if (shadowHost && shadowHost.contains(el)) return false;

  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === 3 && node.textContent && node.textContent.trim().length > 0) {
      return true;
    }
  }
  return false;
};

export const ContentApp: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Overlay starts closed
  const [inspectorActive, setInspectorActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [lockedItems, setLockedItems] = useState<{ element: HTMLElement; styles: ElementStyles }[]>([]);
  const [focusedTab, setFocusedTab] = useState<"inspect" | "colors" | "fonts" | "images">("inspect");
  const [showContrastTooltips, setShowContrastTooltips] = useState(false);
  const [fullPageOverlayMode, setFullPageOverlayMode] = useState<"fontSize" | "fontWeight" | "fontFamily" | "contrast" | null>(null);
  const [fullPageTooltips, setFullPageTooltips] = useState<{
    id: string;
    top: number;
    left: number;
    value: string;
    bgColor: string;
    textColor: string;
  }[]>([]);

  // Text Inspector States
  const [textInspectorActive, setTextInspectorActive] = useState(false);
  const [hoveredTextElement, setHoveredTextElement] = useState<HTMLElement | null>(null);
  const [hoveredTextStyles, setHoveredTextStyles] = useState<ElementStyles | null>(null);
  const [selectedTextElements, setSelectedTextElements] = useState<{ id: string; element: HTMLElement; styles: ElementStyles; textContent: string }[]>([]);
  const [activeSelectedTextId, setActiveSelectedTextId] = useState<string | null>(null);

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
          setFullPageOverlayMode(null);
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
        setFullPageOverlayMode(null);
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

  const scanFullPageTooltips = () => {
    if (!fullPageOverlayMode) {
      setFullPageTooltips([]);
      return;
    }

    const allElements = Array.from(document.querySelectorAll("*")) as HTMLElement[];
    const shadowHost = document.getElementById("accessibility-inspector-extension-root");

    const tooltips: {
      id: string;
      top: number;
      left: number;
      value: string;
      bgColor: string;
      textColor: string;
    }[] = [];

    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;

    allElements.forEach((el, idx) => {
      if (shadowHost && shadowHost.contains(el)) return;
      if (el.offsetWidth === 0 && el.offsetHeight === 0) return;

      // Filter: only select elements that contain direct text content
      let hasDirectText = false;
      for (let i = 0; i < el.childNodes.length; i++) {
        const node = el.childNodes[i];
        if (node.nodeType === 3 && node.textContent && node.textContent.trim().length > 0) {
          hasDirectText = true;
          break;
        }
      }

      if (hasDirectText) {
        try {
          const rect = el.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) return;

          const styles = extractElementStyles(el);
          let value = "";
          let bgColor = "#0f172a"; // default slate-900
          let textColor = "#f8fafc"; // default slate-50

          if (fullPageOverlayMode === "fontSize") {
            value = styles.fontSize;
            bgColor = "#1e3a8a"; // Blue-900
          } else if (fullPageOverlayMode === "fontWeight") {
            value = styles.fontWeight;
            bgColor = "#3730a3"; // Indigo-800
          } else if (fullPageOverlayMode === "fontFamily") {
            value = styles.fontFamilyChain[0] || styles.fontFamily;
            if (value.length > 15) value = value.substring(0, 12) + "...";
            bgColor = "#4c1d95"; // Purple-900
          } else if (fullPageOverlayMode === "contrast") {
            value = `${styles.contrastRatio.toFixed(1)}:1`;
            const isLargeText = parseFloat(styles.fontSize) >= 24 || 
              (parseFloat(styles.fontSize) >= 18.6 && parseInt(styles.fontWeight, 10) >= 700);
            const isPassed = isLargeText ? styles.contrastRatio >= 3.0 : styles.contrastRatio >= 4.5;
            bgColor = isPassed ? "#064e3b" : "#7f1d1d"; // Green-900 or Red-900
          }

          tooltips.push({
            id: `fp-tooltip-${idx}`,
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft,
            value,
            bgColor,
            textColor
          });
        } catch {
          // ignore
        }
      }
    });

    setFullPageTooltips(tooltips);
  };

  useEffect(() => {
    if (!fullPageOverlayMode) {
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
  }, [fullPageOverlayMode]);

  // Synchronize showContrastTooltips with fullPageOverlayMode
  useEffect(() => {
    if (showContrastTooltips) {
      if (fullPageOverlayMode !== "contrast") {
        setFullPageOverlayMode("contrast");
      }
    } else {
      if (fullPageOverlayMode === "contrast") {
        setFullPageOverlayMode(null);
      }
    }
  }, [showContrastTooltips]);

  useEffect(() => {
    if (fullPageOverlayMode === "contrast") {
      setShowContrastTooltips(true);
    } else {
      setShowContrastTooltips(false);
    }
  }, [fullPageOverlayMode]);

  // Turn off contrast tooltips if the user navigates away from the fonts/colors tab
  useEffect(() => {
    if (focusedTab !== "fonts" && focusedTab !== "colors" && fullPageOverlayMode === "contrast") {
      setFullPageOverlayMode(null);
    }
  }, [focusedTab]);

  // Turn off overlay modes if the text inspector becomes inactive
  useEffect(() => {
    if (!textInspectorActive) {
      setFullPageOverlayMode(null);
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

      {/* Full Page Visual Overlay Tooltips */}
      {fullPageOverlayMode && fullPageTooltips.map((badge) => (
        <div
          key={badge.id}
          style={{
            position: "absolute",
            top: Math.max(0, badge.top - 20),
            left: badge.left,
            backgroundColor: badge.bgColor,
            color: badge.textColor,
            fontSize: "9px",
            fontWeight: "bold",
            fontFamily: "monospace",
            padding: "2px 5.5px",
            borderRadius: "4px",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 2px 5px rgba(0,0,0,0.35)",
            pointerEvents: "none",
            zIndex: 999998,
            whiteSpace: "nowrap"
          }}
        >
          {badge.value}
          {/* Caret pointing downwards */}
          <div
            style={{
              position: "absolute",
              bottom: "-4px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "4px solid transparent",
              borderRight: "4px solid transparent",
              borderTop: `4px solid ${badge.bgColor}`,
              pointerEvents: "none"
            }}
          />
        </div>
      ))}

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
              <div className="bg-slate-950/95 backdrop-blur-md border border-slate-800 p-4 rounded-xl shadow-2xl w-[500px] pointer-events-auto flex flex-col gap-3 text-slate-100 text-xs">
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
                  <div className="flex justify-between border-b border-slate-900/50 py-1">
                    <span className="text-slate-400">Font Family</span>
                    <span className="text-slate-200 text-right truncate max-w-[150px]" title={activeItem.styles.fontFamily}>
                      {activeItem.styles.fontFamily.split(",")[0]}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/50 py-1">
                    <span className="text-slate-400">Font Size</span>
                    <span className="text-slate-200">{activeItem.styles.fontSize}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/50 py-1">
                    <span className="text-slate-400">Font Weight</span>
                    <span className="text-slate-200">{activeItem.styles.fontWeight}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/50 py-1">
                    <span className="text-slate-400">Line Height</span>
                    <span className="text-slate-200">{activeItem.styles.lineHeight}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/50 py-1">
                    <span className="text-slate-400">Text Color</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: activeItem.styles.color }} />
                      <span className="text-slate-200">{activeItem.styles.color}</span>
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/50 py-1">
                    <span className="text-slate-400">Background</span>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full border border-slate-700" style={{ backgroundColor: activeItem.styles.backgroundColor }} />
                      <span className="text-slate-200">{activeItem.styles.backgroundColor}</span>
                    </div>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/50 py-1">
                    <span className="text-slate-400">Contrast</span>
                    <span className={`font-bold ${activeItem.styles.contrastRatio >= 4.5 ? "text-emerald-400" : "text-rose-400"}`}>
                      {activeItem.styles.contrastRatio.toFixed(1)}:1
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-900/50 py-1">
                    <span className="text-slate-400">Text Align</span>
                    <span className="text-slate-200">{activeItem.styles.textAlign}</span>
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
                    const isActive = fullPageOverlayMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setFullPageOverlayMode(isActive ? null : mode)}
                        className={`px-2 py-1 rounded-md border cursor-pointer transition-all ${
                          isActive
                            ? "bg-blue-600 border-blue-500 text-white shadow-sm font-semibold"
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
