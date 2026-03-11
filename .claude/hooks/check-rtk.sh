#!/usr/bin/env bash
# SessionStart hook: check if rtk (Rust Token Killer) is installed.
# Outputs install instructions to stdout (injected as Claude context) if missing.

if command -v rtk &>/dev/null; then
  exit 0
fi

OS="$(uname -s)"
ARCH="$(uname -m)"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  rtk (Rust Token Killer) is not installed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

case "$OS" in
  Darwin)
    echo "  Recommended (macOS):"
    echo "    brew install rtk"
    echo ""
    echo "  Or via install script:"
    echo "    curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh"
    ;;
  Linux)
    echo "  Recommended (Linux):"
    echo "    curl -fsSL https://raw.githubusercontent.com/rtk-ai/rtk/refs/heads/master/install.sh | sh"
    echo ""
    echo "  Binary (${ARCH}):"
    if [ "$ARCH" = "x86_64" ]; then
      echo "    https://github.com/rtk-ai/rtk/releases → rtk-x86_64-unknown-linux-musl.tar.gz"
    else
      echo "    https://github.com/rtk-ai/rtk/releases → rtk-aarch64-unknown-linux-gnu.tar.gz"
    fi
    ;;
  *)
    echo "  Windows / other:"
    echo "    https://github.com/rtk-ai/rtk/releases → rtk-x86_64-pc-windows-msvc.zip"
    ;;
esac

echo ""
echo "  Or build from source:"
echo "    cargo install --git https://github.com/rtk-ai/rtk"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
