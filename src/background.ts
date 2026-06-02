// Background service worker for the Accessibility & Design Validator Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log("Accessibility & Design Validator extension installed.");
});

// Communication link if the content script needs to send messages
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "ping") {
    sendResponse({ status: "ok" });
  }
  return true;
});
