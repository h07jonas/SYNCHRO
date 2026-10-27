@echo off
setlocal
cd /d "%~dp0"

rem Python finden. Der Microsoft-Store-Platzhalter (WindowsApps\python.exe) zaehlt nicht,
rem deshalb wird jeder Kandidat wirklich ausgefuehrt.
set PYCMD=
py -3 --version >nul 2>nul && set PYCMD=py -3
if not defined PYCMD (
    python --version >nul 2>nul && set PYCMD=python
)

if not defined PYCMD (
    echo Python wurde nicht gefunden.
    echo Bitte installiere Python 3 von https://www.python.org/downloads/
    echo und setze beim Installieren den Haken bei "Add python.exe to PATH".
    pause
    exit /b 1
)

rem Freien Port suchen (ein alter Server auf 8000 wuerde sonst den Start still blockieren)
set PORT=8000
:findport
powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort %PORT% -State Listen -ErrorAction SilentlyContinue) { exit 1 } else { exit 0 }" >nul 2>nul
if errorlevel 1 (
    set /a PORT+=1
    if %PORT% GTR 8020 (
        echo Kein freier Port zwischen 8000 und 8020 gefunden.
        pause
        exit /b 1
    )
    goto findport
)

set URL=http://127.0.0.1:%PORT%/index.html

echo Starte lokalen Server auf %URL%
echo Das Server-Fenster muss offen bleiben, solange du die Seite benutzt.

rem Server in eigenem Fenster (cmd /k = Fenster bleibt offen, Fehler sind sichtbar)
start "SYNCHRO Server" cmd /k %PYCMD% -m http.server %PORT% --bind 127.0.0.1

rem Warten bis der Server antwortet (max. ca. 10 s), dann Browser oeffnen
set /a TRIES=0
:waitserver
powershell -NoProfile -Command "try { (Invoke-WebRequest '%URL%' -UseBasicParsing -TimeoutSec 2).StatusCode | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if not errorlevel 1 goto open
set /a TRIES+=1
if %TRIES% GEQ 10 (
    echo Der Server antwortet nicht. Siehe Fehlermeldung im Server-Fenster.
    pause
    exit /b 1
)
ping -n 2 127.0.0.1 >nul
goto waitserver

:open
start "" "%URL%"
exit /b 0
