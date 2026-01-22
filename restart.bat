@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: 电子书后台管理系统 - 启动/重启脚本 (Windows)
:: 用法: restart.bat

echo.
echo ==========================================
echo    电子书后台管理系统 - 启动/重启
echo ==========================================
echo.

set "PROJECT_DIR=%~dp0"
cd /d "%PROJECT_DIR%"

:: 先停止已运行的服务
call :stop_services

:: 检查 Node.js
echo [INFO] 检查 Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 未找到 Node.js，请先安装
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo [INFO] Node.js 版本: %%i

:: 安装依赖
call :install_deps

:: 创建后端环境配置
if not exist "backend\.env" (
    echo [INFO] 创建后端环境配置文件...
    copy "backend\.env.example" "backend\.env" >nul
)

:: 启动后端
echo [INFO] 启动后端服务...
cd /d "%PROJECT_DIR%backend"
start "EBook-Backend" cmd /c "npm run dev"
cd /d "%PROJECT_DIR%"

:: 等待后端启动
timeout /t 3 /nobreak >nul

:: 启动前端
echo [INFO] 启动前端服务...
cd /d "%PROJECT_DIR%frontend"
start "EBook-Frontend" cmd /c "npm run dev"
cd /d "%PROJECT_DIR%"

echo.
echo ==========================================
echo [INFO] 所有服务启动完成!
echo.
echo   前端地址: http://localhost:3000
echo   后端地址: http://localhost:3001
echo   默认账号: admin / admin123
echo.
echo   停止服务: stop.bat
echo ==========================================
echo.

goto :eof

:: 停止服务函数
:stop_services
echo [INFO] 停止已运行的服务...
:: 杀死 node 相关进程（vite 和 tsx）
for /f "tokens=2" %%a in ('tasklist /fi "WINDOWTITLE eq EBook-Backend" /fo list ^| find "PID:"') do (
    taskkill /pid %%a /f >nul 2>nul
)
for /f "tokens=2" %%a in ('tasklist /fi "WINDOWTITLE eq EBook-Frontend" /fo list ^| find "PID:"') do (
    taskkill /pid %%a /f >nul 2>nul
)
timeout /t 1 /nobreak >nul
goto :eof

:: 安装依赖函数
:install_deps
if not exist "node_modules" (
    echo [INFO] 安装根目录依赖...
    call npm install
)
if not exist "frontend\node_modules" (
    echo [INFO] 安装前端依赖...
    cd /d "%PROJECT_DIR%frontend"
    call npm install
    cd /d "%PROJECT_DIR%"
)
if not exist "backend\node_modules" (
    echo [INFO] 安装后端依赖...
    cd /d "%PROJECT_DIR%backend"
    call npm install
    cd /d "%PROJECT_DIR%"
)
goto :eof
