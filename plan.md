# Implementation & Loading Plan: Accessibility & Design Validation Browser Extension

This document provides a guide to the structure of the browser extension, its components, and instructions on how to load, run, and test it inside your browser.

---

## 1. Extension Anatomy & Architecture

The project is structured to build both the standard web application dashboard and the isolated browser extension scripts:

*   **`public/manifest.json`**: The Manifest V3 configuration defining permissions, scripts, icons, and popup details.
*   **`popup.html` & `src/popup.tsx`**: The entry point for the browser toolbar popup window (sleek dark dashboard).
*   **`src/background.ts`**: The extension background service worker that manages installation lifecycle events.
*   **`src/content.tsx`**: The entry point injected on standard webpages, setting up the isolated Shadow DOM host.
*   **`src/content/ContentApp.tsx`**: The primary React controller coordinating hover highlights, click locking, and toggles.
*   **`src/content/InspectorOverlay.tsx`**: Computes element coordinates and draws DevTools-style bounding indicators.
*   **`src/content/FloatingPanel.tsx`**: Renders panel tabs (Typography details, Color contrast matrix, Palette scanner, Audit lists).
*   **`src/content/styleExtractor.ts`**: Handles CSS value extractions, Google font loaders, and luminance metrics.
*   **`src/content/auditScanner.ts`**: Contains scripts to test form labels, image alts, heading sequences, and contrast limits.
*   **`src/content/kmeans.ts`**: Clusters dominant color nodes from the page using the K-Means algorithm.

---

## 2. Compilation

Before loading the extension into your browser, compile the assets using the Vite bundle pipeline:

```bash
# 1. Install dependencies (if not done)
npm install

# 2. Compile and bundle assets
npm run build
```

The output assets will be generated in the `dist/` directory, including:
*   `dist/manifest.json`
*   `dist/popup.html`
*   `dist/assets/popup.js`
*   `dist/assets/content.js`
*   `dist/assets/background.js`
*   `dist/assets/index.css` (bundled Tailwind & custom extension styles)

---

## 3. How to Load and Test the Extension

Follow these steps to load the unpacked extension in Google Chrome, Microsoft Edge, or Brave:

1.  Open your browser and navigate to the extensions page:
    *   **Chrome**: Go to `chrome://extensions`
    *   **Edge**: Go to `edge://extensions`
    *   **Brave**: Go to `brave://extensions`
2.  Enable **Developer mode** by toggling the switch in the top-right corner.
3.  Click the **Load unpacked** button in the top-left corner.
4.  Select the **`dist`** directory inside this project folder:
    `/run/media/naim0018/Primary1TB/Projects/accessibility-validation/dist`
5.  Pin the **Accessibility & Design Validator** extension to your browser toolbar.
6.  Open a standard website (e.g., `https://example.com` or `http://localhost:5173`) and click the extension icon to run it!

---

## 4. Key Capabilities Built

| Pillar / System | Implemented Capability |
| :--- | :--- |
| **Typography Intelligence** | Computed size, weights, line-height, letter-spacing, and fallback families. Identifies loader sources (Google Fonts vs. System Local). |
| **Color & Contrast** | Resolves real background colors through transparency trees. Calculates WCAG relative contrast and maps passes to AA/AAA levels. |
| **Visual Overlay** | Traces elements with box outlines and displays stats overlays in real-time. |
| **Palette Generator** | Extracts page color nodes and groups them into 6 centroids via K-Means. Offers complementary and triadic color schemes. |
| **Diagnostics Scan** | Runs automated DOM audits flagging skipped headings, missing alts, and unlabeled form inputs. Contains scroll-to-locate features. |
