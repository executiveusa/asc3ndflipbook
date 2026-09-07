#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
output_dir="${project_root}/vercel-static"

cd "${project_root}"

# The interactive source remains the system of record. Compile it first so a
# broken React/TypeScript change can never ship behind an older static shell.
npm run build

[[ -f "${output_dir}/index.html" ]] || {
  echo "Missing Vercel entry: vercel-static/index.html" >&2
  exit 66
}

# The current vinext adapter emits a Cloudflare Worker, not a standalone HTML
# entry. The checked-in static shell is therefore an intentional deployment
# artifact, kept alongside the exact source that produced it.
node "${project_root}/scripts/verify-vercel-static.mjs" "${output_dir}"

echo "Verified Vercel artifact: vercel-static/index.html"
