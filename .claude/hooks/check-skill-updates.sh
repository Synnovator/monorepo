#!/usr/bin/env bash
# SessionStart hook: check if anthropic-skills submodule has upstream updates.
# Outputs a message to stdout (injected as Claude context) if updates are found.
# Designed to be fast — uses git fetch --dry-run to avoid modifying the worktree.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SUBMODULE_PATH=".claude/vendor/anthropic-skills"
SUBMODULE_DIR="$REPO_ROOT/$SUBMODULE_PATH"

# Skip if submodule not initialized
if [ ! -d "$SUBMODULE_DIR/.git" ] && [ ! -f "$SUBMODULE_DIR/.git" ]; then
  exit 0
fi

# Fetch latest from remote (quiet, no working tree changes)
cd "$SUBMODULE_DIR"
git fetch origin main --quiet 2>/dev/null || exit 0

LOCAL_HEAD=$(git rev-parse HEAD 2>/dev/null)
REMOTE_HEAD=$(git rev-parse origin/main 2>/dev/null)

if [ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]; then
  BEHIND=$(git rev-list --count HEAD..origin/main 2>/dev/null || echo "?")
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  anthropic-skills submodule is ${BEHIND} commit(s) behind upstream"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  To update, run:"
  echo "    cd $SUBMODULE_PATH && git pull origin main && cd - && git add $SUBMODULE_PATH && git commit -m 'chore: update anthropic-skills submodule'"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi
