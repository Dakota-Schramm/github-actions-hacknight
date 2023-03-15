import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.ts", "**/*.test.ts"],
    passWithNoTests: true,
    coverage: {
      provider: "c8",
    },
  },
});

