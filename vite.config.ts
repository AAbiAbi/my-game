import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "apps/desktop",
  plugins: [react()],
  define: {
    "import.meta.env.VITE_PROJECT_ROOT": JSON.stringify(path.resolve(__dirname)),
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
