#!/bin/sh
# Project-scoped dependencies only; no changes to global PATH or shared tooling.
set -eu
cd "$(dirname "$0")/.."
if ! command -v deno >/dev/null 2>&1; then
  echo "Deno is required. Install Deno from its official distribution." >&2
  exit 1
fi
if ! command -v rsvg-convert >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    brew install librsvg
  else
    echo "Install librsvg (Debian: apt install librsvg2-bin), then rerun." >&2
    exit 1
  fi
fi
if ! command -v dwebp >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    brew install webp
  else
    echo "Install libwebp decoder tools (Debian: apt install webp), then rerun." >&2
    exit 1
  fi
fi
deno task check
dwebp -version
deno --version
rsvg-convert --version
if [ "$(uname -s)" = Darwin ] && ! command -v ego-browser >/dev/null 2>&1; then
  echo "Portable setup ready. Mac Ego default is unavailable; use: deno task preview:png rsvg"
else
  echo "Ready: Mac PNG default is Ego; other platforms use native librsvg."
fi
echo "No pnpm/Node packages are required. Portable override: deno task preview:png rsvg."
echo "Existing artwork is offline. New AI artwork requires an external generation provider; this repo has no generation API integration."
echo "Cloudflare: no deployment command or credential integration; public deployment requires separate authority."
