#!/usr/bin/env node
import { execSync } from "node:child_process";
import { createInterface } from "node:readline";

const IS_WIN = process.platform === "win32";
const MIN_NODE_MAJOR = 22;

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

console.log("=== OpenClaw Manager Environment Check ===\n");

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`${GREEN}✓ ${name}${RESET}`);
      passed++;
    } else {
      console.log(`${RED}✗ ${name}: ${result}${RESET}`);
      failed++;
    }
  } catch (err) {
    console.log(`${RED}✗ ${name}: ${err.message}${RESET}`);
    failed++;
  }
}

// 1. Node.js version
check("Node.js >= 22.12.0", () => {
  const version = process.version;
  const major = parseInt(version.match(/^v(\d+)/)[1], 10);
  if (major < MIN_NODE_MAJOR) {
    return `Current version ${version}, requires >= 22.12.0`;
  }
  console.log(`  Version: ${version}`);
  return true;
});

// 2. npm
check("npm available", () => {
  const version = execSync("npm -v", { stdio: "pipe" }).toString().trim();
  console.log(`  Version: ${version}`);
  return true;
});

// 3. Git
check("Git available", () => {
  const version = execSync("git --version", { stdio: "pipe" }).toString().trim();
  console.log(`  ${version}`);
  return true;
});

// 4. Network - github.com
check("Network: github.com", () => {
  try {
    execSync("git ls-remote https://github.com/git/git.git HEAD", {
      stdio: "pipe",
      timeout: 10000,
    });
    return true;
  } catch {
    return "Cannot access, please check network or proxy";
  }
});

// 5. Network - registry.npmjs.org
check("Network: registry.npmjs.org", () => {
  try {
    execSync("npm ping --registry https://registry.npmjs.org", {
      stdio: "pipe",
      timeout: 10000,
    });
    return true;
  } catch {
    return "Cannot access, please check network or proxy";
  }
});

// 6. Network - direct.evolink.ai
check("Network: direct.evolink.ai", () => {
  try {
    if (IS_WIN) {
      execSync("curl -s -o nul -w \"%{http_code}\" https://direct.evolink.ai", {
        stdio: "pipe",
        timeout: 10000,
      });
    } else {
      execSync("curl -s -o /dev/null -w \"%{http_code}\" https://direct.evolink.ai", {
        stdio: "pipe",
        timeout: 10000,
      });
    }
    return true;
  } catch {
    return "Cannot access, please check network";
  }
});

console.log(`\n=== Check Complete ===`);
console.log(`${GREEN}Passed: ${passed}${RESET}`);
console.log(`${RED}Failed: ${failed}${RESET}\n`);

if (failed > 0) {
  console.log(`${RED}Please resolve failed items before running OpenClaw Manager${RESET}`);
} else {
  console.log(`${GREEN}✓ Environment check passed, ready to run OpenClaw Manager${RESET}`);
}

// Wait for user input before closing (especially for Windows)
console.log("\nPress Enter to exit...");
const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("", () => {
  rl.close();
  process.exit(failed > 0 ? 1 : 0);
});
