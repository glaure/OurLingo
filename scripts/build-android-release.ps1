param(
    [string]$KeystorePath = "$env:USERPROFILE\OurLingo-signing\ourlingo-upload.jks",
    [string]$KeyAlias = 'ourlingo-upload'
)

$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $KeystorePath -PathType Leaf)) {
    throw "Keystore not found: $KeystorePath"
}

$storeSecret = $null
$keySecret = $null
Push-Location (Split-Path -Parent $PSScriptRoot)
try {
    $storeSecret = Read-Host 'Upload keystore password' -AsSecureString
    $keySecret = Read-Host 'Upload key password (enter the same password if shared)' -AsSecureString
    $env:OURLINGO_UPLOAD_STORE = (Resolve-Path -LiteralPath $KeystorePath).Path
    $env:OURLINGO_UPLOAD_ALIAS = $KeyAlias
    $env:OURLINGO_UPLOAD_STORE_PASSWORD = [System.Net.NetworkCredential]::new('', $storeSecret).Password
    $env:OURLINGO_UPLOAD_KEY_PASSWORD = [System.Net.NetworkCredential]::new('', $keySecret).Password
    & npx.cmd tauri android build --aab --target aarch64 armv7 --ci
    if ($LASTEXITCODE -ne 0) {
        throw "Android release build failed with exit code $LASTEXITCODE"
    }

    $bundlePath = 'src-tauri\gen\android\app\build\outputs\bundle\universalRelease\app-universal-release.aab'
    if (-not (Test-Path -LiteralPath $bundlePath)) {
        throw "Build finished but the expected bundle was not found: $bundlePath"
    }
    & "$env:JAVA_HOME\bin\jarsigner.exe" -verify $bundlePath
    if ($LASTEXITCODE -ne 0) {
        throw 'Release bundle signature verification failed.'
    }
    $destination = Join-Path $env:USERPROFILE 'Downloads\OurLingo-release.aab'
    Copy-Item -LiteralPath $bundlePath -Destination $destination -Force
    Write-Host "Release bundle: $destination"
    Get-FileHash -LiteralPath $destination -Algorithm SHA256
} finally {
    Remove-Item Env:OURLINGO_UPLOAD_STORE, Env:OURLINGO_UPLOAD_ALIAS, Env:OURLINGO_UPLOAD_STORE_PASSWORD, Env:OURLINGO_UPLOAD_KEY_PASSWORD -ErrorAction SilentlyContinue
    if ($null -ne $storeSecret) { $storeSecret.Dispose() }
    if ($null -ne $keySecret) { $keySecret.Dispose() }
    Pop-Location
}