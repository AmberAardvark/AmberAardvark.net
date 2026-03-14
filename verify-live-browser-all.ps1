$ErrorActionPreference = "Continue"
$results = @()
$StepDelayMs = 900

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

# Start on project root page
Invoke-Live "open /" @("open", "/")

# Install deterministic fixture used across observation/interaction commands
$installFixture = @'
(() => {
  const hostId = "lb-fixture-host";
  let host = document.getElementById(hostId);

  if (!host) {
    host = document.createElement("section");
    host.id = hostId;
    host.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:999999;background:#fff;padding:8px;border:3px solid #e11d48;max-width:320px;box-shadow:0 0 0 4px rgba(225,29,72,.2)";
    host.innerHTML = `<h2 id="lb-text">Live Browser Fixture</h2>
      <div id="lb-hover" style="padding:4px;border:1px dashed #999">hover target</div>
      <button id="lb-click" onclick="this.dataset.clicked = String((Number(this.dataset.clicked||0)+1)); console.log('lb-clicked');">Click Fixture</button>
      <input id="lb-input" name="lb-input" type="text" />
      <textarea id="lb-textarea"></textarea>
      <select id="lb-select"><option value="alpha">alpha</option><option value="beta">beta</option></select>
      <label><input id="lb-check" type="checkbox"/> check me</label>
      <a id="lb-link" href="/AmberAardvark.net/contact">Contact Link</a>
      <div id="lb-wait-target">Ready</div>
      <img id="lb-img" alt="fixture image" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" />`;
    document.body.appendChild(host);
  }

  if (!window.__lbConsoleInterval) {
    window.__lbConsoleInterval = setInterval(() => console.log('lb-console-tick'), 700);
  }

  if (!window.__lbNetworkInterval) {
    window.__lbNetworkInterval = setInterval(() => fetch('/AmberAardvark.net/robots.txt?ts=' + Date.now()).catch(() => {}), 900);
  }

  return {
    ok: true,
    fixture: !!document.getElementById(hostId),
    url: location.href
  };
})()
'@
Invoke-Live "eval install fixture" @("eval", $installFixture)
Invoke-Live "eval visual marker" @("eval", "(() => { document.title = '[LIVE TEST RUNNING] ' + document.title.replace(/^\[LIVE TEST RUNNING\]\s*/, ''); return document.title; })()")

# Observation
Invoke-Live "help" @("help") -NoDelay
Invoke-Live "status" @("status")
Invoke-Live "capture" @("capture")
Invoke-Live "text" @("text", "#lb-text")
Invoke-Live "html" @("html", "#lb-fixture-host")
Invoke-Live "attr" @("attr", "#lb-link", "href")
Invoke-Live "count" @("count", "a")
Invoke-Live "visible" @("visible", "#lb-fixture-host")
Invoke-Live "links" @("links")
Invoke-Live "meta" @("meta")
Invoke-Live "screenshot" @("screenshot", "#lb-fixture-host")
Invoke-Live "a11y" @("a11y")
Invoke-Live "eval verify click pre" @("eval", "document.getElementById('lb-click')?.dataset?.clicked ?? '0'")

# Navigation
Invoke-Live "open /about" @("open", "/about")
Invoke-Live "open /contact" @("open", "/contact")
Invoke-Live "back" @("back")
Invoke-Live "forward" @("forward")
Invoke-Live "reload" @("reload")
Invoke-Live "open /" @("open", "/")
Invoke-Live "scroll bottom" @("scroll", "bottom")
Invoke-Live "scroll top" @("scroll", "top")
Invoke-Live "scroll selector" @("scroll", "#lb-fixture-host")

# Interaction
Invoke-Live "click" @("click", "#lb-click")
Invoke-Live "fill" @("fill", "#lb-input", "Filled Value")
Invoke-Live "type" @("type", "#lb-textarea", "Typed Value")
Invoke-Live "press" @("press", "#lb-input", "Enter")
Invoke-Live "select" @("select", "#lb-select", "beta")
Invoke-Live "check" @("check", "#lb-check")
Invoke-Live "uncheck" @("uncheck", "#lb-check")
Invoke-Live "hover" @("hover", "#lb-hover")
Invoke-Live "wait" @("wait", "#lb-wait-target")
Invoke-Live "eval verify click post" @("eval", "document.getElementById('lb-click')?.dataset?.clicked ?? '0'")

# Diagnostics
Invoke-Live "console 2200" @("console", "2200")
Invoke-Live "network 2600" @("network", "2600")
Invoke-Live "storage show" @("storage", "show")
Invoke-Live "storage cookies" @("storage", "cookies")
Invoke-Live "storage clear" @("storage", "clear")
Invoke-Live "viewport 1280x720" @("viewport", "1280", "720")
Invoke-Live "pdf" @("pdf")

# Cleanup fixture intervals
$cleanupFixture = @'
(() => {
  if (window.__lbConsoleInterval) {
    clearInterval(window.__lbConsoleInterval);
    window.__lbConsoleInterval = null;
  }

  if (window.__lbNetworkInterval) {
    clearInterval(window.__lbNetworkInterval);
    window.__lbNetworkInterval = null;
  }

  return 'cleanup-complete';
})()
'@
Invoke-Live "eval cleanup fixture" @("eval", $cleanupFixture)

Write-Host "`n=== SUMMARY ===" -ForegroundColor Yellow
$results | Format-Table -AutoSize

$failed = $results | Where-Object { $_.ExitCode -ne 0 }
if ($failed.Count -gt 0) {
  Write-Host "`nFailed commands:" -ForegroundColor Red
  $failed | Format-Table -AutoSize
  exit 1
}

Write-Host "`nAll commands passed." -ForegroundColor Green
