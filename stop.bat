@echo off
chcp 65001 >nul

:: 电子书后台管理系统 - 停止脚本 (Windows)
:: 用法: stop.bat

echo.
echo ==========================================
echo    电子书后台管理系统 - 停止服务
echo ==========================================
echo.

echo [INFO] 正在停止服务...

:: 关闭启动的命令窗口
taskkill /fi "WINDOWTITLE eq EBook-Backend*" /f >nul 2>nul
taskkill /fi "WINDOWTITLE eq EBook-Frontend*" /f >nul 2>nul

:: 杀死可能残留的 node 进程 (vite 和 tsx)
for /f "tokens=2 delims=," %%a in ('tasklist /v /fo csv ^| findstr /i "vite"') do (
    taskkill /pid %%~a /f >nul 2>nul
)
for /f "tokens=2 delims=," %%a in ('tasklist /v /fo csv ^| findstr /i "tsx"') do (
    taskkill /pid %%~a /f >nul 2>nul
)

echo.
echo [INFO] 所有服务已停止
echo.
echo   重新启动: restart.bat
echo ==========================================
echo.
