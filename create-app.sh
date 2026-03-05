#!/bin/bash

# Create .app bundle structure
APP_NAME="OpenClaw Environment Checker"
APP_DIR="dist/$APP_NAME.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

# Detect architecture (can be overridden via argument: ./create-app.sh arm64|x64)
if [ -n "$1" ]; then
  ARCH="$1"
else
  ARCH=$(uname -m)
  [ "$ARCH" != "arm64" ] && ARCH="x64"
fi
BINARY="openclaw-check-macos-$ARCH"

echo "Creating .app bundle for $ARCH..."

# Create directories
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# Copy binary
cp "dist/$BINARY" "$MACOS_DIR/openclaw-check"
chmod +x "$MACOS_DIR/openclaw-check"

# Create launcher script that opens Terminal
cat > "$MACOS_DIR/launcher.sh" << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
osascript -e "tell application \"Terminal\"
    do script \"cd '$DIR' && ./openclaw-check\"
    activate
end tell"
EOF

chmod +x "$MACOS_DIR/launcher.sh"

# Create Info.plist
cat > "$CONTENTS_DIR/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>launcher.sh</string>
    <key>CFBundleIdentifier</key>
    <string>com.openclaw.env-checker</string>
    <key>CFBundleName</key>
    <string>OpenClaw Environment Checker</string>
    <key>CFBundleVersion</key>
    <string>1.0.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.13</string>
</dict>
</plist>
EOF

echo ".app bundle created at: $APP_DIR"

# Create DMG
echo "Creating DMG..."
DMG_NAME="openclaw-env-checker-macos-$ARCH.dmg"
hdiutil create -volname "OpenClaw Environment Checker" -srcfolder "$APP_DIR" -ov -format UDZO "dist/$DMG_NAME"

echo "DMG created at: dist/$DMG_NAME"
