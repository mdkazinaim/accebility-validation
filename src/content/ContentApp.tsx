import React, { useEffect, useState } from "react";
import { InspectorOverlay } from "./InspectorOverlay";
import { FloatingPanel } from "./FloatingPanel";
import { ElementStyles, extractElementStyles } from "./styleExtractor";

export const ContentApp: React.FC = () => {
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
        sendResponse({ inspectorActive, isOpen });
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
  }, [inspectorActive, isOpen]);

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
    </>
  );
};

export default ContentApp;
