import React, { useEffect, useState } from "react";
import { InspectorOverlay } from "./InspectorOverlay";
import { FloatingPanel } from "./FloatingPanel";
import { ElementStyles, extractElementStyles } from "./styleExtractor";

export const ContentApp: React.FC = () => {
  const [panelOpen, setPanelOpen] = useState(true); // Sidebar panel visibility
  const [inspectorActive, setInspectorActive] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [lockedElement, setLockedElement] = useState<HTMLElement | null>(null);
  const [lockedStyles, setLockedStyles] = useState<ElementStyles | null>(null);

  // Listen to messages from popup or background scripts
  useEffect(() => {
    const handleMessage = (
      message: any,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.action === "toggle-ui") {
        setPanelOpen((prev) => !prev);
        sendResponse({ status: "toggled", visible: !panelOpen });
      } else if (message.action === "toggle-inspector") {
        setInspectorActive(true);
        sendResponse({ status: "inspector-active" });
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [panelOpen]);

  // Escape key handler to cancel inspector mode
  useEffect(() => {
    if (!inspectorActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setInspectorActive(false);
        setHoveredElement(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [inspectorActive]);

  // Handle document-wide hover event when inspector is active (independent of panelOpen)
  useEffect(() => {
    if (!inspectorActive) {
      setHoveredElement(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Filter out elements residing inside our Shadow DOM container
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

  // Trap clicks to lock element when inspector is active (independent of panelOpen)
  useEffect(() => {
    if (!inspectorActive) return;

    const handleElementClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Skip elements in our extension panel
      const shadowHost = document.getElementById("accessibility-inspector-extension-root");
      if (shadowHost && shadowHost.contains(target)) {
        return;
      }

      // Block link navigation or form submissions on active inspection click
      e.preventDefault();
      e.stopPropagation();

      try {
        const styles = extractElementStyles(target);
        setLockedElement(target);
        setLockedStyles(styles);
        setPanelOpen(true); // Auto-open sidebar when element is inspected/locked!
      } catch (err) {
        console.warn("Failed style lock", err);
      }

      // Deactivate hover inspector after locking
      setInspectorActive(false);
      setHoveredElement(null);
    };

    // Capture phase listener to intercept actions before other handlers
    document.addEventListener("click", handleElementClick, true);

    return () => {
      document.removeEventListener("click", handleElementClick, true);
    };
  }, [inspectorActive]);

  const handleClearLocked = () => {
    setLockedElement(null);
    setLockedStyles(null);
  };

  return (
    <>
      {inspectorActive && (
        <InspectorOverlay
          hoveredElement={hoveredElement}
        />
      )}
      {panelOpen && (
        <FloatingPanel
          inspectorActive={inspectorActive}
          setInspectorActive={setInspectorActive}
          lockedElement={lockedElement}
          lockedStyles={lockedStyles}
          onClearLocked={handleClearLocked}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  );
};

export default ContentApp;
