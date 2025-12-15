import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // the Express API runs on 4000; same-origin calls in dev
    proxy: { "/api": "http://localhost:4000" },
  },
});
