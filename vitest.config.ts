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
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.next/**",
      "**/coverage/**",
    ],
    coverage: {
      exclude: ["**/e2e/**", "**/node_modules/**"],
      thresholds: {
        lines: 60,
        functions: 80,
        branches: 70,
      },
    },
  },
});
