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
call "%PROJECT_DIR%stop.bat" >nul 2>nul

:: 检查 Node.js
echo [INFO] 检查 Node.js...
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 未找到 Node.js，请先安装 Node.js
    echo        下载地址: https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo [INFO] Node.js 版本: %%i

:: 检查 npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] 未找到 npm
    pause
    exit /b 1
)

:: 安装根目录依赖
if not exist "%PROJECT_DIR%node_modules" (
    echo [INFO] 安装根目录依赖...
    cd /d "%PROJECT_DIR%"
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] 根目录依赖安装失败
        pause
        exit /b 1
    )
)

:: 安装前端依赖
if not exist "%PROJECT_DIR%frontend\node_modules" (
    echo [INFO] 安装前端依赖...
    cd /d "%PROJECT_DIR%frontend"
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] 前端依赖安装失败
        pause
        exit /b 1
    )
)

:: 安装后端依赖
if not exist "%PROJECT_DIR%backend\node_modules" (
    echo [INFO] 安装后端依赖...
    cd /d "%PROJECT_DIR%backend"
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] 后端依赖安装失败
        pause
        exit /b 1
    )
)

:: 创建后端环境配置
if not exist "%PROJECT_DIR%backend\.env" (
    echo [INFO] 创建后端环境配置文件...
    copy "%PROJECT_DIR%backend\.env.example" "%PROJECT_DIR%backend\.env" >nul
)

:: 创建数据目录
if not exist "%PROJECT_DIR%backend\data" (
    mkdir "%PROJECT_DIR%backend\data"
)

:: 启动后端
echo [INFO] 启动后端服务...
cd /d "%PROJECT_DIR%backend"
start "EBook-Backend" cmd /k "npm run dev"

:: 等待后端启动
echo [INFO] 等待后端启动...
timeout /t 5 /nobreak >nul

:: 启动前端
echo [INFO] 启动前端服务...
cd /d "%PROJECT_DIR%frontend"
start "EBook-Frontend" cmd /k "npm run dev"

cd /d "%PROJECT_DIR%"

echo.
echo ==========================================
echo [INFO] 服务正在启动中...
echo.
echo   请等待新窗口中的服务完全启动后访问:
echo.
echo   前端地址: http://localhost:3000
echo   后端地址: http://localhost:3001
echo   默认账号: admin / admin123
echo.
echo   如果启动失败，请查看新打开的命令行窗口中的错误信息
echo.
echo   停止服务: stop.bat
echo ==========================================
echo.
pause
