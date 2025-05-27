@echo off

:: ====== Check for Admin ======
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~f0' -Verb runAs"
    exit /b
)

REM === Customize your domain and IP ===
set IP=127.0.0.1
set DOMAIN=library.machanaim.com

REM === Hosts file path ===
set HOSTS_FILE=%SystemRoot%\System32\drivers\etc\hosts

REM === Backup the original hosts file ===
copy "%HOSTS_FILE%" "%HOSTS_FILE%.bak" >nul

REM === Check if entry already exists ===
findstr /C:"%IP% %DOMAIN%" "%HOSTS_FILE%" >nul
if %errorlevel%==0 (
    echo Entry already exists: %IP% %DOMAIN%
) else (
    echo Adding entry: %IP% %DOMAIN%
    echo 	%IP% %DOMAIN%>>"%HOSTS_FILE%"
)

REM === Flush DNS cache ===
ipconfig /flushdns

exit
