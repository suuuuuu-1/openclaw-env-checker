#!/usr/bin/env node
import { execSync } from "node:child_process";
import { homedir } from "node:os";

const IS_WIN = process.platform === "win32";
const MIN_NODE_MAJOR = 22;

console.log("=== OpenClaw Manager 环境检查 ===\n");

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    const result = fn();
    if (result === true || result === undefined) {
      console.log(`✓ ${name}`);
      passed++;
    } else {
      console.log(`✗ ${name}: ${result}`);
      failed++;
    }
  } catch (err) {
    console.log(`✗ ${name}: ${err.message}`);
    failed++;
  }
}

// 1. Node.js 版本
check("Node.js >= 22.12.0", () => {
  const version = process.version;
  const major = parseInt(version.match(/^v(\d+)/)[1], 10);
  if (major < MIN_NODE_MAJOR) {
    return `当前版本 ${version}，需要 >= 22.12.0`;
  }
  console.log(`  版本: ${version}`);
  return true;
});

// 2. npm
check("npm 可用", () => {
  const version = execSync("npm -v", { stdio: "pipe" }).toString().trim();
  console.log(`  版本: ${version}`);
  return true;
});

// 3. Git
check("Git 可用", () => {
  const version = execSync("git --version", { stdio: "pipe" }).toString().trim();
  console.log(`  ${version}`);
  return true;
});

// 4. 网络 - github.com
check("网络: github.com", () => {
  try {
    execSync("git ls-remote https://github.com/git/git.git HEAD", {
      stdio: "pipe",
      timeout: 10000,
    });
    return true;
  } catch {
    return "无法访问，请检查网络或代理";
  }
});

// 5. 网络 - registry.npmjs.org
check("网络: registry.npmjs.org", () => {
  try {
    execSync("npm ping --registry https://registry.npmjs.org", {
      stdio: "pipe",
      timeout: 10000,
    });
    return true;
  } catch {
    return "无法访问，请检查网络或代理";
  }
});

// 6. 网络 - direct.evolink.ai
check("网络: direct.evolink.ai", () => {
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
    return "无法访问，请检查网络";
  }
});

// 7. npm 全局安装权限
check("npm 全局安装权限", () => {
  try {
    const prefix = execSync("npm config get prefix", { stdio: "pipe" })
      .toString()
      .trim();
    console.log(`  prefix: ${prefix}`);

    // 检查是否在用户目录
    const home = homedir();
    if (prefix.startsWith(home)) {
      return true;
    }

    // 检查是否有写入权限
    if (IS_WIN) {
      return "Windows 需要管理员权限运行";
    } else {
      return "可能需要 sudo 或配置用户级 npm prefix";
    }
  } catch {
    return "无法检测";
  }
});

// 8. OpenClaw CLI（可选）
check("OpenClaw CLI（可选）", () => {
  try {
    const version = execSync("openclaw --version", { stdio: "pipe" })
      .toString()
      .trim();
    console.log(`  版本: ${version}`);
    return true;
  } catch {
    return "未安装（首次运行会自动安装）";
  }
});

console.log(`\n=== 检查完成 ===`);
console.log(`通过: ${passed} 项`);
console.log(`失败: ${failed} 项\n`);

if (failed > 0) {
  console.log("请先解决失败项，再运行 OpenClaw Manager");
  process.exit(1);
} else {
  console.log("✓ 环境检查通过，可以运行 OpenClaw Manager");
  process.exit(0);
}
