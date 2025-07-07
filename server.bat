cd "app"

echo Starting update listener...
start "" pythonw CICD.pyw > CICD.log 2>&1

exit