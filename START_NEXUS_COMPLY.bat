@echo off
setlocal EnableExtensions

title NEXUS COMPLY - Startup

echo.
echo ==========================================================
echo                 NEXUS COMPLY
echo          AI VIDEO COMPLIANCE PLATFORM
echo ==========================================================
echo.

cd /d "%~dp0"

echo [1/7] Checking project directory...
echo Project:
echo %CD%
echo.

REM ==========================================================
REM CHECK PYTHON
REM ==========================================================

echo [2/7] Checking Python...

where python >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERROR: Python was not found.
    echo Please install Python 3.11+ and add it to PATH.
    echo.
    pause
    exit /b 1
)

python --version

echo.


REM ==========================================================
REM CREATE VIRTUAL ENVIRONMENT
REM ==========================================================

echo [3/7] Checking Python virtual environment...

if not exist ".venv\Scripts\python.exe" (
    echo Virtual environment not found.
    echo Creating .venv...
    echo.

    python -m venv .venv

    if errorlevel 1 (
        echo.
        echo ERROR: Failed to create virtual environment.
        pause
        exit /b 1
    )

    echo Virtual environment created.
)

echo.


REM ==========================================================
REM INSTALL BACKEND DEPENDENCIES
REM ==========================================================

echo Installing backend dependencies...

if exist "requirements.txt" (

    ".venv\Scripts\python.exe" -m pip install --upgrade pip

    ".venv\Scripts\python.exe" -m pip install -r requirements.txt

    if errorlevel 1 (
        echo.
        echo ERROR: Backend dependency installation failed.
        pause
        exit /b 1
    )

) else (

    echo.
    echo WARNING:
    echo requirements.txt was not found.
    echo Backend dependencies cannot be installed automatically.
    echo.
)

echo Backend dependencies ready.
echo.


REM ==========================================================
REM CHECK NODE
REM ==========================================================

echo Checking Node.js...

where node >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERROR: Node.js was not found.
    echo Please install Node.js LTS.
    echo.
    pause
    exit /b 1
)

node --version
npm --version

echo.


REM ==========================================================
REM INSTALL FRONTEND DEPENDENCIES
REM ==========================================================

echo [4/7] Checking frontend dependencies...

cd /d "%~dp0frontend"

if not exist "package.json" (
    echo.
    echo ERROR: frontend\package.json was not found.
    cd /d "%~dp0"
    pause
    exit /b 1
)

if not exist "node_modules" (

    echo node_modules not found.
    echo Installing frontend dependencies...

    if exist "package-lock.json" (
        npm ci
    ) else (
        npm install
    )

    if errorlevel 1 (
        echo.
        echo ERROR: Frontend dependency installation failed.
        cd /d "%~dp0"
        pause
        exit /b 1
    )

) else (

    echo node_modules already exists.
    echo Checking dependencies...

    if exist "package-lock.json" (
        npm ci
    ) else (
        npm install
    )

    if errorlevel 1 (
        echo.
        echo ERROR: npm dependency check failed.
        cd /d "%~dp0"
        pause
        exit /b 1
    )
)

echo Frontend dependencies ready.
echo.


REM ==========================================================
REM START BACKEND
REM ==========================================================

echo [5/7] Starting NEXUS COMPLY backend...

cd /d "%~dp0"

start "NEXUS COMPLY - BACKEND" cmd /k ^
".venv\Scripts\python.exe -m uvicorn backend.src.api.main:app --host 127.0.0.1 --port 8000"

echo Backend process started.
echo.


REM ==========================================================
REM WAIT FOR BACKEND
REM ==========================================================

echo [6/7] Waiting for backend...

set BACKEND_READY=0

for /L %%i in (1,1,30) do (

    powershell -NoProfile -Command ^
    "try { $r=Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8000/health -TimeoutSec 2; if($r.StatusCode -eq 200){exit 0}else{exit 1} } catch { exit 1 }"

    if not errorlevel 1 (
        set BACKEND_READY=1
        goto BACKEND_READY
    )

    echo Waiting... %%i/30
    timeout /t 2 /nobreak >nul
)

:BACKEND_READY

if "%BACKEND_READY%"=="0" (
    echo.
    echo WARNING:
    echo Backend did not respond within the expected time.
    echo Check the backend terminal window.
    echo.
) else (
    echo Backend is ONLINE.
)

echo.


REM ==========================================================
REM START FRONTEND
REM ==========================================================

echo Starting NEXUS COMPLY frontend...

cd /d "%~dp0frontend"

start "NEXUS COMPLY - FRONTEND" cmd /k "npm run dev"

echo Frontend process started.
echo.


REM ==========================================================
REM WAIT FOR FRONTEND
REM ==========================================================

echo Waiting for frontend...

timeout /t 5 /nobreak >nul

echo.


REM ==========================================================
REM OPEN BROWSER
REM ==========================================================

echo [7/7] Opening NEXUS COMPLY...

start "" "http://localhost:5173/"

echo.
echo ==========================================================
echo              NEXUS COMPLY IS RUNNING
echo ==========================================================
echo.
echo Frontend:
echo http://localhost:5173/
echo.
echo Backend:
echo http://127.0.0.1:8000/
echo.
echo Swagger:
echo http://127.0.0.1:8000/docs
echo.
echo Health:
echo http://127.0.0.1:8000/health
echo.
echo ==========================================================
echo.
echo Keep the backend and frontend terminal windows open.
echo Close them when you want to stop NEXUS COMPLY.
echo.

pause