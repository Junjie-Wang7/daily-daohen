import { rmSync } from "node:fs";

try {
  rmSync(".next", { recursive: true, force: true });
} catch {
  // Ignore cleanup failures and let the build surface any real issue.
}
