/**
 * Frees Soundboard dev ports and orphaned watch processes before starting.
 */
import { execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const PORTS = [4000, 5173, 5174];

function killMatching(commandPattern) {
  try {
    const lines = execSync(`pgrep -fl "${commandPattern}" 2>/dev/null`, {
      encoding: "utf8",
    }).trim();
    if (!lines) return;
    for (const line of lines.split("\n")) {
      if (!line.includes("cs278-project")) continue;
      const pid = Number(line.trim().split(/\s+/)[0]);
      if (!pid) continue;
      try {
        process.kill(pid, "SIGKILL");
        console.log(`Stopped pid ${pid}: ${line.slice(line.indexOf(" ") + 1)}`);
      } catch {
        /* gone */
      }
    }
  } catch {
    /* no matches */
  }
}

async function killPort(port) {
  for (let attempt = 0; attempt < 2; attempt++) {
    let pids = [];
    try {
      const out = execSync(`lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null`, {
        encoding: "utf8",
      }).trim();
      pids = out ? out.split("\n").filter(Boolean) : [];
    } catch {
      return;
    }
    if (pids.length === 0) return;
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGKILL");
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        /* gone */
      }
    }
    await sleep(400);
  }
}

killMatching("tsx watch src/index.ts");
killMatching("concurrently -n api,web");
killMatching("node_modules/.bin/vite");

for (const port of PORTS) {
  await killPort(port);
}

await sleep(300);
