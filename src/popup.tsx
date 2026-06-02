import { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { Sparkles, MousePointer, Eye, LayoutGrid } from "lucide-react";
import "./index.css";

const Popup = () => {
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    // Retrieve current active tab
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          const tab = tabs[0];
          setActiveTab(tab);
          
          // Check if it's a restricted browser page (e.g., chrome://, edge://, etc.)
          if (tab.url && (tab.url.startsWith("chrome://") || tab.url.startsWith("edge://") || tab.url.startsWith("about:") || tab.url.startsWith("chrome-extension://"))) {
            setErrorMessage("Cannot inspect internal browser pages. Please open a standard web page.");
          }
        }
      });
    }
  }, []);

  const sendTabMessage = (action: string) => {
    if (!activeTab || !activeTab.id) {
      setStatusMessage("No active page detected.");
      return;
    }

    setStatusMessage("Connecting to page...");
    chrome.tabs.sendMessage(activeTab.id, { action }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script might not be loaded yet
        console.warn("Communication error:", chrome.runtime.lastError.message);
        
        // Attempt scripting injection as a fallback
        chrome.scripting.executeScript({
          target: { tabId: activeTab.id! },
          files: ["assets/content.js"]
        }, () => {
          if (chrome.runtime.lastError) {
            setErrorMessage("Could not connect to page. Try refreshing the tab.");
            setStatusMessage("");
          } else {
            // Script injected successfully, retry message
            setTimeout(() => {
              chrome.tabs.sendMessage(activeTab.id!, { action }, (retryResponse) => {
                if (retryResponse) {
                  setStatusMessage("Extension loaded successfully!");
                } else {
                  setStatusMessage("Extension active on page.");
                }
              });
            }, 200);
          }
        });
      } else if (response) {
        setStatusMessage("Action dispatched successfully.");
      } else {
        setStatusMessage("Extension state updated.");
      }
      
      // Auto-clear status after 2 seconds
      setTimeout(() => setStatusMessage(""), 2000);
    });
  };

  const handleOpenDashboard = () => {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      chrome.tabs.create({ url: chrome.runtime.getURL("index.html") });
    }
  };

  return (
    <div className="w-80 bg-slate-900 text-slate-100 p-4 font-sans select-none border border-slate-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
        <Sparkles className="text-blue-500 w-5 h-5 animate-pulse" />
        <div>
          <h1 className="text-sm font-bold tracking-wide uppercase">Design & Accessibility</h1>
          <p className="text-[10px] text-slate-400">Browser Validation Toolkit</p>
        </div>
      </div>

      {/* Content Area */}
      {errorMessage ? (
        <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-md text-xs mb-4">
          {errorMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Active Tab Display */}
          {activeTab && (
            <div className="bg-slate-950 p-2.5 rounded-md border border-slate-800 text-xs">
              <div className="text-slate-500 text-[10px] uppercase font-semibold">Active Webpage</div>
              <div className="font-medium truncate text-slate-300 mt-0.5">{activeTab.title}</div>
            </div>
          )}

          {/* Action List */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => sendTabMessage("toggle-ui")}
              className="flex items-center gap-3 w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded-md text-xs transition duration-150 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              Toggle Inspector Overlay Panel
            </button>

            <button
              onClick={() => sendTabMessage("toggle-inspector")}
              className="flex items-center gap-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-md text-xs transition duration-150 cursor-pointer border border-slate-750"
            >
              <MousePointer className="w-4 h-4 text-blue-400" />
              Activate Element Hover Picker
            </button>

            <button
              onClick={handleOpenDashboard}
              className="flex items-center gap-3 w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-3 rounded-md text-xs transition duration-150 cursor-pointer border border-slate-750"
            >
              <LayoutGrid className="w-4 h-4 text-purple-400" />
              Open Audit Dashboard Site
            </button>
          </div>
        </div>
      )}

      {/* Status Bar */}
      {statusMessage && (
        <div className="mt-3 text-center text-[10px] text-blue-400 bg-blue-950/20 py-1 rounded">
          {statusMessage}
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 border-t border-slate-800 pt-2 text-center text-[9px] text-slate-500">
        v1.0.0 • Open Source Design Utility
      </div>
    </div>
  );
};

const root = document.getElementById("popup-root");
if (root) {
  ReactDOM.createRoot(root).render(<Popup />);
}
