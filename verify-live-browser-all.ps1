param(
  [string[]]$Tests = @("*"),
  [switch]$ShowWatcherLogs
)

$ErrorActionPreference = "Continue"
$results = @()
$StepDelayMs = 700

$normalizedPatterns = @()
foreach ($raw in $Tests) {
  foreach ($piece in ($raw -split ",")) {
    $p = $piece.Trim().Trim('"').Trim("'")
    if ($p) {
      $normalizedPatterns += $p
    }
  }
}

if (-not $normalizedPatterns -or $normalizedPatterns.Count -eq 0) {
  $normalizedPatterns = @("*")
}

$script:TestPatterns = @($normalizedPatterns)

Write-Host "Test filters: $($script:TestPatterns -join ', ')" -ForegroundColor Yellow
Write-Host "Show watcher logs: $ShowWatcherLogs" -ForegroundColor Yellow

function Should-RunTest {
  param([string]$Name)

  foreach ($pattern in $script:TestPatterns) {
    if ($Name -like $pattern) {
      return $true
    }
  }

  return $false
}

function Should-RunAny {
  param([string[]]$Names)

  foreach ($n in $Names) {
    if (Should-RunTest -Name $n) {
      return $true
    }
  }

  return $false
}

function Invoke-Setup {
  param(
    [string]$Name,
    [string[]]$CommandArgs
  )

  Write-Host "`n=== SETUP: $Name ===" -ForegroundColor Magenta
  Write-Host ("ARGS: " + ($CommandArgs -join " | ")) -ForegroundColor DarkGray

  & node .\live-browser.mjs @CommandArgs
  $code = $LASTEXITCODE

  if ($code -ne 0) {
    throw "Setup step failed: $Name"
  }

  Start-Sleep -Milliseconds $StepDelayMs
}

function Invoke-Live {
  param(
    [string]$Name,
    [string[]]$CommandArgs,
    [switch]$NoDelay
  )

  if (-not (Should-RunTest -Name $Name)) {
    Write-Host "SKIP: $Name" -ForegroundColor DarkYellow
    return
  }

  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  Write-Host ("ARGS: " + ($CommandArgs -join " | ")) -ForegroundColor DarkGray

  & node .\live-browser.mjs @CommandArgs
  $code = $LASTEXITCODE

  $script:results += [pscustomobject]@{
    Command = $Name
    ExitCode = $code
  }

  if ($code -eq 0) {
    Write-Host "PASS: $Name" -ForegroundColor Green
  } else {
    Write-Host "FAIL($code): $Name" -ForegroundColor Red
  }

  if (-not $NoDelay) {
    Start-Sleep -Milliseconds $StepDelayMs
  }
}

function Add-Result {
  param(
    [string]$Name,
    [int]$ExitCode
  )

  $script:results += [pscustomobject]@{
    Command = $Name
    ExitCode = $ExitCode
  }

  if ($ExitCode -eq 0) {
    Write-Host "PASS: $Name" -ForegroundColor Green
  } else {
    Write-Host "FAIL($ExitCode): $Name" -ForegroundColor Red
  }
}

