import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/lib/**/*.ts", "src/components/admin/charts/tokens.ts"],
      exclude: [
        "src/lib/supabase/**",
        "src/lib/admin/actions.ts",
        "src/lib/admin/queries.ts",
        "src/lib/admin/activity.ts",
        "src/lib/admin/auth.ts",
        "src/lib/content.ts",
        "src/lib/metadata.ts",
        "src/lib/types.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
