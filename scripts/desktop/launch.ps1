# Desktop-shortcut launcher for God's Eye View.
# Starts the Vite dev server if it isn't already running, then opens the app in the browser.

$env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")

$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$port = 4173
$url = "http://localhost:$port"

function Test-PortOpen {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return [bool]$conn
}

if (-not (Test-PortOpen -Port $port)) {
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList '/c title God''s Eye View Server && npm run dev' `
        -WorkingDirectory $root `
        -WindowStyle Minimized

    $tries = 0
    while (-not (Test-PortOpen -Port $port) -and $tries -lt 40) {
        Start-Sleep -Seconds 1
        $tries++
    }
}

Start-Process $url
