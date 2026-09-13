@echo off
set "BUILD_SCRIPT=%~dp0plugin\build.js"
set "SOURCE=%~dp0plugin\reuploader.rbxmx"
set "DEST_DIR=%localappdata%\Roblox\Plugins"

echo Compiling plugin source to rbxmx...
node "%BUILD_SCRIPT%"
if %errorlevel% neq 0 (
    echo Error: Failed to build rbxmx file.
    pause
    exit /b %errorlevel%
)

echo Copying reuploader.rbxmx to Roblox Studio plugins directory...
if not exist "%DEST_DIR%" (
    echo Creating directory: %DEST_DIR%
    mkdir "%DEST_DIR%"
)

copy /Y "%SOURCE%" "%DEST_DIR%\reuploader.rbxmx"

if exist "%DEST_DIR%\replacer.lua" (
    del "%DEST_DIR%\replacer.lua"
)
if exist "%DEST_DIR%\replacer.rbxmx" (
    del "%DEST_DIR%\replacer.rbxmx"
)
if exist "%DEST_DIR%\reuploader.lua" (
    del "%DEST_DIR%\reuploader.lua"
)

if %errorlevel% equ 0 (
    echo.
    echo =========================================
    echo Plugin successfully installed/updated!
    echo =========================================
) else (
    echo.
    echo =========================================
    echo Error: Failed to copy plugin.
    echo =========================================
)
pause
