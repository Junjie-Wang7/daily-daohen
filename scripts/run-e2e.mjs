import { spawn, spawnSync } from "node:child_process";
import net from "node:net";

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not determine an available port"));
        return;
      }

      const { port } = address;
      server.close(() => resolve(String(port)));
    });
    server.on("error", reject);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Server is not ready yet.
    }

    await wait(1000);
  }

  throw new Error(`Timed out waiting for ${url}`);
}

function terminate(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

function spawnCommand(command, extraEnv = {}) {
  if (process.platform === "win32") {
    return spawn("cmd.exe", ["/c", command], {
      stdio: "inherit",
      env: {
        ...process.env,
        ...extraEnv,
      },
    });
  }

  return spawn("sh", ["-c", command], {
    stdio: "inherit",
    env: {
      ...process.env,
      ...extraEnv,
    },
  });
}

let exitCode = 1;
let cleanup = () => {};

try {
  const port = process.env.PLAYWRIGHT_PORT || (await getAvailablePort());
  const baseUrl = `http://127.0.0.1:${port}`;
  const server = spawnCommand(`npm run dev -- --hostname 127.0.0.1 --port ${port}`);
  cleanup = () => terminate(server);

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);

  await waitForServer(baseUrl);

  exitCode = await new Promise((resolve, reject) => {
    const runner = spawnCommand("npx playwright test --config playwright.config.ts", {
      PLAYWRIGHT_BASE_URL: baseUrl,
    });

    runner.on("error", reject);
    runner.on("exit", (code) => resolve(code ?? 1));
  });

  cleanup();
} finally {
  cleanup();
}

process.exit(exitCode);
