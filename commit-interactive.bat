@echo off
REM Interactive Git Commit Script for H10CM - Batch Version
REM Prompts for commit message and handles the complete git workflow

echo.
echo 🚀 H10CM Interactive Commit Script
echo =================================
echo.

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ Error: Not in a git repository
    echo Please run this script from the H10CM project root directory
    pause
    exit /b 1
)

REM Check current git status
echo 📊 Current Git Status:
echo =====================
git status --porcelain
echo.

REM Check if there are changes
git status --porcelain > temp_status.txt
for /f %%i in ("temp_status.txt") do set size=%%~zi
del temp_status.txt

if %size% equ 0 (
    echo ✅ No changes detected. Working directory is clean.
    pause
    exit /b 0
)

REM Show detailed status
echo 📝 Files that will be committed:
echo ===============================
git status --short
echo.

REM Prompt for commit message
echo 💬 Enter your commit message:
echo =============================
echo Examples:
echo   feat: add new procurement dashboard
echo   fix: resolve TypeScript compilation errors
echo   docs: update README with deployment instructions
echo   refactor: improve cart system error handling
echo.

set /p commitMessage=Commit message: 

REM Validate commit message
if "%commitMessage%"=="" (
    echo ❌ Error: Commit message cannot be empty
    pause
    exit /b 1
)

REM Show what will be committed
echo.
echo 🔄 Preparing to commit with message:
echo ====================================
echo "%commitMessage%"
echo.

REM Confirmation prompt
set /p confirm=Continue with commit and push? (y/N): 
if /i not "%confirm%"=="y" (
    echo ❌ Operation cancelled by user
    pause
    exit /b 0
)

echo.
echo 🚀 Executing Git Operations...
echo ==============================

REM Stage all changes
echo 📦 Staging all changes...
git add .
if errorlevel 1 (
    echo ❌ Failed to stage changes
    pause
    exit /b 1
)
echo ✅ All changes staged successfully

REM Commit changes
echo 💾 Committing changes...
git commit -m "%commitMessage%"
if errorlevel 1 (
    echo ❌ Failed to commit changes
    pause
    exit /b 1
)
echo ✅ Changes committed successfully

REM Push to remote
echo ☁️  Pushing to remote repository...
git push origin master
if errorlevel 1 (
    echo ❌ Failed to push to remote repository
    echo Current repository status:
    git status --short
    pause
    exit /b 1
)
echo ✅ Changes pushed to remote successfully

REM Final status
echo.
echo 🎉 SUCCESS! All operations completed successfully
echo =============================================
echo 📊 Final repository status:
git status --short
echo.
echo 📋 Recent commits:
git log --oneline -5

echo.
pause
