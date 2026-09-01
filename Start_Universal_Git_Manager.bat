@echo off
title Universal Git Manager
cd /d "%~dp0"

set "PS_CMD=powershell.exe"

where powershell.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    set "PS_CMD=powershell.exe"
) else if exist "%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" (
    set "PS_CMD=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
) else if exist "%ProgramFiles%\PowerShell\7\pwsh.exe" (
    set "PS_CMD=%ProgramFiles%\PowerShell\7\pwsh.exe"
) else (
    where pwsh.exe >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        set "PS_CMD=pwsh.exe"
    )
)

"%PS_CMD%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0git_universal_manager.ps1"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ==================================================================
    echo FEHLER: Das Git-Manager Skript konnte nicht gestartet werden.
    echo ==================================================================
    echo.
    pause
)
