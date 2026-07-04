param(
  [string]$Version = "0.1.0"
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$dist = Join-Path $root "dist"
$zip = Join-Path $dist ("ddys-astro-v{0}.zip" -f $Version)
$resolvedRoot = $root.TrimEnd("\") + "\"

if (Test-Path $dist) {
  Remove-Item -LiteralPath $dist -Recurse -Force
}
New-Item -ItemType Directory -Path $dist | Out-Null

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$archive = [System.IO.Compression.ZipFile]::Open($zip, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $files = Get-ChildItem -LiteralPath $root -Recurse -File | Where-Object {
    $full = $_.FullName
    $inside = $full.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)
    $excludedDir = $full -match "\\(dist|node_modules|\.git|\.astro|\.vercel|\.netlify|coverage)\\"
    $excludedName = $_.Name -eq "pnpm-lock.yaml" -or $_.Name -match "\.(log|tmp|cache|tgz)$"
    $excludedEnv = $_.Name -match "^\.env" -and $_.Name -ne ".env.example"
    $inside -and -not $excludedDir -and -not $excludedName -and -not $excludedEnv
  }
  foreach ($file in $files) {
    $full = $file.FullName
    if (-not $full.StartsWith($resolvedRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
      throw "Refusing to package outside root: $full"
    }
    $relative = $full.Substring($resolvedRoot.Length).Replace("\", "/")
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $full, $relative, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
}
finally {
  $archive.Dispose()
}

$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash
[pscustomobject]@{
  ok = $true
  version = $Version
  zip = $zip
  sha256 = $hash
} | ConvertTo-Json
