"""
CoffeePreorderQR — Raspberry Pi locker hub (4 compartments).

Two jobs in one process:

  1. A small Flask web page with 4 manual "Unlock" buttons (handy for testing
     and for the barista to force-open a door).

  2. A background poller that asks the backend every couple of seconds
     "should I open any door?" (GET /api/locker-hub/pending). When the customer
     taps "Open Door" in the app, or scans their QR, the backend flips that
     compartment's `unlockPending` flag; we see it, pulse the solenoid, then
     POST /api/locker-hub/ack to clear it.

Why polling? The Pi sits behind a home router and the API is on Render —
Render can't reach into your LAN, so the Pi reaches out instead.

Wiring (one 5V relay channel per solenoid; 12V supply drives the solenoids):
    Compartment 1 -> relay IN1 -> GPIO17
    Compartment 2 -> relay IN2 -> GPIO27
    Compartment 3 -> relay IN3 -> GPIO22
    Compartment 4 -> relay IN4 -> GPIO23
See pi/README.md for the full diagram.

Config: copy pi/.env.example -> pi/.env and fill API_URL + LOCKER_HUB_KEY.
"""

import os
import threading
import time

import requests
from dotenv import load_dotenv
from flask import Flask, jsonify, render_template_string
from gpiozero import OutputDevice

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

API_URL = os.getenv("API_URL", "http://localhost:4000").rstrip("/")
HUB_KEY = os.getenv("LOCKER_HUB_KEY", "")
POLL_SECONDS = float(os.getenv("POLL_SECONDS", "2"))
PULSE_SECONDS = float(os.getenv("PULSE_SECONDS", "3"))
# Most blue relay boards are active-low; flip to "true" if yours is active-high.
RELAY_ACTIVE_HIGH = os.getenv("RELAY_ACTIVE_HIGH", "false").lower() == "true"

# compartment number -> BCM GPIO pin
PIN_MAP = {1: 17, 2: 27, 3: 22, 4: 23}

relays = {
    num: OutputDevice(pin, active_high=RELAY_ACTIVE_HIGH, initial_value=False)
    for num, pin in PIN_MAP.items()
}

app = Flask(__name__)


def open_compartment(num: int):
    """Pulse one solenoid open for PULSE_SECONDS, then re-lock."""
    relay = relays.get(num)
    if not relay:
        print(f"[hub] no relay for compartment {num}")
        return
    print(f"[hub] >>> OPEN compartment {num} ({PULSE_SECONDS}s)")
    relay.on()
    threading.Timer(PULSE_SECONDS, lambda: (relay.off(), print(f"[hub] <<< compartment {num} re-locked"))).start()


# ---------------------------------------------------------------- background poll
def poll_loop():
    if not HUB_KEY:
        print("[hub] WARNING: LOCKER_HUB_KEY is empty — set it in pi/.env. Poller disabled.")
        return
    print(f"[hub] polling {API_URL}/api/locker-hub/pending every {POLL_SECONDS}s")
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
                    print(f"[hub] backend says open: {compartments}")
                    for num in compartments:
                        open_compartment(num)
                    # Ack so they don't re-open next tick.
                    session.post(
                        f"{API_URL}/api/locker-hub/ack",
                        params={"key": HUB_KEY},
                        json={"compartments": compartments},
                        timeout=8,
                    )
            elif r.status_code == 401:
                print("[hub] 401 — LOCKER_HUB_KEY mismatch with server. Check pi/.env.")
            # else: 5xx / sleeping Render instance — just retry next tick.
        except requests.RequestException as e:
            print(f"[hub] poll error: {e}")
        time.sleep(POLL_SECONDS)


# ---------------------------------------------------------------- web UI
HTML_PAGE = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coffee Locker Hub</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 min-h-screen flex flex-col items-center justify-center font-sans gap-6 p-6">
  <h1 class="text-3xl font-bold text-amber-400">☕ Coffee Locker Hub</h1>
  <p class="text-slate-400 text-sm">4 compartments · auto-opens from the app, or tap to force-open</p>
  <div class="grid grid-cols-2 gap-4 w-full max-w-md">
    {% for n in [1,2,3,4] %}
    <div class="bg-slate-800 p-6 rounded-2xl shadow-lg text-center">
      <h2 class="text-lg font-bold text-slate-200 mb-3">Door {{n}}</h2>
      <button onclick="unlock({{n}})"
        class="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-3 rounded-xl transition active:scale-95">
        Unlock
      </button>
    </div>
    {% endfor %}
  </div>
  <script>
    async function unlock(n) {
      await fetch('/api/unlock/' + n, { method: 'POST' });
    }
  </script>
</body>
</html>
"""


@app.route("/")
def index():
    return render_template_string(HTML_PAGE)


@app.route("/api/unlock/<int:num>", methods=["POST"])
def manual_unlock(num):
    if num not in PIN_MAP:
        return jsonify({"status": "error", "message": "Invalid compartment"}), 400
    open_compartment(num)
    return jsonify({"status": "success", "compartment": num})


if __name__ == "__main__":
    # Start the poller in the background, then serve the web UI.
    threading.Thread(target=poll_loop, daemon=True).start()
    app.run(host="0.0.0.0", port=5000)
