import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const mode = process.argv[2];
if (mode !== "dev" && mode !== "start") {
  console.error('Usage: node next-with-port.mjs <dev|start>');
  process.exit(1);
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const envPath = path.join(root, ".env");
const envLocalPath = path.join(root, ".env.local");
if (existsSync(envPath)) {
  config({ path: envPath });
}
if (existsSync(envLocalPath)) {
  config({ path: envLocalPath, override: true });
}

const raw = process.env.PORT;
const port =
  raw !== undefined && String(raw).trim() !== ""
    ? String(raw).trim()
    : "4000";

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(
  process.execPath,
  [nextBin, mode, "-p", port],
  {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
    return;
  }
  process.exit(code ?? 0);
});
