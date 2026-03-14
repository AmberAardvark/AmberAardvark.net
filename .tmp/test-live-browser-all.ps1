$ErrorActionPreference = 'Continue'
$script:results = @()

function Test-Live {
  param(
    [string]$Name,
    [string[]]$Args
  )

  Write-Host "`n=== TEST: $Name ==="
  & npm run live-browser -- @Args
  $code = $LASTEXITCODE
  $script:results += [pscustomobject]@{ Command = $Name; ExitCode = $code }

  if ($code -ne 0) {
    Write-Host "FAIL ($code): $Name" -ForegroundColor Red
  } else {
    Write-Host "PASS: $Name" -ForegroundColor Green
  }
}

# Baseline and setup
Test-Live 'help' @('help')
Test-Live 'status' @('status')
Test-Live 'open root' @('open','/')
Test-Live 'open contact' @('open','/contact')

# Install deterministic fixtures used by many commands
Test-Live 'eval install fixture' @('eval','(() => { const hostId = "lb-fixture-host"; let host = document.getElementById(hostId); if (!host) { host = document.createElement("section"); host.id = hostId; host.style.cssText = "position:fixed;bottom:12px;right:12px;z-index:999999;background:#fff;padding:8px;border:1px solid #ccc;max-width:320px"; host.innerHTML = `<h2 id="lb-text">Live Browser Fixture</h2><div id="lb-hover" style="padding:4px;border:1px dashed #999">hover target</div><button id="lb-click" onclick="this.dataset.clicked = String((Number(this.dataset.clicked||0)+1)); console.log(\"lb-clicked\");">Click Fixture</button><input id="lb-input" name="lb-input" type="text" /><textarea id="lb-textarea"></textarea><select id="lb-select"><option value="alpha">alpha</option><option value="beta">beta</option></select><label><input id="lb-check" type="checkbox"/> check me</label><a id="lb-link" href="/AmberAardvark.net/contact">Contact Link</a><div id="lb-wait-target">Ready</div><img id="lb-img" alt="fixture image" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" /></div>`; document.body.appendChild(host); } if (!window.__lbConsoleInterval) { window.__lbConsoleInterval = setInterval(() => console.log("lb-console-tick"), 700); } if (!window.__lbNetworkInterval) { window.__lbNetworkInterval = setInterval(() => fetch("/AmberAardvark.net/robots.txt?ts=" + Date.now()).catch(() => {}), 900); } return { ok: true, url: location.href, fixture: !!document.getElementById(hostId) }; })()')

# Observation commands
Test-Live 'capture' @('capture')
Test-Live 'text' @('text','#lb-text')
Test-Live 'html' @('html','#lb-fixture-host')
Test-Live 'attr' @('attr','#lb-link','href')
Test-Live 'count' @('count','a')
Test-Live 'visible' @('visible','#lb-fixture-host')
Test-Live 'links' @('links')
Test-Live 'meta' @('meta')
Test-Live 'screenshot' @('screenshot','#lb-fixture-host')
Test-Live 'a11y' @('a11y')
Test-Live 'eval read back' @('eval','document.getElementById("lb-click")?.dataset?.clicked ?? "0"')

# Navigation commands
Test-Live 'open about' @('open','/about')
Test-Live 'open contact again' @('open','/contact')
Test-Live 'back' @('back')
Test-Live 'forward' @('forward')
Test-Live 'reload' @('reload')
Test-Live 'scroll bottom' @('scroll','bottom')
Test-Live 'scroll top' @('scroll','top')
Test-Live 'scroll selector' @('scroll','#lb-fixture-host')

# Interaction commands
Test-Live 'click' @('click','#lb-click')
Test-Live 'fill' @('fill','#lb-input','Filled Value')
Test-Live 'type' @('type','#lb-textarea','Typed Value')
Test-Live 'press' @('press','#lb-input','Enter')
Test-Live 'select' @('select','#lb-select','beta')
Test-Live 'check' @('check','#lb-check')
Test-Live 'uncheck' @('uncheck','#lb-check')
Test-Live 'hover' @('hover','#lb-hover')
Test-Live 'wait' @('wait','#lb-wait-target')

# Diagnostics commands
Test-Live 'console' @('console','2200')
Test-Live 'network' @('network','2600')
Test-Live 'storage show' @('storage','show')
Test-Live 'storage cookies' @('storage','cookies')
Test-Live 'storage clear' @('storage','clear')
Test-Live 'viewport' @('viewport','1280','720')
Test-Live 'pdf' @('pdf')

# Cleanup fixture intervals
Test-Live 'eval cleanup fixture' @('eval','(() => { if (window.__lbConsoleInterval) { clearInterval(window.__lbConsoleInterval); window.__lbConsoleInterval = null; } if (window.__lbNetworkInterval) { clearInterval(window.__lbNetworkInterval); window.__lbNetworkInterval = null; } return "cleanup-complete"; })()')

Write-Host "`n=== SUMMARY ==="
$script:results | Format-Table -AutoSize
$failed = $script:results | Where-Object { $_.ExitCode -ne 0 }
if ($failed.Count -gt 0) {
  Write-Host "`nFailed commands:" -ForegroundColor Red
  $failed | Format-Table -AutoSize
  exit 1
}
Write-Host "`nAll commands passed." -ForegroundColor Green
