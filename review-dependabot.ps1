# Automated Dependabot PR Review Script
param([switch]$AutoMergePatch = $false)

Write-Host "Dependabot PR Review Assistant" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan

if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "GitHub CLI (gh) not found. Install from: https://cli.github.com/" -ForegroundColor Red
    exit 1
}

Write-Host "Fetching Dependabot PRs..." -ForegroundColor Yellow
$prs = gh pr list --author "app/dependabot" --json number,title,headRefName,labels,state | ConvertFrom-Json

if ($prs.Count -eq 0) {
    Write-Host "No open Dependabot PRs found!" -ForegroundColor Green
    exit 0
}

Write-Host "Found $($prs.Count) Dependabot PR(s)`n" -ForegroundColor Green

foreach ($pr in $prs) {
    $prNumber = $pr.number
    $title = $pr.title
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "PR #$($prNumber): $title" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Cyan
    
    $isSecurity = $pr.labels | Where-Object { $_.name -like "*security*" }
    $updateType = "unknown"
    
    if ($title -match 'bump .+ from ([\d.]+) to ([\d.]+)') {
        $oldVersion = $matches[1]
        $newVersion = $matches[2]
        
        $oldParts = $oldVersion.Split('.')
        $newParts = $newVersion.Split('.')
        
        if ($oldParts[0] -ne $newParts[0]) {
            $updateType = "MAJOR"
            $color = "Red"
        }
        elseif ($oldParts[1] -ne $newParts[1]) {
            $updateType = "MINOR"
            $color = "Yellow"
        }
        else {
            $updateType = "PATCH"
            $color = "Green"
        }
        
        Write-Host "  Version: $oldVersion -> $newVersion" -ForegroundColor Gray
        Write-Host "  Update Type: $updateType" -ForegroundColor $color
    }
    
    if ($isSecurity) {
        Write-Host "  SECURITY UPDATE" -ForegroundColor Red -BackgroundColor White
    }
    
    $prDetails = gh pr view $prNumber --json body,statusCheckRollup | ConvertFrom-Json
    
    $checksStatus = "UNKNOWN"
    if ($prDetails.statusCheckRollup) {
        $failedChecks = $prDetails.statusCheckRollup | Where-Object { $_.state -eq "FAILURE" -or $_.conclusion -eq "FAILURE" }
        $pendingChecks = $prDetails.statusCheckRollup | Where-Object { $_.state -eq "PENDING" }
        
        if ($failedChecks) {
            $checksStatus = "FAILED"
            Write-Host "  Tests FAILED" -ForegroundColor Red
        }
        elseif ($pendingChecks) {
            $checksStatus = "PENDING"
            Write-Host "  Tests PENDING" -ForegroundColor Yellow
        }
        else {
            $checksStatus = "PASSED"
            Write-Host "  Tests PASSED" -ForegroundColor Green
        }
    }
    
    if ($AutoMergePatch -and $updateType -eq "PATCH" -and $checksStatus -eq "PASSED" -and !$isSecurity) {
        Write-Host "`n  Auto-merging patch update..." -ForegroundColor Green
        gh pr merge $prNumber --squash --delete-branch
        Write-Host "  Merged!" -ForegroundColor Green
        continue
    }
    
    Write-Host "`n  Actions:" -ForegroundColor Cyan
    Write-Host "    [M] Merge and delete branch" -ForegroundColor Green
    Write-Host "    [T] Test locally" -ForegroundColor Yellow
    Write-Host "    [V] View PR in browser" -ForegroundColor Blue
    Write-Host "    [S] Skip" -ForegroundColor Gray
    Write-Host "    [Q] Quit" -ForegroundColor Red
    
    $action = Read-Host "`n  Choose action"
    
    switch ($action.ToUpper()) {
        "M" {
            if ($checksStatus -eq "FAILED") {
                Write-Host "  Warning: Tests failed. Are you sure? (y/N)" -ForegroundColor Yellow
                $confirm = Read-Host
                if ($confirm -ne "y") {
                    Write-Host "  Skipped." -ForegroundColor Gray
                    continue
                }
            }
            
            Write-Host "  Merging PR..." -ForegroundColor Green
            gh pr merge $prNumber --squash --delete-branch
            Write-Host "  Merged!" -ForegroundColor Green
        }
        
        "T" {
            Write-Host "  Checking out PR..." -ForegroundColor Yellow
            gh pr checkout $prNumber
            
            Write-Host "  Installing dependencies..." -ForegroundColor Yellow
            npm install
            
            Write-Host "  Running tests..." -ForegroundColor Yellow
            npm test
            
            Write-Host "  Running build..." -ForegroundColor Yellow
            npm run build
            
            Write-Host "`n  Test complete. Merge this PR? (y/N)" -ForegroundColor Cyan
            $merge = Read-Host
            if ($merge -eq "y") {
                git checkout main
                gh pr merge $prNumber --squash --delete-branch
                Write-Host "  Merged!" -ForegroundColor Green
            }
            else {
                git checkout main
                Write-Host "  Skipped." -ForegroundColor Gray
            }
        }
        
        "V" {
            gh pr view $prNumber --web
        }
        
        "S" {
            Write-Host "  Skipped." -ForegroundColor Gray
            continue
        }
        
        "Q" {
            Write-Host "`nExiting..." -ForegroundColor Cyan
            exit 0
        }
        
        default {
            Write-Host "  Invalid option. Skipping." -ForegroundColor Red
        }
    }
}

Write-Host "`nAll PRs reviewed!" -ForegroundColor Green
Write-Host "Run 'git checkout main' to return to main branch if needed." -ForegroundColor Gray
