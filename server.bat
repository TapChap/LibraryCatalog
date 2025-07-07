@echo off
cd "./app"

echo Starting update listener...
start "" pythonw CICD.pyw > CICD.log 2>&1

echo Starting server app...
start "" pythonw server.pyw > server.log 2>&1

echo All started in background.
exit

REM TASKKILL /F /IM pythonw.exe