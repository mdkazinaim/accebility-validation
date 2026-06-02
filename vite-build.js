import { build } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  console.log("=== BUILD PHASE 1: WEB APP DASHBOARD ===");
  await build({
    configFile: path.resolve(__dirname, "vite.config.ts"),
    build: {
      emptyOutDir: true,
      modulePreload: false,
      rollupOptions: {
        input: {
          web: path.resolve(__dirname, "index.html"),
        },
        output: {
          entryFileNames: "assets/[name].js",
          chunkFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
        }
      }
    }
  });

  console.log("\n=== BUILD PHASE 2: SELF-CONTAINED POPUP ===");
  await build({
    configFile: path.resolve(__dirname, "vite.config.ts"),
    build: {
      emptyOutDir: false,
      modulePreload: false,
      rollupOptions: {
        input: {
          popup: path.resolve(__dirname, "popup.html"),
        },
        output: {
          inlineDynamicImports: true,
          entryFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
        }
      }
    }
  });

  console.log("\n=== BUILD PHASE 3: SELF-CONTAINED CONTENT SCRIPT ===");
  await build({
    configFile: path.resolve(__dirname, "vite.config.ts"),
    build: {
      emptyOutDir: false,
      cssCodeSplit: false,
      modulePreload: false,
      rollupOptions: {
        input: {
          content: path.resolve(__dirname, "src/content.tsx"),
        },
        output: {
          format: "iife",
          inlineDynamicImports: true,
          entryFileNames: "assets/[name].js",
          assetFileNames: "assets/[name].[ext]",
        }
      }
    }
  });

  console.log("\n=== BUILD PHASE 4: SELF-CONTAINED BACKGROUND WORKER ===");
  await build({
    configFile: path.resolve(__dirname, "vite.config.ts"),
    build: {
      emptyOutDir: false,
      modulePreload: false,
      rollupOptions: {
        input: {
          background: path.resolve(__dirname, "src/background.ts"),
        },
        output: {
          format: "iife",
          inlineDynamicImports: true,
          entryFileNames: "assets/[name].js",
        }
      }
    }
  });

  const redirectsPath = path.resolve(__dirname, "dist/_redirects");
  if (fs.existsSync(redirectsPath)) {
    fs.unlinkSync(redirectsPath);
    console.log("Removed reserved _redirects file from extension package.");
  }
  
  console.log("\n=== EXTENSION BUILD COMPLETE ===");
}

run().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
