@echo off
cd /d "%~dp0"
if exist "dist\Tokenut-win32-x64\Tokenut.exe" (
 start "" "dist\Tokenut-win32-x64\Tokenut.exe"
) else (
 call npm.cmd start
)
