@echo off
setlocal EnableExtensions

title NEXUS COMPLY

cd /d "%~dp0"

echo.
echo ==========================================================
echo                 NEXUS COMPLY
echo          AI VIDEO COMPLIANCE PLATFORM
echo ==========================================================
echo.
echo Project:
echo %CD%
echo.

REM ==========================================================
REM 1. CHECK UV
REM ==========================================================

echo [1/5] Checking uv...

where uv >nul 2>&1

if errorlevel 1 (
    echo ERROR: uv is not installed or not in PATH.
    pause
    exit /b 1
)

uv --version
echo uv detected.

REM ==========================================================
REM 2. CHECK PYTHON
REM ==========================================================

echo.
echo [2/5] Checking Python...

python --version

if errorlevel 1 (
    echo ERROR: Python is not available.
    pause
    exit /b 1
)

REM ==========================================================
REM 3. CHECK AZURE CLI
REM ==========================================================

echo.
echo [3/5] Checking Azure CLI...

where az >nul 2>&1

if errorlevel 1 (
    echo ERROR: Azure CLI is not installed or not in PATH.
    pause
    exit /b 1
)

echo Azure CLI detected.
echo Azure authentication will be handled by the backend.

REM ==========================================================
REM 4. SYNC PYTHON DEPENDENCIES
REM ==========================================================

echo.
echo [4/5] Syncing Python dependencies...

uv sync

if errorlevel 1 (
    echo.
    echo ERROR: uv sync failed.
    pause
    exit /b 1
)

echo.
echo Python dependencies ready.

REM ==========================================================
REM 5. PREPARE FRONTEND
REM ==========================================================

echo.
echo [5/5] Preparing frontend...

if not exist "frontend\package.json" (
    echo.
    echo ERROR: frontend\package.json not found.
    pause
    exit /b 1
)

cd /d "%~dp0frontend"

if exist "package-lock.json" (
    echo package-lock.json found.
    echo Running npm ci...
    call npm ci
) else (
    echo package-lock.json not found.
    echo Running npm install...
    call npm install
)

if errorlevel 1 (
    echo.
    echo ERROR: npm dependency installation failed.
    cd /d "%~dp0"
    pause
    exit /b 1
)

cd /d "%~dp0"

REM ==========================================================
REM START BACKEND
REM ==========================================================

echo.
echo ==========================================================
echo              STARTING NEXUS COMPLY
echo ==========================================================
echo.

echo Starting backend...

start "NEXUS COMPLY BACKEND" cmd /k "cd /d ""%~dp0"" && uv run uvicorn backend.src.api.main:app --host 127.0.0.1 --port 8000"

echo Backend process started.

REM ==========================================================
REM WAIT FOR BACKEND
REM ==========================================================

echo.
echo Waiting for backend...

set "BACKEND_READY=0"

for /L %%i in (1,1,30) do (

    powershell -NoProfile -Command "try { $r=Invoke-WebRequest 'http://127.0.0.1:8000/health' -UseBasicParsing -TimeoutSec 2; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 } } catch { exit 1 }"

    if not errorlevel 1 (
        set "BACKEND_READY=1"
        goto BACKEND_READY
    )

    echo Waiting... %%i/30
    timeout /t 2 /nobreak >nul
)

:BACKEND_READY

if "%BACKEND_READY%"=="1" (
    echo.
    echo Backend is READY.
) else (
    echo.
    echo WARNING: Backend did not respond within 60 seconds.
    echo Check the backend terminal window.
)

REM ==========================================================
REM START FRONTEND
REM ==========================================================

echo.
echo Starting frontend...

start "NEXUS COMPLY FRONTEND" cmd /k "cd /d ""%~dp0frontend"" && npm run dev"

echo Frontend process started.

REM ==========================================================
REM WAIT FOR FRONTEND
REM ==========================================================

echo.
echo Waiting for frontend...

timeout /t 5 /nobreak >nul

REM ==========================================================
REM OPEN BROWSER
REM ==========================================================

echo.
echo Opening NEXUS COMPLY...

start "" "http://localhost:5173"

REM ==========================================================
REM FINAL STATUS
REM ==========================================================

echo.
echo ==========================================================
echo              NEXUS COMPLY RUNNING
echo ==========================================================
echo.
echo Frontend : http://localhost:5173
echo Backend  : http://127.0.0.1:8000
echo Swagger  : http://127.0.0.1:8000/docs
echo Health   : http://127.0.0.1:8000/health
echo.
echo ==========================================================
echo.

pause