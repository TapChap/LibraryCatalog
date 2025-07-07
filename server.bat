@echo off
cd /d "C:\Users\Shai grossman\PycharmProjects\LibraryTrackerBackEnd\.venv\Scripts"

echo Starting update listener...
start "" pythonw update_listener.py

echo Starting server app...
start "" pythonw app.py

echo All started in background.
exit