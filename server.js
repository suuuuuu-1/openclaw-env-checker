#!/usr/bin/env node
import { execSync } from "node:child_process";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import express from "express";

const IS_WIN = process.platform === "win32";
const IS_MAC = process.platform === "darwin";
const MIN_NODE = [22, 12, 0];
const home = process.env.HOME || process.env.USERPROFILE || "";

// Sort version directory names by semver (descending)
function semverSort(dirs) {
  return dirs.sort((a, b) => {
    const pa = a.replace(/^v/, "").split(".").map(Number);
    const pb = b.replace(/^v/, "").split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if ((pb[i] || 0) !== (pa[i] || 0)) return (pb[i] || 0) - (pa[i] || 0);
    }
    return 0;
  });
}

// Find node binary — pkg exe may not have it in PATH
function findNodeBinary() {
  const candidates = [];
  if (IS_WIN) {
    candidates.push(
      join(process.env.ProgramFiles || "C:\\Program Files", "nodejs", "node.exe"),
      join(process.env.LOCALAPPDATA || "", "Programs", "nodejs", "node.exe"),
      "C:\\Program Files\\nodejs\\node.exe",
    );
    const nvmHome = process.env.NVM_HOME || join(home, "AppData", "Roaming", "nvm");
    try {
      if (existsSync(nvmHome)) {
        semverSort(readdirSync(nvmHome).filter(d => d.startsWith("v")))
          .forEach(d => candidates.push(join(nvmHome, d, "node.exe")));
      }
    } catch {}
  } else {
    if (IS_MAC) {
      candidates.push("/opt/homebrew/bin/node", "/usr/local/bin/node");
    } else {
      candidates.push("/usr/bin/node", "/usr/local/bin/node", "/snap/node/current/bin/node");
    }
    candidates.push(join(home, ".nvm/current/bin/node"), join(home, ".fnm/current/bin/node"));
    const nvmDir = process.env.NVM_DIR || join(home, ".nvm");
    try {
      const versionsDir = join(nvmDir, "versions", "node");
      if (existsSync(versionsDir)) {
        semverSort(readdirSync(versionsDir).filter(d => d.startsWith("v")))
          .forEach(d => candidates.push(join(versionsDir, d, "bin", "node")));
      }
    } catch {}
  }
  for (const c of candidates) {
    if (c && existsSync(c)) return c;
  }
  return null;
}

// Ensure common paths are in PATH for npm/git commands
if (IS_WIN) {
  const extraPaths = [
    join(process.env.ProgramFiles || "C:\\Program Files", "nodejs"),
    join(process.env.LOCALAPPDATA || "", "Programs", "nodejs"),
    join(process.env.APPDATA || "", "npm"),
  ];
  const nvmHome = process.env.NVM_HOME || join(home, "AppData", "Roaming", "nvm");
  try {
    if (existsSync(nvmHome)) {
      semverSort(readdirSync(nvmHome).filter(d => d.startsWith("v")))
        .forEach(d => extraPaths.push(join(nvmHome, d)));
    }
  } catch {}
  process.env.PATH = extraPaths.filter(Boolean).join(";") + ";" + (process.env.PATH || "");
} else {
  const extraPaths = [
    "/opt/homebrew/bin",
    "/usr/local/bin",
    join(home, ".nvm/current/bin"),
    join(home, ".fnm/current/bin"),
  ];
  const nvmDir = process.env.NVM_DIR || join(home, ".nvm");
  try {
    const versionsDir = join(nvmDir, "versions", "node");
    if (existsSync(versionsDir)) {
      semverSort(readdirSync(versionsDir).filter(d => d.startsWith("v")))
        .forEach(d => extraPaths.push(join(versionsDir, d, "bin")));
    }
  } catch {}
  process.env.PATH = extraPaths.join(":") + ":" + (process.env.PATH || "");
}

const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/api/check", async (req, res) => {
  const results = [];

  // Node.js check — try PATH first, then scan known locations
  try {
    let version;
    try {
      version = execSync("node -v", { stdio: "pipe" }).toString().trim();
    } catch {
      const nodePath = findNodeBinary();
      if (!nodePath) throw new Error("not found");
      version = execSync(`"${nodePath}" -v`, { stdio: "pipe", shell: true }).toString().trim();
    }
    const match = version.match(/^v(\d+)\.(\d+)\.(\d+)/);
    const parts = match ? [parseInt(match[1], 10), parseInt(match[2], 10), parseInt(match[3], 10)] : [0, 0, 0];
    const meetsMin = parts[0] > MIN_NODE[0] || (parts[0] === MIN_NODE[0] && (parts[1] > MIN_NODE[1] || (parts[1] === MIN_NODE[1] && parts[2] >= MIN_NODE[2])));
    results.push({
      name: "Node.js >= 22.12.0",
      status: meetsMin ? "pass" : "fail",
      message: `Version: ${version}`,
    });
  } catch {
    results.push({ name: "Node.js >= 22.12.0", status: "fail", message: "Not installed" });
  }

  // npm check
  try {
    const version = execSync("npm -v", { stdio: "pipe" }).toString().trim();
    results.push({ name: "npm available", status: "pass", message: `Version: ${version}` });
  } catch (err) {
    results.push({ name: "npm available", status: "fail", message: err.message });
  }

  // Git check
  try {
    const version = execSync("git --version", { stdio: "pipe" }).toString().trim();
    results.push({ name: "Git available", status: "pass", message: version });
  } catch (err) {
    results.push({ name: "Git available", status: "fail", message: err.message });
  }

  // Network checks
  const checks = [
    { name: "Network: github.com", cmd: "git ls-remote https://github.com/git/git.git HEAD" },
    { name: "Network: registry.npmjs.org", cmd: "npm ping --registry https://registry.npmjs.org" },
    { name: "Network: direct.evolink.ai", cmd: IS_WIN ? 'curl -s -o nul https://direct.evolink.ai' : 'curl -s -o /dev/null https://direct.evolink.ai' },
  ];

  for (const check of checks) {
    try {
      execSync(check.cmd, { stdio: "pipe", timeout: 15000 });
      results.push({ name: check.name, status: "pass", message: "OK" });
    } catch {
      results.push({ name: check.name, status: "fail", message: "Cannot access" });
    }
  }

  res.json({ results });
});

app.listen(PORT, () => {
  console.log(`Environment checker running at http://localhost:${PORT}`);
});
