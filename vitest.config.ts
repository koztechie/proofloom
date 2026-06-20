import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // @ts-ignore - native option for tsconfig paths in recent vite
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Виключаємо системні файли Next.js та Playwright-тести з рантайму Vitest
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.next/**",
      "**/coverage/**",
    ],
  },
});
