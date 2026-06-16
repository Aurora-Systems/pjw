import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
  resolve: {
    // Mirror the tsconfig "@/*" -> project root alias so libs using @/… imports resolve.
    alias: { "@": path.resolve(process.cwd()) },
  },
});