function Test-WatcherWithTrigger {
  param(
    [string]$Name,
    [string]$WatchCommand,
    [int]$WatchMs,
    [string]$TriggerExpression,
    [string]$ExpectedMarker
  )

  if (-not (Should-RunTest -Name $Name)) {
    Write-Host "SKIP: $Name" -ForegroundColor DarkYellow
    return
  }

  Write-Host "`n=== $Name ===" -ForegroundColor Cyan

  $logBase = Join-Path $PSScriptRoot ("test-results\\live-browser\\" + $Name.Replace(" ", "-"))
  $stdoutPath = "$logBase.stdout.log"
  $stderrPath = "$logBase.stderr.log"

  if (Test-Path $stdoutPath) {
    Remove-Item $stdoutPath -Force
  }
  if (Test-Path $stderrPath) {
    Remove-Item $stderrPath -Force
  }

  $watchProc = Start-Process -FilePath node `
    -ArgumentList @(".\\live-browser.mjs", $WatchCommand, "$WatchMs") `
    -WorkingDirectory $PSScriptRoot `
    -RedirectStandardOutput $stdoutPath `
    -RedirectStandardError $stderrPath `
    -WindowStyle Hidden `
    -PassThru

  Start-Sleep -Milliseconds 900

  & node .\live-browser.mjs eval $TriggerExpression | Out-Null

  $watchProc.WaitForExit()
  $watchCode = $watchProc.ExitCode
  $logText = ""
  if (Test-Path $stdoutPath) {
    $logText += (Get-Content $stdoutPath -Raw)
  }
  if (Test-Path $stderrPath) {
    $logText += "`n"
    $logText += (Get-Content $stderrPath -Raw)
  }

  if ($logText.Contains($ExpectedMarker)) {
    if ($ShowWatcherLogs) {
      Write-Host "Watcher log ($Name):" -ForegroundColor DarkCyan
      Write-Host $logText
    }
    Add-Result -Name $Name -ExitCode 0
    return
  }

  Write-Host "Expected marker not found: $ExpectedMarker" -ForegroundColor Yellow
  Write-Host "Watcher exit code: $watchCode" -ForegroundColor Yellow
  if ($logText) {
    Write-Host "Watcher log:" -ForegroundColor Yellow
    Write-Host $logText
  }
  Add-Result -Name $Name -ExitCode 1
}

function Invoke-ViewportTest {
  param(
    [string]$Name,
    [int]$Width,
    [int]$Height
  )

  if (-not (Should-RunTest -Name $Name)) {
    Write-Host "SKIP: $Name" -ForegroundColor DarkYellow
    return
  }

  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  Write-Host ("ARGS: viewport | $Width | $Height") -ForegroundColor DarkGray

  & node .\live-browser.mjs viewport "$Width" "$Height"
  $setCode = $LASTEXITCODE

  if ($setCode -ne 0) {
    Add-Result -Name $Name -ExitCode $setCode
    Start-Sleep -Milliseconds $StepDelayMs
    return
  }

  Start-Sleep -Milliseconds $StepDelayMs

  Write-Host "Resetting viewport control..." -ForegroundColor DarkGray
  & node .\live-browser.mjs viewport reset
  $resetCode = $LASTEXITCODE

  if ($resetCode -eq 0) {
    Add-Result -Name $Name -ExitCode 0
  } else {
    Write-Host "Viewport reset failed after $Name" -ForegroundColor Yellow
    Add-Result -Name $Name -ExitCode $resetCode
  }

  Start-Sleep -Milliseconds $StepDelayMs
}

$allTestNames = @(
  "help", "status", "capture", "text", "html", "attr", "count", "visible", "links", "meta", "screenshot", "a11y", "eval",
  "open /about", "open /contact", "back", "forward", "reload", "open /", "scroll bottom", "scroll top", "scroll selector",
  "click", "fill", "type", "press", "select", "check", "uncheck", "hover", "wait",
  "console trigger-verify", "network trigger-verify", "storage show", "storage cookies", "storage clear",
  "viewport sd", "viewport full-hd", "viewport 4k", "viewport tablet", "viewport smartphone",
  "pdf", "eval cleanup mini fixture"
)

if (-not (Should-RunAny -Names $allTestNames)) {
  Write-Host "No tests matched current filters: $($script:TestPatterns -join ', ')" -ForegroundColor Yellow
  exit 0
}

# Establish deterministic starting point and route
Invoke-Setup "open /" @("open", "/")
Invoke-Setup "open /contact" @("open", "/contact")

# Minimal short fixture only for select/check/uncheck commands
$miniFixture = @'
(() => { if (!document.getElementById('lb-sel')) { const s = document.createElement('select'); s.id = 'lb-sel'; s.innerHTML = '<option value="a">a</option><option value="b">b</option>'; document.body.appendChild(s); const c = document.createElement('input'); c.id = 'lb-check'; c.type = 'checkbox'; document.body.appendChild(c); } return 'ok'; })()
'@
Invoke-Setup "eval install mini fixture" @("eval", $miniFixture)

