// Background service worker for the Accessibility & Design Validator Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log("Accessibility & Design Validator extension installed.");
});

// Communication link if the content script needs to send messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "ping") {
    sendResponse({ status: "ok" });
  } else if (message.action === "capture-tab") {
    chrome.tabs.captureVisibleTab(sender.tab?.windowId || chrome.windows.WINDOW_ID_CURRENT, { format: "png" }, (dataUrl) => {
      sendResponse({ dataUrl });
    });
    return true; // Keep channel open for async response
  } else if (message.action === "fetch-media") {
    fetch(message.url)
      .then(response => {
        const contentType = response.headers.get("content-type") || "";
        return response.arrayBuffer().then(buffer => ({ contentType, buffer }));
      })
      .then(({ contentType, buffer }) => {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const len = bytes.byteLength;
        // Process in chunks to avoid call stack size exceeded errors on large files
        const chunkSize = 8192;
        for (let i = 0; i < len; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk as any);
        }
        const base64 = btoa(binary);
        sendResponse({ success: true, base64, contentType });
      })
      .catch(err => {
        sendResponse({ success: false, error: err.toString() });
      });
    return true; // Keep channel open for async response
  }
  return true;
});

// Handle extension toolbar icon click to toggle the bottom menu on page
chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;

  // Try to send a message first to see if the content script is already loaded
  chrome.tabs.sendMessage(tab.id, { action: "toggle-extension" }, () => {
    if (chrome.runtime.lastError) {
      // Content script is not active/loaded on this tab, inject it dynamically
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ["assets/content.js"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to inject content script:", chrome.runtime.lastError.message);
        }
      });
    }
  });
});
