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
  }
  return true;
});

// Handle extension toolbar icon click to toggle the bottom menu on page
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: "toggle-extension" }).catch((err) => {
      console.warn("Could not send toggle-extension message to tab:", err);
    });
  }
});