# Observation
Invoke-Live "help" @("help") -NoDelay
Invoke-Live "status" @("status")
Invoke-Live "capture" @("capture")
Invoke-Live "text" @("text", "main h1")
Invoke-Live "html" @("html", "main")
Invoke-Live "attr" @("attr", "#footer-input", "placeholder")
Invoke-Live "count" @("count", "a")
Invoke-Live "visible" @("visible", "#footer-input")
Invoke-Live "links" @("links")
Invoke-Live "meta" @("meta")
Invoke-Live "screenshot" @("screenshot", "#footer-input")
Invoke-Live "a11y" @("a11y")
Invoke-Live "eval" @("eval", "document.title")

# Navigation
Invoke-Live "open /about" @("open", "/about")
Invoke-Live "open /contact" @("open", "/contact")
Invoke-Live "back" @("back")
Invoke-Live "forward" @("forward")
Invoke-Live "reload" @("reload")
Invoke-Live "open /" @("open", "/")
Invoke-Live "scroll bottom" @("scroll", "bottom")
Invoke-Live "scroll top" @("scroll", "top")
Invoke-Live "scroll selector" @("scroll", "#footer-input")

# Interaction
Invoke-Live "click" @("click", "a[href='/AmberAardvark.net/about']")
if (Should-RunAny -Names @("fill", "type", "press", "select", "check", "uncheck", "hover", "wait", "click")) {
  Invoke-Setup "open /contact (interaction)" @("open", "/contact")
}
Invoke-Live "fill" @("fill", "#footer-input", "qa@example.com")
Invoke-Live "type" @("type", "#footer-input", "-typed")
Invoke-Live "press" @("press", "#footer-input", "Enter")
if (Should-RunAny -Names @("select", "check", "uncheck")) {
  Invoke-Setup "eval install mini fixture (interaction)" @("eval", $miniFixture)
}
Invoke-Live "select" @("select", "#lb-sel", "b")
Invoke-Live "check" @("check", "#lb-check")
Invoke-Live "uncheck" @("uncheck", "#lb-check")
Invoke-Live "hover" @("hover", "a[href='/AmberAardvark.net/about']")
Invoke-Live "wait" @("wait", "#footer-input")

# Diagnostics
Test-WatcherWithTrigger `
  -Name "console trigger-verify" `
  -WatchCommand "console" `
  -WatchMs 3500 `
  -TriggerExpression "(() => { console.log('LB_CONSOLE_PROBE_20260314'); return 'ok'; })()" `
  -ExpectedMarker "LB_CONSOLE_PROBE_20260314"

Test-WatcherWithTrigger `
  -Name "network trigger-verify" `
  -WatchCommand "network" `
  -WatchMs 4500 `
  -TriggerExpression "(() => { const u = '/AmberAardvark.net/robots.txt?lb_probe=20260314'; fetch(u).catch(() => {}); return u; })()" `
  -ExpectedMarker "lb_probe=20260314"

Invoke-Live "storage show" @("storage", "show")
Invoke-Live "storage cookies" @("storage", "cookies")
Invoke-Live "storage clear" @("storage", "clear")
Invoke-ViewportTest "viewport sd" 640 480
Invoke-ViewportTest "viewport full-hd" 1920 1080
Invoke-ViewportTest "viewport 4k" 3840 2160
Invoke-ViewportTest "viewport tablet" 768 1024
Invoke-ViewportTest "viewport smartphone" 390 844
Invoke-Live "pdf" @("pdf")

# Cleanup short fixture
Invoke-Live "eval cleanup mini fixture" @("eval", "(() => { const s = document.getElementById('lb-sel'); const c = document.getElementById('lb-check'); if (s) s.remove(); if (c) c.remove(); return 'cleanup-complete'; })()")

Write-Host "`n=== SUMMARY ===" -ForegroundColor Yellow
if ($results.Count -eq 0) {
  Write-Host "No tests matched the current filters." -ForegroundColor Yellow
  exit 0
}

$results | Format-Table -AutoSize

$failed = $results | Where-Object { $_.ExitCode -ne 0 }
if ($failed.Count -gt 0) {
  Write-Host "`nFailed commands:" -ForegroundColor Red
  $failed | Format-Table -AutoSize
  exit 1
}

Write-Host "`nAll commands passed." -ForegroundColor Green
