@echo off
cd /d "\app"

echo Starting update listener...
start "" pythonw CICD.pyw

echo Starting server app...
start "" pythonw server.pyw

echo All started in background.
exit

REM TASKKILL /F /IM pythonw.exe