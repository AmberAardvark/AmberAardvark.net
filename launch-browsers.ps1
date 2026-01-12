# Launch browsers for Playwright testing with existing profiles
# This script launches Edge and Firefox with remote debugging enabled

Write-Host "Launching browsers for Playwright testing..." -ForegroundColor Green

# Get the current username for paths
$username = $env:USERNAME

# Edge configuration
$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$edgeUserData = "$env:LOCALAPPDATA\Microsoft\Edge\User Data"
$edgeDebugPort = 9222

# Firefox configuration
$firefoxPath = "C:\Program Files\Mozilla Firefox\firefox.exe"
$firefoxProfile = "$env:APPDATA\Mozilla\Firefox\Profiles"
$firefoxDebugPort = 9223

# Check if Edge is already running with debugging
$edgeProcess = Get-Process msedge -ErrorAction SilentlyContinue
if ($edgeProcess) {
    Write-Host "Warning: Edge is already running. Close all Edge windows for best results." -ForegroundColor Yellow
}

# Check if Firefox is already running
$firefoxProcess = Get-Process firefox -ErrorAction SilentlyContinue
if ($firefoxProcess) {
    Write-Host "Warning: Firefox is already running. Close all Firefox windows for best results." -ForegroundColor Yellow
}

# Launch Edge with remote debugging
if (Test-Path $edgePath) {
    Write-Host "`nLaunching Edge with debugging on port $edgeDebugPort..." -ForegroundColor Cyan
    Start-Process -FilePath $edgePath -ArgumentList @(
        "--remote-debugging-port=$edgeDebugPort",
        "--user-data-dir=`"$edgeUserData`"",
        "--profile-directory=Default"
    )
    Write-Host "Edge launched successfully!" -ForegroundColor Green
} else {
    Write-Host "Edge not found at $edgePath" -ForegroundColor Red
}

# Find the default Firefox profile
if (Test-Path $firefoxProfile) {
    $defaultProfile = Get-ChildItem -Path $firefoxProfile -Directory | 
        Where-Object { $_.Name -like "*.default*" } | 
        Select-Object -First 1
    
    if ($defaultProfile) {
        Write-Host "`nLaunching Firefox with debugging on port $firefoxDebugPort..." -ForegroundColor Cyan
        Write-Host "Using profile: $($defaultProfile.Name)" -ForegroundColor Gray
        
        Start-Process -FilePath $firefoxPath -ArgumentList @(
            "-profile", "`"$($defaultProfile.FullName)`"",
            "-start-debugger-server", $firefoxDebugPort
        )
        Write-Host "Firefox launched successfully!" -ForegroundColor Green
    } else {
        Write-Host "Could not find default Firefox profile in $firefoxProfile" -ForegroundColor Red
    }
} else {
    Write-Host "Firefox profile directory not found at $firefoxProfile" -ForegroundColor Red
}

Write-Host "`n✓ Browsers are ready for Playwright testing!" -ForegroundColor Green
Write-Host "  Edge debugging port: $edgeDebugPort" -ForegroundColor Gray
Write-Host "  Firefox debugging port: $firefoxDebugPort" -ForegroundColor Gray
Write-Host "`nRun 'npm test' to start your Playwright tests." -ForegroundColor Cyan
