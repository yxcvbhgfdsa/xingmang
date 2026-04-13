@echo off
chcp 65001 >nul
echo ========================================
echo XingNovel - Stop Dev Services
echo ========================================
echo.

for %%P in (3000 5173) do (
    for /f "tokens=5" %%I in ('netstat -ano ^| findstr :%%P ^| findstr LISTENING') do (
        echo Stopping process %%I on port %%P ...
        taskkill /F /PID %%I >nul 2>nul
    )
)

echo Done.
pause
