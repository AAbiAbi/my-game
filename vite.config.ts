import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  root: "apps/desktop",
  plugins: [react()],
  resolve: {
    alias: {
      "@packages": path.resolve(__dirname, "packages"),
    },
  },
});
