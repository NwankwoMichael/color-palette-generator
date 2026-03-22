import { defineConfig } from "vite";

export default defineConfig({
  base: "/color-palette-generator/", // 👈 repo name here
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
  },
});
