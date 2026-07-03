@echo off
REM Launch the Delta site locally.
cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel%==0 (
    echo Starting local server at http://localhost:8000 ...
    start "" http://localhost:8000/index.html
    python -m http.server 8000
    goto :eof
)

where py >nul 2>nul
if %errorlevel%==0 (
    echo Starting local server at http://localhost:8000 ...
    start "" http://localhost:8000/index.html
    py -m http.server 8000
    goto :eof
)

echo Python not found - opening index.html directly in your browser.
start "" "%~dp0index.html"
