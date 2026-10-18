#!/usr/bin/env bash
# Builds a signed Android App Bundle (.aab) for the Play Store on Linux.
# Usage: scripts/build-android-release.sh [keystore-path] [key-alias]
set -euo pipefail

keystore="${1:-$HOME/OurLingo-signing/ourlingo-upload.jks}"
alias_name="${2:-ourlingo-upload}"

if [[ ! -f "$keystore" ]]; then
  echo "Keystore not found: $keystore" >&2
  exit 1
fi
for tool in npx "${JAVA_HOME:?JAVA_HOME is not set}/bin/jarsigner"; do
  command -v "$tool" >/dev/null || { echo "Missing tool: $tool" >&2; exit 1; }
done

cd "$(dirname "$0")/.."

read -rsp 'Upload keystore password: ' store_password; echo
read -rsp 'Upload key password (enter the same password if shared): ' key_password; echo

# The passwords only live in this process and its children.
export OURLINGO_UPLOAD_STORE="$(realpath "$keystore")"
export OURLINGO_UPLOAD_ALIAS="$alias_name"
export OURLINGO_UPLOAD_STORE_PASSWORD="$store_password"
export OURLINGO_UPLOAD_KEY_PASSWORD="$key_password"
unset store_password key_password

npx tauri android build --aab --target aarch64 armv7 --ci

bundle='src-tauri/gen/android/app/build/outputs/bundle/universalRelease/app-universal-release.aab'
if [[ ! -f "$bundle" ]]; then
  echo "Build finished but the expected bundle was not found: $bundle" >&2
  exit 1
fi
"$JAVA_HOME/bin/jarsigner" -verify "$bundle" >/dev/null || {
  echo 'Release bundle signature verification failed.' >&2
  exit 1
}

destination="$HOME/Downloads/OurLingo-release.aab"
cp -f "$bundle" "$destination"
echo "Release bundle: $destination"
sha256sum "$destination"
