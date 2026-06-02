import React from "react";
import ReactDOM from "react-dom/client";
import ContentApp from "./content/ContentApp";

function initExtensionOverlay() {
  // Prevent duplicate mounts
  if (document.getElementById("accessibility-inspector-extension-root")) {
    return;
  }

  const container = document.createElement("div");
  container.id = "accessibility-inspector-extension-root";
  
  // Attach shadow root to prevent page stylesheets from polluting our panel
  const shadowRoot = container.attachShadow({ mode: "open" });

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = chrome.runtime.getURL("assets/popup.css");
  shadowRoot.appendChild(link);

  // Define simple style overrides in shadow dom
  const styles = document.createElement("style");
  styles.textContent = `
    :host {
      all: initial;
    }
  `;
  shadowRoot.appendChild(styles);

  // Mount React target
  const reactTarget = document.createElement("div");
  reactTarget.id = "accessibility-react-root";
  shadowRoot.appendChild(reactTarget);

  document.body.appendChild(container);

  const root = ReactDOM.createRoot(reactTarget);
  root.render(
    <React.StrictMode>
      <ContentApp />
    </React.StrictMode>
  );
}

// Bootstrap overlay on document ready
if (document.readyState === "complete" || document.readyState === "interactive") {
  initExtensionOverlay();
} else {
  document.addEventListener("DOMContentLoaded", initExtensionOverlay);
}
