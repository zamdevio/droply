#!/usr/bin/env bash
set -euo pipefail

# Paths
SRC_DIR="fuzz"
OUT_DIR="compressed"
RESTORE_DIR="decompressed"

# CLI entry
CLI="npx tsx droply.ts"

# Reset playground
rm -rf "$OUT_DIR" "$RESTORE_DIR"
mkdir -p "$OUT_DIR" "$RESTORE_DIR"

echo "🧪 Source set:"
tree "$SRC_DIR" || true
echo

############################################
# 1) ZIP archive + outer GZIP  (.zip.gzip)
############################################
RUN="zip_gzip"
echo "🔧 [$RUN] Archiving $SRC_DIR/* as ZIP, then compress with GZIP…"
$CLI compress "$SRC_DIR"/* \
  --archive zip \
  --algo gzip \
  --output-dir "$OUT_DIR" \
  --meta

mkdir -p "$RESTORE_DIR/$RUN"
echo "🔓 [$RUN] Decompressing everything to $RESTORE_DIR/$RUN…"
for f in "$OUT_DIR"/*.zip.gzip; do
  echo "  → $f"
  $CLI decompress "$f" --output-dir "$RESTORE_DIR/$RUN" --meta
done
echo

############################################
# 2) ZIP archive + outer Brotli (.zip.brotli)
############################################
RUN="zip_brotli"
echo "🔧 [$RUN] Archiving $SRC_DIR/* as ZIP, then compress with Brotli…"
$CLI compress "$SRC_DIR"/* \
  --archive zip \
  --algo brotli \
  --output-dir "$OUT_DIR" \
  --meta

mkdir -p "$RESTORE_DIR/$RUN"
echo "🔓 [$RUN] Decompressing everything to $RESTORE_DIR/$RUN…"
for f in "$OUT_DIR"/*.zip.brotli; do
  echo "  → $f"
  $CLI decompress "$f" --output-dir "$RESTORE_DIR/$RUN" --meta
done
echo

############################################
# 3) TAR archive + outer GZIP  (.tar.gzip)
############################################
RUN="tar_gzip"
echo "🔧 [$RUN] Archiving $SRC_DIR/* as TAR, then compress with GZIP…"
$CLI compress "$SRC_DIR"/* \
  --archive tar \
  --algo gzip \
  --output-dir "$OUT_DIR" \
  --meta

mkdir -p "$RESTORE_DIR/$RUN"
echo "🔓 [$RUN] Decompressing everything to $RESTORE_DIR/$RUN…"
for f in "$OUT_DIR"/*.tar.gzip; do
  echo "  → $f"
  $CLI decompress "$f" --output-dir "$RESTORE_DIR/$RUN" --meta
done
echo

############################################
# 4) Single-file GZIP for each fuzz file (.gzip)
############################################
RUN="singles_gzip"
echo "🔧 [$RUN] Compressing each file individually with GZIP (no archive)…"
for f in "$SRC_DIR"/*; do
  [ -f "$f" ] || continue
  $CLI compress "$f" \
    --algo gzip \
    --output-dir "$OUT_DIR" \
    --meta
done

mkdir -p "$RESTORE_DIR/$RUN"
echo "🔓 [$RUN] Decompressing singles to $RESTORE_DIR/$RUN…"
for f in "$OUT_DIR"/*.gzip; do
  echo "  → $f"
  $CLI decompress "$f" --output-dir "$RESTORE_DIR/$RUN" --meta
done
echo

############################################
# 5) Single-file Brotli for each fuzz file (.brotli)
############################################
RUN="singles_brotli"
echo "🔧 [$RUN] Compressing each file individually with Brotli (no archive)…"
for f in "$SRC_DIR"/*; do
  [ -f "$f" ] || continue
  $CLI compress "$f" \
    --algo brotli \
    --output-dir "$OUT_DIR" \
    --meta
done

mkdir -p "$RESTORE_DIR/$RUN"
echo "🔓 [$RUN] Decompressing singles to $RESTORE_DIR/$RUN…"
for f in "$OUT_DIR"/*.brotli; do
  echo "  → $f"
  $CLI decompress "$f" --output-dir "$RESTORE_DIR/$RUN" --meta
done
echo

############################################
# Integrity checks (hash compare)
############################################
hashdir () {
  local d="$1"
  ( cd "$d" && find . -type f -print0 | sort -z | xargs -0 sha256sum )
}

echo "🔎 Integrity check vs original fuzz/…"
echo "  (We’ll compare file lists & hashes per restore run)"
ORIG_LIST="$(mktemp)"; hashdir "$SRC_DIR" > "$ORIG_LIST"

check_run () {
  local run="$1"
  local target="$RESTORE_DIR/$run"
  if [ -d "$target" ]; then
    echo "✅ Verifying $run …"
    REST_LIST="$(mktemp)"
    hashdir "$target" > "$REST_LIST" || true
    # Show diff summary (not failing the whole script on mismatch)
    if diff -u "$ORIG_LIST" "$REST_LIST" > /dev/null; then
      echo "   ✓ $run OK (hashes match)"
    else
      echo "   ⚠ $run differs! Showing top of diff:"
      diff -u "$ORIG_LIST" "$REST_LIST" | sed -n '1,80p'
    fi
  else
    echo "⛔ Skip $run (no folder)"
  fi
}

check_run zip_gzip
check_run zip_brotli
check_run tar_gzip
check_run singles_gzip
check_run singles_brotli

echo
echo "🏁 Done. Artifacts:"
echo " - Compressed:   $OUT_DIR/"
echo " - Decompressed: $RESTORE_DIR/"
