#!/usr/bin/env bash
set -euo pipefail

# --- CONFIG ---
SRC_DIR="fuzz"                  # source files to archive
OUT_DIR="compressed"            # where .zip files go
RESTORE_DIR="decompressed"      # where extracted files go
CLI="npx tsx droply.ts"         # your CLI; swap to 'zip' if you prefer system zip

# --- reset dirs safely ---
mkdir -p "$OUT_DIR" "$RESTORE_DIR"
# remove everything inside, not the dirs themselves
find "$OUT_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
find "$RESTORE_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +

echo "==> Snapshot original hashes"
WORK=".zip_roundtrip"
rm -rf "$WORK" && mkdir -p "$WORK"
find "$SRC_DIR" -type f -print0 \
 | xargs -0 -I{} sh -c 'sha256sum "$1"' _ {} \
 | sort -k2 > "$WORK/original.sha256"

# ---------- Case 1: ZIP store-only (archive-only, no compression) ----------
echo "==> C1: ZIP store-only (archive, no compression)"
# Using your CLI:
$CLI compress "$SRC_DIR" --archive zip --algo none --output "$OUT_DIR/c1-store.zip"
# If you want system zip instead, comment the line above and use:
# (cd "$SRC_DIR" && zip -qr -0 "../$OUT_DIR/c1-store.zip" .)

mkdir -p "$RESTORE_DIR/c1"
unzip -qq "$OUT_DIR/c1-store.zip" -d "$RESTORE_DIR/c1"

find "$RESTORE_DIR/c1" -type f -print0 \
 | xargs -0 -I{} sh -c 'sha256sum "$1"' _ {} \
 | sed "s#$RESTORE_DIR/c1/#$SRC_DIR/#" | sort -k2 > "$WORK/c1.sha256"

if diff -u "$WORK/original.sha256" "$WORK/c1.sha256" >/dev/null; then
  echo "✅ C1 PASS"
else
  echo "❌ C1 FAIL"; diff -u "$WORK/original.sha256" "$WORK/c1.sha256" || true; exit 1
fi

# ---------- Case 2: ZIP deflate (archive + compression) ----------
echo "==> C2: ZIP deflate (archive + compression)"
# Using your CLI:
$CLI compress "$SRC_DIR" --archive zip --algo zip --output "$OUT_DIR/c2-deflate.zip"
# System zip alternative:
# (cd "$SRC_DIR" && zip -qr -9 "../$OUT_DIR/c2-deflate.zip" .)

mkdir -p "$RESTORE_DIR/c2"
unzip -qq "$OUT_DIR/c2-deflate.zip" -d "$RESTORE_DIR/c2"

find "$RESTORE_DIR/c2" -type f -print0 \
 | xargs -0 -I{} sh -c 'sha256sum "$1"' _ {} \
 | sed "s#$RESTORE_DIR/c2/#$SRC_DIR/#" | sort -k2 > "$WORK/c2.sha256"

if diff -u "$WORK/original.sha256" "$WORK/c2.sha256" >/dev/null; then
  echo "✅ C2 PASS"
else
  echo "❌ C2 FAIL"; diff -u "$WORK/original.sha256" "$WORK/c2.sha256" || true; exit 1
fi

echo "🎉 Done. Zips in '$OUT_DIR', restorations in '$RESTORE_DIR'."
