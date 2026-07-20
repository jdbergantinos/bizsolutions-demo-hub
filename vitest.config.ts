import { defineConfig } from "vitest/config";

// Separate from vite.config.ts so tests don't load the PWA/React plugins.
// The pricing engine is pure TypeScript, so the node environment suffices.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
