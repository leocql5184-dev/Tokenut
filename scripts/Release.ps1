$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
& npm.cmd run pack
if ($LASTEXITCODE -ne 0) { throw 'Packaging failed' }
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version
New-Item -ItemType Directory -Path 'release' -Force | Out-Null
Copy-Item -LiteralPath 'README.md' -Destination 'dist/Tokenut-win32-x64/README.md'
New-Item -ItemType Directory -Path 'dist/Tokenut-win32-x64/assets/readme' -Force | Out-Null
Copy-Item -LiteralPath 'assets/readme/justin-sun-100m-interview.jpg' -Destination 'dist/Tokenut-win32-x64/assets/readme/justin-sun-100m-interview.jpg'
$assetDir = 'dist/Tokenut-win32-x64/assets/character/stages-v1'
New-Item -ItemType Directory -Path $assetDir -Force | Out-Null
$stageFiles = @('01-000m-initial.png','02-001m-awakening.png','04-030m-anger.png','05-060m-gold.png','05-060m-diamond.png','06-090m-charging.png','07-100m-ultimate.png')
foreach ($stage in $stageFiles) { Copy-Item -LiteralPath (Join-Path 'assets/character/stages-v1' $stage) -Destination (Join-Path $assetDir $stage) }
$zipPath = Join-Path (Get-Location) "release/Tokenut-$version-Windows-x64.zip"
Compress-Archive -LiteralPath 'dist/Tokenut-win32-x64' -DestinationPath $zipPath -CompressionLevel Optimal -Force
$stream = [IO.File]::OpenRead($zipPath)
try { $hash = [BitConverter]::ToString([Security.Cryptography.SHA256]::Create().ComputeHash($stream)).Replace('-', '').ToLower() } finally { $stream.Dispose() }
Set-Content -LiteralPath "$zipPath.sha256" -Value "$hash  $([IO.Path]::GetFileName($zipPath))" -Encoding ascii
Write-Output $zipPath
Write-Output $hash

