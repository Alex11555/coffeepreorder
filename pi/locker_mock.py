"""
Mock version of locker_hub.py — runs on Mac/PC without GPIO hardware.
Polls the backend for unlock commands and prints which doors WOULD open.
Useful for testing the full flow without a Raspberry Pi.

Usage:
  cd pi
  source .venv/bin/activate   (or just pip install requests flask python-dotenv)
  python locker_mock.py
"""

import os
import threading
import time

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template_string

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

API_URL = os.getenv("API_URL", "http://localhost:4000").rstrip("/")
HUB_KEY = os.getenv("LOCKER_HUB_KEY", "")
POLL_SECONDS = float(os.getenv("POLL_SECONDS", "2"))
PULSE_SECONDS = float(os.getenv("PULSE_SECONDS", "3"))

app = Flask(__name__)


def open_compartment(num):
    print(f"  🔓 [MOCK] Door {num} OPEN for {PULSE_SECONDS}s")
    def relock():
        print(f"  🔒 [MOCK] Door {num} re-locked")
    threading.Timer(PULSE_SECONDS, relock).start()


def poll_loop():
    if not HUB_KEY:
        print("[mock] WARNING: LOCKER_HUB_KEY is empty — set it in pi/.env")
        return
    print(f"[mock] polling {API_URL}/api/locker-hub/pending every {POLL_SECONDS}s")
    session = requests.Session()
    while True:
        try:
            r = session.get(
                f"{API_URL}/api/locker-hub/pending",
                params={"key": HUB_KEY},
                timeout=8,
            )
            if r.status_code == 200:
                compartments = r.json().get("compartments", [])
                if compartments:
                    print(f"\n⚡ Backend says OPEN: {compartments}")
                    for num in compartments:
                        open_compartment(num)
                    session.post(
                        f"{API_URL}/api/locker-hub/ack",
                        params={"key": HUB_KEY},
                        json={"compartments": compartments},
                        timeout=8,
                    )
            elif r.status_code == 401:
                print("[mock] 401 — LOCKER_HUB_KEY mismatch. Check pi/.env")
        except requests.RequestException as e:
            print(f"[mock] poll error: {e}")
        time.sleep(POLL_SECONDS)


HTML_PAGE = """
<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mock Locker</title><script src="https://cdn.tailwindcss.com"></script></head>
<body class="bg-slate-900 min-h-screen flex flex-col items-center justify-center font-sans gap-6 p-6">
  <h1 class="text-3xl font-bold text-amber-400">☕ Mock Locker (no GPIO)</h1>
  <p class="text-slate-400 text-sm">Simulates 4 doors — check the terminal for open/close logs</p>
  <div class="grid grid-cols-2 gap-4 w-full max-w-md">
    {% for n in [1,2,3,4] %}
    <div class="bg-slate-800 p-6 rounded-2xl shadow-lg text-center">
      <h2 class="text-lg font-bold text-slate-200 mb-3">Door {{n}}</h2>
      <button onclick="fetch('/api/unlock/'+{{n}},{method:'POST'})"
        class="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl transition active:scale-95">
        Unlock
      </button>
    </div>
    {% endfor %}
  </div>
</body></html>
"""

@app.route("/")
def index():
    return render_template_string(HTML_PAGE)

@app.route("/api/unlock/<int:num>", methods=["POST"])
def manual_unlock(num):
    if num not in (1, 2, 3, 4):
        return jsonify({"error": "Invalid door"}), 400
    open_compartment(num)
    return jsonify({"status": "success", "compartment": num})


if __name__ == "__main__":
    threading.Thread(target=poll_loop, daemon=True).start()
    print(f"\n☕ Mock Locker Hub running at http://localhost:5050\n")
    app.run(host="0.0.0.0", port=5050)
