"""
CoffeePreorderQR — QR scanner for the Raspberry Pi Camera Module 3.

Watches the Pi Camera for a QR code shown on a customer's phone and POSTs the
token to the backend's /api/pickup/scan. The backend verifies it, marks the
order PICKED_UP, and flags that compartment to open. The SEPARATE locker_hub.py
process (which owns the GPIO/relays and polls the backend) then pulses the
right solenoid.

So this script does NOT touch GPIO — run it ALONGSIDE locker_hub.py:
    Terminal 1:  python locker_hub.py     # owns relays, opens doors
    Terminal 2:  python scanner.py        # reads QR, tells the backend

Camera Module 3 uses libcamera on Bookworm, so we use Picamera2 (not OpenCV's
VideoCapture, which only sees USB webcams).

Setup (see notes printed by install below):
    sudo apt install -y python3-picamera2 libzbar0
    pip install pyzbar requests python-dotenv numpy
"""

import os
import time

import numpy as np
import requests
from dotenv import load_dotenv
from pyzbar.pyzbar import decode
from picamera2 import Picamera2

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

API_URL = os.getenv("API_URL", "http://localhost:4000").rstrip("/")
COOLDOWN_SECONDS = float(os.getenv("COOLDOWN_SECONDS", "5"))


def verify_token(token: str):
    """POST the scanned token to the backend. Returns (ok, message)."""
    try:
        r = requests.post(
            f"{API_URL}/api/pickup/scan",
            json={"qrToken": token},
            timeout=8,
        )
    except requests.RequestException as e:
        return False, f"network error: {e}"

    if r.status_code == 200:
        data = r.json()
        comp = (data.get("open") or {}).get("lockerNumber")
        return True, f"approved — opening door #{comp}"

    try:
        msg = r.json().get("error") or r.text
    except ValueError:
        msg = r.text
    return False, f"rejected ({r.status_code}): {msg[:120]}"


def main():
    print("CoffeePreorderQR scanner (Camera Module 3)")
    print(f"API : {API_URL}")

    picam2 = Picamera2()
    # Low-res preview stream is plenty for QR and keeps the Pi cool.
    config = picam2.create_preview_configuration(
        main={"format": "RGB888", "size": (1024, 768)}
    )
    picam2.configure(config)
    picam2.start()
    time.sleep(1)  # let auto-exposure settle

    last_token = None
    last_seen_at = 0.0
    print("Ready. Hold a phone QR up to the camera.\n")

    try:
        while True:
            frame = picam2.capture_array()  # numpy RGB array
            for code in decode(frame):
                token = code.data.decode("utf-8", "ignore").strip()
                if not token:
                    continue
                now = time.time()
                # Debounce: ignore the same QR for a few seconds.
                if token == last_token and (now - last_seen_at) < COOLDOWN_SECONDS:
                    continue
                last_token = token
                last_seen_at = now

                print(f"Scanned: {token[:14]}…")
                ok, msg = verify_token(token)
                print(("  ✓ " if ok else "  ✗ ") + msg + "\n")

            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\nBye.")
    finally:
        picam2.stop()


if __name__ == "__main__":
    main()
