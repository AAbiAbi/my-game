import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { readFileSync } from "fs";

// Read VITE_PUBSUB_URL from apps/desktop/.env.local
let pubsubUrl = "";
try {
  const envLocal = readFileSync(path.resolve(__dirname, "apps/desktop/.env.local"), "utf-8");
  const match = envLocal.match(/VITE_PUBSUB_URL="?([^"\n]+)"?/);
  if (match) pubsubUrl = match[1];
} catch {
  // .env.local doesn't exist, WebSocket will be skipped
}

export default defineConfig({
  root: "apps/desktop",
  plugins: [react()],
  define: {
    "import.meta.env.VITE_PROJECT_ROOT": JSON.stringify(path.resolve(__dirname)),
    "import.meta.env.VITE_PUBSUB_URL": JSON.stringify(pubsubUrl),
  },
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@packages": path.resolve(__dirname, "packages"),
    },
  },
});
