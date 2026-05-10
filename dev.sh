#!/usr/bin/env bash
# Chạy Vite bằng Node portable trong .toolchain (không cần npm toàn hệ thống).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export PATH="$ROOT/.toolchain/nodejs/bin:$PATH"
exec npm run dev -- --host 127.0.0.1 --port 5173 "$@"
