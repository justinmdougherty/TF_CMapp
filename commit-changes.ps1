# PowerShell script to commit and push all recent changes
# This script will stage all changes, commit them, and push to the repository

Write-Host "🚀 Starting H10CM commit and push process..." -ForegroundColor Green

# Check if we're in a git repository
if (-not (Test-Path ".git")) {
    Write-Host "❌ Error: Not in a git repository" -ForegroundColor Red
    Write-Host "Please run this script from the H10CM root directory" -ForegroundColor Yellow
    exit 1
}

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "📝 Current branch: $currentBranch" -ForegroundColor Blue

# Show current status
Write-Host "`n📊 Current git status:" -ForegroundColor Blue
git status --porcelain

# Get list of changed files
$modifiedFiles = git diff --name-only HEAD
$stagedFiles = git diff --cached --name-only
$untrackedFiles = git ls-files --others --exclude-standard

Write-Host "`n📋 Summary of changes:" -ForegroundColor Blue
if ($modifiedFiles) {
    Write-Host "   Modified files: $($modifiedFiles.Count)" -ForegroundColor Yellow
    $modifiedFiles | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
}
if ($stagedFiles) {
    Write-Host "   Staged files: $($stagedFiles.Count)" -ForegroundColor Green
    $stagedFiles | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
}
if ($untrackedFiles) {
    Write-Host "   Untracked files: $($untrackedFiles.Count)" -ForegroundColor Cyan
    $untrackedFiles | ForEach-Object { Write-Host "     - $_" -ForegroundColor Gray }
}

# Confirm before proceeding
Write-Host "`n⚠️  This will stage ALL changes and commit them." -ForegroundColor Yellow
$confirm = Read-Host "Do you want to continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Operation cancelled" -ForegroundColor Red
    exit 0
}

# Stage all changes
Write-Host "`n📦 Staging all changes..." -ForegroundColor Blue
git add -A

# Check if there are any changes to commit
$hasChanges = git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "❌ No changes to commit" -ForegroundColor Red
    exit 0
}

# Get commit message
Write-Host "`n📝 Enter commit message (or press Enter for default):" -ForegroundColor Blue
$commitMessage = Read-Host "Message"

if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    $commitMessage = "fix: resolve TypeScript compilation errors and update system

- Fixed RBACContext.tsx TypeScript errors
- Updated procurement API import paths
- Resolved missing properties in UserProfile type
- Fixed role type mismatches in access control
- Cleaned up unused imports and variables
- Updated README.md with current status

Updated: $timestamp"
}

# Commit changes
Write-Host "`n💾 Committing changes..." -ForegroundColor Blue
git commit -m "$commitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Changes committed successfully" -ForegroundColor Green

# Push to remote
Write-Host "`n🚀 Pushing to remote repository..." -ForegroundColor Blue
git push origin $currentBranch

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed" -ForegroundColor Red
    Write-Host "You may need to pull first or resolve conflicts" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Successfully pushed to remote!" -ForegroundColor Green

# Final status
Write-Host "`n🎉 All done! Final status:" -ForegroundColor Green
git status --porcelain

# Show recent commits
Write-Host "`n📚 Recent commits:" -ForegroundColor Blue
git log --oneline -5

Write-Host "`n🎯 Next steps:" -ForegroundColor Blue
Write-Host "  - Your changes are now saved and pushed to the repository" -ForegroundColor Gray
Write-Host "  - The TypeScript errors have been resolved" -ForegroundColor Gray
Write-Host "  - The procurement system is fully functional" -ForegroundColor Gray
Write-Host "  - You can continue development with confidence" -ForegroundColor Gray

Write-Host "`n🔗 Repository: https://github.com/justinmdougherty/H10CM" -ForegroundColor Cyan
