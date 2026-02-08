@echo off
REM Asset Manager - Docker Setup for Windows

setlocal enabledelayedexpansion

echo ================================
echo Asset Manager - Docker Setup
echo ================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. 
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo ✅ Docker found

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed
    pause
    exit /b 1
)

echo ✅ Docker Compose found
echo.

:menu
echo Choose an option:
echo 1) Start application with MongoDB
echo 2) Stop application
echo 3) View application logs
echo 4) View MongoDB logs
echo 5) Reset everything (DELETE all data, rebuild)
echo 6) Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" (
    echo.
    echo 🚀 Starting Asset Manager with MongoDB...
    docker-compose up -d
    echo.
    echo ✅ Application is starting!
    echo    Open your browser: http://localhost:5000
    echo.
    echo Demo Accounts:
    echo   Admin:    admin / admin123
    echo   Trainer:  trainer1 / trainer123
    echo   Student:  ahmed / student123
    echo.
    echo To see logs in PowerShell, run: docker-compose logs -f app
    echo.
    pause
    goto menu
) else if "%choice%"=="2" (
    echo.
    echo 🛑 Stopping application...
    docker-compose down
    echo ✅ Application stopped
    echo.
    pause
    goto menu
) else if "%choice%"=="3" (
    echo.
    echo 📋 Application logs (close window to return)
    docker-compose logs -f app
    goto menu
) else if "%choice%"=="4" (
    echo.
    echo 📋 MongoDB logs (close window to return)
    docker-compose logs -f mongodb
    goto menu
) else if "%choice%"=="5" (
    echo.
    echo ⚠️  WARNING: This will DELETE all data!
    set /p confirm="Are you absolutely sure? (yes/no): "
    if "!confirm!"=="yes" (
        echo 🔄 Resetting everything...
        docker-compose down -v
        docker-compose up -d --build
        echo ✅ Reset complete! Application is starting at http://localhost:5000
        pause
        goto menu
    ) else (
        echo ❌ Cancelled
        goto menu
    )
) else if "%choice%"=="6" (
    echo Goodbye!
    exit /b 0
) else (
    echo ❌ Invalid choice. Please try again.
    echo.
    goto menu
)
