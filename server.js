#!/usr/bin/env node
import { execSync } from "node:child_process";
import express from "express";

const app = express();
const PORT = 3000;

app.use(express.static("public"));

app.get("/api/check", async (req, res) => {
  const results = [];

  // Node.js check
  try {
    const version = execSync("node -v", { stdio: "pipe" }).toString().trim();
    const major = parseInt(version.match(/^v(\d+)/)[1], 10);
    results.push({
      name: "Node.js >= 22.12.0",
      status: major >= 22 ? "pass" : "fail",
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
  const IS_WIN = process.platform === "win32";
  const checks = [
    { name: "Network: github.com", cmd: "git ls-remote https://github.com/git/git.git HEAD" },
    { name: "Network: registry.npmjs.org", cmd: "npm ping --registry https://registry.npmjs.org" },
    { name: "Network: direct.evolink.ai", cmd: IS_WIN ? 'curl -s -o nul -w "%{http_code}" https://direct.evolink.ai' : 'curl -s -o /dev/null -w "%{http_code}" https://direct.evolink.ai' },
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
