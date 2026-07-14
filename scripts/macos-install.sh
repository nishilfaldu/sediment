#!/usr/bin/env bash
# Clears macOS quarantine on Sediment.app so Gatekeeper allows first launch.
# Usage: bash macos-install.sh [/Applications/Sediment.app]
set -euo pipefail

APP="${1:-/Applications/Sediment.app}"

if [ ! -d "$APP" ]; then
  echo "Sediment.app not found at: $APP"
  echo ""
  echo "1. Download the DMG from https://github.com/nishilfaldu/sediment/releases/latest"
  echo "2. Drag Sediment.app into Applications"
  echo "3. Run this script again"
  exit 1
fi

xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true
xattr -cr "$APP" 2>/dev/null || true

echo "Quarantine cleared on: $APP"
echo ""
echo "Opening Sediment..."
echo "If macOS still blocks it:"
echo "  • Right-click Sediment.app → Open"
echo "  • Or System Settings → Privacy & Security → Open Anyway"
open "$APP"
