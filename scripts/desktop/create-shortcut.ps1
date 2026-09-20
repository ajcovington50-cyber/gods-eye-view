$root = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$launchScript = Join-Path $root "scripts\desktop\launch.ps1"
$icon = Join-Path $root "icon.ico"
$desktop = [Environment]::GetFolderPath("Desktop")
$shortcutPath = Join-Path $desktop "God's Eye View.lnk"

$wsh = New-Object -ComObject WScript.Shell
$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
$shortcut.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launchScript`""
$shortcut.WorkingDirectory = $root
$shortcut.IconLocation = $icon
$shortcut.Description = "Launch God's Eye View"
$shortcut.WindowStyle = 7
$shortcut.Save()

Write-Host "Shortcut created at $shortcutPath"
