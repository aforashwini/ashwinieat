import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from GitHub Pages at https://aforashwini.github.io/ashwinieat/
  base: "/ashwinieat/",
  server: {
    port: 3000,
  },
});
