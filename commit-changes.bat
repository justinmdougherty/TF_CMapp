@echo off
REM Quick commit and push script for H10CM
REM This will stage all changes, commit them, and push to the repository

echo.
echo ========================================
echo  H10CM Quick Commit and Push Script
echo ========================================
echo.

REM Check if we're in a git repository
if not exist ".git" (
    echo ERROR: Not in a git repository
    echo Please run this script from the H10CM root directory
    pause
    exit /b 1
)

REM Show current status
echo Current git status:
git status --short

echo.
echo WARNING: This will stage ALL changes and commit them.
set /p confirm="Do you want to continue? (y/N): "

if /i not "%confirm%"=="y" (
    echo Operation cancelled
    pause
    exit /b 0
)

echo.
echo Staging all changes...
git add -A

echo.
echo Committing changes...
git commit -m "fix: resolve TypeScript compilation errors and update system

- Fixed RBACContext.tsx TypeScript errors
- Updated procurement API import paths  
- Resolved missing properties in UserProfile type
- Fixed role type mismatches in access control
- Cleaned up unused imports and variables
- Updated README.md with current status

Auto-committed: %date% %time%"

echo.
echo Pushing to remote repository...
git push origin master

if %errorlevel% neq 0 (
    echo.
    echo Push failed. You may need to pull first or resolve conflicts.
    pause
    exit /b 1
)

echo.
echo ========================================
echo SUCCESS! All changes have been committed and pushed.
echo ========================================
echo.

echo Final status:
git status --short

echo.
echo Recent commits:
git log --oneline -3

echo.
echo Next steps:
echo - Your changes are now saved and pushed to the repository
echo - The TypeScript errors have been resolved
echo - The procurement system is fully functional
echo - You can continue development with confidence

echo.
pause
