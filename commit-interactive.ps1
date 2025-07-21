#!/usr/bin/env powershell
# Interactive Git Commit Script for H10CM
# Prompts for commit message and handles the complete git workflow

Write-Host "🚀 H10CM Interactive Commit Script" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check if we're in a git repository
if (!(Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    Write-Host "Please run this script from the H10CM project root directory" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Check current git status
Write-Host "📊 Current Git Status:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
git status --porcelain
Write-Host ""

# Get detailed status
$gitStatus = git status --porcelain
if ($gitStatus.Count -eq 0) {
    Write-Host "✅ No changes detected. Working directory is clean." -ForegroundColor Green
    Read-Host "Press Enter to exit"
    exit 0
}

# Show file changes summary
Write-Host "📝 Files that will be committed:" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow
$modified = ($gitStatus | Where-Object { $_ -match "^\s*M" }).Count
$added = ($gitStatus | Where-Object { $_ -match "^\s*A" }).Count
$deleted = ($gitStatus | Where-Object { $_ -match "^\s*D" }).Count
$renamed = ($gitStatus | Where-Object { $_ -match "^\s*R" }).Count
$untracked = ($gitStatus | Where-Object { $_ -match "^\?\?" }).Count

if ($modified -gt 0) { Write-Host "  📝 Modified: $modified files" -ForegroundColor Blue }
if ($added -gt 0) { Write-Host "  ➕ Added: $added files" -ForegroundColor Green }
if ($deleted -gt 0) { Write-Host "  ❌ Deleted: $deleted files" -ForegroundColor Red }
if ($renamed -gt 0) { Write-Host "  🔄 Renamed: $renamed files" -ForegroundColor Magenta }
if ($untracked -gt 0) { Write-Host "  ❓ Untracked: $untracked files" -ForegroundColor Yellow }

Write-Host ""
Write-Host "🔍 Detailed file list:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Prompt for commit message
Write-Host "💬 Enter your commit message:" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green
Write-Host "Examples:" -ForegroundColor Gray
Write-Host "  feat: add new procurement dashboard" -ForegroundColor Gray
Write-Host "  fix: resolve TypeScript compilation errors" -ForegroundColor Gray
Write-Host "  docs: update README with deployment instructions" -ForegroundColor Gray
Write-Host "  refactor: improve cart system error handling" -ForegroundColor Gray
Write-Host ""

$commitMessage = Read-Host "Commit message"

# Validate commit message
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    Write-Host "❌ Error: Commit message cannot be empty" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Show what will be committed
Write-Host ""
Write-Host "🔄 Preparing to commit with message:" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "`"$commitMessage`"" -ForegroundColor White
Write-Host ""

# Confirmation prompt
$confirm = Read-Host "Continue with commit and push? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Operation cancelled by user" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host ""
Write-Host "🚀 Executing Git Operations..." -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

try {
    # Stage all changes
    Write-Host "📦 Staging all changes..." -ForegroundColor Blue
    git add .
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to stage changes"
    }
    Write-Host "✅ All changes staged successfully" -ForegroundColor Green

    # Commit changes
    Write-Host "💾 Committing changes..." -ForegroundColor Blue
    git commit -m "$commitMessage"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to commit changes"
    }
    Write-Host "✅ Changes committed successfully" -ForegroundColor Green

    # Push to remote
    Write-Host "☁️  Pushing to remote repository..." -ForegroundColor Blue
    git push origin master
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to push to remote repository"
    }
    Write-Host "✅ Changes pushed to remote successfully" -ForegroundColor Green

    # Final status
    Write-Host ""
    Write-Host "🎉 SUCCESS! All operations completed successfully" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host "📊 Final repository status:" -ForegroundColor Cyan
    git status --short
    
    if ((git status --porcelain).Count -eq 0) {
        Write-Host "✅ Working directory is clean" -ForegroundColor Green
    }

    Write-Host ""
    Write-Host "📋 Recent commits:" -ForegroundColor Cyan
    git log --oneline -5
    
}
catch {
    Write-Host ""
    Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "===========================================" -ForegroundColor Red
    Write-Host "Current repository status:" -ForegroundColor Yellow
    git status --short
    
    Write-Host ""
    Write-Host "🔧 Troubleshooting suggestions:" -ForegroundColor Yellow
    Write-Host "1. Check your git configuration: git config --list" -ForegroundColor Gray
    Write-Host "2. Verify remote repository access: git remote -v" -ForegroundColor Gray
    Write-Host "3. Check network connectivity and authentication" -ForegroundColor Gray
    Write-Host "4. Try running individual git commands manually" -ForegroundColor Gray
}

Write-Host ""
Read-Host "Press Enter to exit"
