import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setupTests.js"],
    include: ["test/**/*.{test,spec}.{js,jsx,ts,tsx}"],
    coverage: {
      provider: "v8",
      reportsDirectory: "coverage",
      reporter: ["text", "html", "lcov", "json-summary"],
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: [
        "src/main.jsx",
        "src/**/*.d.ts",
      ],
    },
  },
});
