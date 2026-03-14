$ErrorActionPreference = "Continue"
$results = @()
$StepDelayMs = 700

function Invoke-Live {
  param(
    [string]$Name,
    [string[]]$CommandArgs,
    [switch]$NoDelay
  )

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

# Establish deterministic starting point and route
Invoke-Live "open /" @("open", "/")
Invoke-Live "open /contact" @("open", "/contact")

# Minimal short fixture only for select/check/uncheck commands
$miniFixture = @'
(() => { if (!document.getElementById('lb-sel')) { const s = document.createElement('select'); s.id = 'lb-sel'; s.innerHTML = '<option value="a">a</option><option value="b">b</option>'; document.body.appendChild(s); const c = document.createElement('input'); c.id = 'lb-check'; c.type = 'checkbox'; document.body.appendChild(c); } return 'ok'; })()
'@
Invoke-Live "eval install mini fixture" @("eval", $miniFixture)

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
Invoke-Live "open /contact" @("open", "/contact")
Invoke-Live "fill" @("fill", "#footer-input", "qa@example.com")
Invoke-Live "type" @("type", "#footer-input", "-typed")
Invoke-Live "press" @("press", "#footer-input", "Enter")
Invoke-Live "eval install mini fixture (interaction)" @("eval", $miniFixture)
Invoke-Live "select" @("select", "#lb-sel", "b")
Invoke-Live "check" @("check", "#lb-check")
Invoke-Live "uncheck" @("uncheck", "#lb-check")
Invoke-Live "hover" @("hover", "a[href='/AmberAardvark.net/about']")
Invoke-Live "wait" @("wait", "#footer-input")

# Diagnostics
Invoke-Live "console" @("console", "2000")
Invoke-Live "network" @("network", "2200")
Invoke-Live "storage show" @("storage", "show")
Invoke-Live "storage cookies" @("storage", "cookies")
Invoke-Live "storage clear" @("storage", "clear")
Invoke-Live "viewport" @("viewport", "1280", "720")
Invoke-Live "pdf" @("pdf")

# Cleanup short fixture
Invoke-Live "eval cleanup mini fixture" @("eval", "(() => { const s = document.getElementById('lb-sel'); const c = document.getElementById('lb-check'); if (s) s.remove(); if (c) c.remove(); return 'cleanup-complete'; })()")

Write-Host "`n=== SUMMARY ===" -ForegroundColor Yellow
$results | Format-Table -AutoSize

$failed = $results | Where-Object { $_.ExitCode -ne 0 }
if ($failed.Count -gt 0) {
  Write-Host "`nFailed commands:" -ForegroundColor Red
  $failed | Format-Table -AutoSize
  exit 1
}

Write-Host "`nAll commands passed." -ForegroundColor Green
