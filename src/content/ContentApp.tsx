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
  Pipette
} from "lucide-react";

export const ContentApp: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Overlay starts closed
  const [inspectorActive, setInspectorActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [lockedItems, setLockedItems] = useState<{ element: HTMLElement; styles: ElementStyles }[]>([]);
  const [focusedTab, setFocusedTab] = useState<"inspect" | "colors" | "fonts" | "images">("inspect");
  const [showContrastTooltips, setShowContrastTooltips] = useState(false);
  const [contrastTooltips, setContrastTooltips] = useState<{
    id: string;
    top: number;
    left: number;
    contrastRatio: number;
    isPassed: boolean;
  }[]>([]);

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
          setShowContrastTooltips(false);
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
      } else if (key === "e") {
        e.preventDefault();
        triggerNativeEyeDropper();
      } else if (key === "v") {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

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

  const scanContrastTooltips = () => {
    const allElements = Array.from(document.querySelectorAll("*")) as HTMLElement[];
    const shadowHost = document.getElementById("accessibility-inspector-extension-root");

    const tooltips: {
      id: string;
      top: number;
      left: number;
      contrastRatio: number;
      isPassed: boolean;
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
          const isLargeText = parseFloat(styles.fontSize) >= 24 || 
            (parseFloat(styles.fontSize) >= 18.6 && parseInt(styles.fontWeight, 10) >= 700);
          const isPassed = isLargeText ? styles.contrastRatio >= 3.0 : styles.contrastRatio >= 4.5;

          tooltips.push({
            id: `contrast-tooltip-${idx}`,
            top: rect.top + scrollTop,
            left: rect.left + scrollLeft,
            contrastRatio: styles.contrastRatio,
            isPassed
          });
        } catch {
          // ignore
        }
      }
    });

    setContrastTooltips(tooltips);
  };

  useEffect(() => {
    if (!showContrastTooltips) {
      setContrastTooltips([]);
      return;
    }

    scanContrastTooltips();

    let scrollTimeout: number;
    const handleScrollOrResize = () => {
      cancelAnimationFrame(scrollTimeout);
      scrollTimeout = requestAnimationFrame(() => {
        scanContrastTooltips();
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
  }, [showContrastTooltips]);

  // Turn off contrast tooltips if the user navigates away from the fonts tab
  useEffect(() => {
    if (focusedTab !== "fonts") {
      setShowContrastTooltips(false);
    }
  }, [focusedTab]);

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

      {/* Contrast Tooltips badging overlay */}
      {showContrastTooltips && contrastTooltips.map((badge) => (
        <div
          key={badge.id}
          style={{
            position: "absolute",
            top: Math.max(0, badge.top - 20),
            left: badge.left,
            backgroundColor: badge.isPassed ? "#065f46" : "#991b1b",
            color: "#ffffff",
            fontSize: "9px",
            fontWeight: "bold",
            fontFamily: "monospace",
            padding: "2px 5px",
            borderRadius: "4px",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            boxShadow: "0 2px 5px rgba(0,0,0,0.35)",
            pointerEvents: "none",
            zIndex: 999998,
            whiteSpace: "nowrap"
          }}
        >
          {badge.contrastRatio.toFixed(1)}:1
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
              borderTop: `4px solid ${badge.isPassed ? "#065f46" : "#991b1b"}`,
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
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100000] flex flex-col items-center gap-1.5 pointer-events-none select-none">
          {/* Key shortcut badges */}
          <div className="flex items-center gap-8 text-[9px] font-bold font-mono tracking-widest text-blue-400 select-none">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 border border-blue-500/20 shadow-md">M</span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 border border-blue-500/20 shadow-md">E</span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-950 border border-blue-500/20 shadow-md">V</span>
          </div>

          {/* Main Toolbar Pill */}
          <div className="flex items-center gap-4 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 px-4 py-2.5 rounded-full shadow-2xl pointer-events-auto">
            {/* Group 1: Tools */}
            <div className="flex items-center gap-1.5 pr-3 border-r border-slate-800">
              {/* Mouse Inspector */}
              <button
                onClick={() => setInspectorActive(!inspectorActive)}
                className={`p-2 rounded-full cursor-pointer transition-all ${
                  inspectorActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Hover Inspector (Key: M)"
              >
                <MousePointer className="w-4 h-4" />
              </button>

              {/* Eyedropper Color Picker */}
              {"EyeDropper" in window && (
                <button
                  onClick={triggerNativeEyeDropper}
                  className="p-2 rounded-full cursor-pointer text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-all"
                  title="Color Picker / Eyedropper (Key: E)"
                >
                  <Pipette className="w-4 h-4" />
                </button>
              )}

              {/* Contrast Badges Toggle */}
              <button
                onClick={() => setShowContrastTooltips(!showContrastTooltips)}
                className={`p-2 rounded-full cursor-pointer transition-all ${
                  showContrastTooltips
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-105"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Toggle Page Contrast Badges"
              >
                <Type className="w-4 h-4" />
              </button>
            </div>

            {/* Group 2: Sidebar Tabs */}
            <div className="flex items-center gap-1.5 px-1 pr-3 border-r border-slate-800">
              <button
                onClick={() => {
                  setFocusedTab("inspect");
                  setIsOpen(true);
                }}
                className={`p-2 rounded-full cursor-pointer transition-all ${
                  isOpen && focusedTab === "inspect"
                    ? "bg-slate-800 text-blue-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Inspect Elements"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setFocusedTab("colors");
                  setIsOpen(true);
                }}
                className={`p-2 rounded-full cursor-pointer transition-all ${
                  isOpen && focusedTab === "colors"
                    ? "bg-slate-800 text-blue-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Color Analyzer"
              >
                <Palette className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setFocusedTab("fonts");
                  setIsOpen(true);
                }}
                className={`p-2 rounded-full cursor-pointer transition-all ${
                  isOpen && focusedTab === "fonts"
                    ? "bg-slate-800 text-blue-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Typography Analyzer"
              >
                <Type className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setFocusedTab("images");
                  setIsOpen(true);
                }}
                className={`p-2 rounded-full cursor-pointer transition-all ${
                  isOpen && focusedTab === "images"
                    ? "bg-slate-800 text-blue-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Image Analyzer"
              >
                <Image className="w-4 h-4" />
              </button>
            </div>

            {/* Group 3: Control Buttons */}
            <div className="flex items-center gap-1.5">
              {/* Toggle Sidebar */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-2 rounded-full cursor-pointer transition-all ${
                  isOpen
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
                title="Toggle Sidebar (Key: V)"
              >
                <Layout className="w-4 h-4" />
              </button>

              {/* Close Menu */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsOpen(false);
                  setInspectorActive(false);
                  setShowContrastTooltips(false);
                }}
                className="p-2 rounded-full cursor-pointer text-rose-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all"
                title="Close Visual Inspector"
              >
                <Power className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ContentApp;
