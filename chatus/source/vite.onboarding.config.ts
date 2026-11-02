import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Separate output and entry: never replaces the existing launch/welcome bundle.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist/onboarding",
    rollupOptions: { input: "onboarding.html" },
  },
});
