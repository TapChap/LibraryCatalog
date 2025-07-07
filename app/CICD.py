from flask import Flask
import subprocess, os, signal, sys, time

app = Flask(__name__)

REPO_PATH = os.path.dirname(os.path.abspath(__file__))
PID_FILE = os.path.join(REPO_PATH, "server.pid")
SERVER_SCRIPT = os.path.join(REPO_PATH, "app.py")
LOG_FILE = os.path.join(REPO_PATH, "server.log")

# Redirect listener output to file
sys.stdout = open(os.path.join(REPO_PATH, "update_listener.log"), "a")
sys.stderr = sys.stdout

def kill_old_server():
    if not os.path.exists(PID_FILE):
        print("No PID file found.")
        return

    with open(PID_FILE, "r") as f:
        pid = int(f.read().strip())

    try:
        os.kill(pid, signal.SIGTERM)
        print(f"Killed process {pid}")
        time.sleep(1)  # Wait a bit to ensure it's dead
    except Exception as e:
        print(f"Failed to kill PID {pid}: {e}")

def restart_server():
    # Run server with pythonw and save its PID
    creationflags = subprocess.CREATE_NO_WINDOW
    proc = subprocess.Popen(
        ["pythonw", SERVER_SCRIPT],
        cwd=REPO_PATH,
        stdout=open(LOG_FILE, "a"),
        stderr=subprocess.STDOUT,
        creationflags=creationflags
    )
    with open(PID_FILE, "w") as f:
        f.write(str(proc.pid))
    print(f"Started server with PID {proc.pid}")

@app.route("/update", methods=["POST"])
def update():
    try:
        subprocess.run(["git", "pull"], cwd=REPO_PATH, check=True)
        kill_old_server()
        restart_server()
        return "Updated and restarted.", 200
    except Exception as e:
        print(f"Exception during update: {e}")
        return "Error", 500

if __name__ == "__main__":
    print("Flask listener started.")
    app.run(host="0.0.0.0", port=6000)
