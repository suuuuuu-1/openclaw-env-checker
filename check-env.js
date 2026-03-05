#!/usr/bin/env node
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const IS_WIN = process.platform === "win32";
const MIN_NODE_MAJOR = 22;

console.log("Running environment checks...\n");

const results = [];

// Node.js check
try {
  const version = process.version;
  const major = parseInt(version.match(/^v(\d+)/)[1], 10);
  results.push({
    name: "Node.js >= 22.12.0",
    status: major >= MIN_NODE_MAJOR ? "pass" : "fail",
    message: `Version: ${version}`,
  });
} catch (err) {
  results.push({ name: "Node.js >= 22.12.0", status: "fail", message: err.message });
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

// Generate HTML
const passed = results.filter(r => r.status === "pass").length;
const failed = results.filter(r => r.status === "fail").length;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Environment Check Results</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #fafafa;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.container {
  width: 100%;
  max-width: 600px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  padding: 40px;
}
h1 {
  font-size: 28px;
  font-weight: 700;
  color: #09090b;
  margin-bottom: 8px;
  text-align: center;
}
.subtitle {
  text-align: center;
  color: #a1a1aa;
  font-size: 14px;
  margin-bottom: 32px;
}
.check-item {
  padding: 16px;
  background: #fafafa;
  border-radius: 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.status {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}
.status.pass { background: #22c55e; }
.status.fail { background: #ef4444; }
.check-info { flex: 1; }
.check-name {
  font-size: 15px;
  font-weight: 600;
  color: #09090b;
  margin-bottom: 4px;
}
.check-message {
  font-size: 13px;
  color: #71717a;
}
.summary {
  margin-top: 24px;
  padding: 20px;
  background: #f9f9fb;
  border-radius: 12px;
  text-align: center;
}
.summary-text {
  font-size: 16px;
  font-weight: 600;
  color: #09090b;
}
</style>
</head>
<body>
<div class="container">
  <h1>Environment Check Results</h1>
  <div class="subtitle">OpenClaw Manager</div>
  <div id="results">
${results.map(r => `    <div class="check-item">
      <div class="status ${r.status}"></div>
      <div class="check-info">
        <div class="check-name">${r.name}</div>
        <div class="check-message">${r.message}</div>
      </div>
    </div>`).join('\n')}
  </div>
  <div class="summary">
    <div class="summary-text">Passed: ${passed} | Failed: ${failed}</div>
  </div>
</div>
</body>
</html>`;

const outputPath = join(process.cwd(), "check-result.html");
writeFileSync(outputPath, html);

console.log(`Check complete. Results saved to: ${outputPath}\n`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}\n`);

// Open browser
const openCmd = IS_WIN ? `start ${outputPath}` : process.platform === "darwin" ? `open ${outputPath}` : `xdg-open ${outputPath}`;

try {
  execSync(openCmd);
  console.log("Browser opened with results.");
} catch (err) {
  console.log(`Please open ${outputPath} in your browser.`);
}

process.exit(failed > 0 ? 1 : 0);
