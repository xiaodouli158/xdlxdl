@echo off
REM OBS x264 Encoder Configuration Batch File
REM
REM This batch file configures OBS x264 encoder settings and saves them to a specific profile's
REM streamEncoder.json file.
REM
REM Usage:
REM configure-x264.bat <profileName> <bitrate> <keyint_sec> <preset> <profile>
REM
REM Example:
REM configure-x264.bat Xiaomi_14_Pro 18000 2 medium high

echo Configuring OBS x264 encoder...

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
  echo Error: Node.js is not installed or not in PATH
  exit /b 1
)

REM Get arguments
set profileName=%1
set bitrate=%2
set keyint_sec=%3
set preset=%4
set profile=%5

REM Check if profile name is provided
if "%profileName%"=="" (
  echo Error: Profile name is required
  echo Usage: configure-x264.bat ^<profileName^> [bitrate] [keyint_sec] [preset] [profile]
  exit /b 1
)

REM Set default values if not provided
if "%bitrate%"=="" set bitrate=18000
if "%keyint_sec%"=="" set keyint_sec=2
if "%preset%"=="" set preset=medium
if "%profile%"=="" set profile=high

echo Profile: %profileName%
echo Bitrate: %bitrate%
echo Keyframe Interval: %keyint_sec%
echo Preset: %preset%
echo Profile: %profile%

REM Create encoder configuration
set configDir=%APPDATA%\obs-studio\basic\profiles\%profileName%
set configFile=%configDir%\streamEncoder.json

REM Create directory if it doesn't exist
if not exist "%configDir%" (
  echo Creating directory: %configDir%
  mkdir "%configDir%"
)

REM Create JSON content
echo {> "%configFile%"
echo   "bitrate": %bitrate%,>> "%configFile%"
echo   "keyint_sec": %keyint_sec%,>> "%configFile%"
echo   "preset": "%preset%",>> "%configFile%"
echo   "profile": "%profile%">> "%configFile%"
echo }>> "%configFile%"

echo Encoder settings written to: %configFile%
echo Configuration successful!

exit /b 0
