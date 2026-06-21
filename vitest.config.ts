import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // КРИТИЧНО ДЛЯ AWS SDK: Використовуємо рідне середовище node замість jsdom [10, 24]
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/e2e/**",
      "**/.next/**",
      "**/coverage/**",
    ],
    // Збільшені таймаути для хмарних з'єднань з AWS
    hookTimeout: 50000,
    testTimeout: 30000,
  },
});
