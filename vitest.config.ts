import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "c8",
    },
  },
  build: {
    commonjsOptions: {
      include: [],
    },
  },
  optimizeDeps: {
    disabled: false,
  },
});
