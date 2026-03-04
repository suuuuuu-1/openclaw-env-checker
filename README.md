# OpenClaw Environment Checker

OpenClaw Manager 环境检查工具

## 使用方法

### 开发模式
```bash
npm install
node check-env.js
```

### 构建独立可执行文件
```bash
npm install
npm run build
npm run package
```

生成的可执行文件在 `dist/` 目录：
- `openclaw-check-win-x64.exe` - Windows
- `openclaw-check-macos-x64` - macOS Intel
- `openclaw-check-macos-arm64` - macOS Apple Silicon
- `openclaw-check-linux-x64` - Linux

## 检查项目

1. Node.js >= 22.12.0
2. npm 可用
3. Git 可用
4. 网络连通性（github.com、npmjs.org、evolink.ai）
5. npm 全局安装权限
6. OpenClaw CLI（可选）
