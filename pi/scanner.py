"""
CoffeePreorderQR — QR scanner for the Raspberry Pi Camera Module 3.

Watches the Pi Camera for a QR code shown on a customer's phone and POSTs the
token to the backend's /api/pickup/scan. The backend verifies it, marks the
order PICKED_UP, and flags that compartment to open. The SEPARATE locker_hub.py
process (which owns the GPIO/relays and polls the backend) then pulses the
right solenoid.

So this script does NOT touch GPIO — run it ALONGSIDE locker_hub.py.

Camera Module 3 uses libcamera on Bookworm, so we use Picamera2. The Module 3
has AUTOFOCUS, which we enable in continuous mode — otherwise a phone held
close looks blurry and the QR won't decode.

WHAT TO SCAN:
  The QR shown in the customer app after checkout (the QR-code / order-detail
  screen). The order must be READY for the door to open — but the scanner will
  still decode & report any QR, so you'll always see feedback in the terminal.

PREVIEW:
  Set PREVIEW=true in pi/.env (or env) to open a live window with a green box
  around any detected QR. Needs a desktop session (you have one). On a headless
  Pi, leave it off.

Setup:
    sudo apt install -y python3-picamera2 libzbar0
    pip install pyzbar requests python-dotenv numpy opencv-python
"""

import os
import time

import numpy as np
import requests
from dotenv import load_dotenv
from pyzbar.pyzbar import decode
from picamera2 import Picamera2
from libcamera import controls

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

API_URL = os.getenv("API_URL", "http://localhost:4000").rstrip("/")
COOLDOWN_SECONDS = float(os.getenv("COOLDOWN_SECONDS", "5"))
PREVIEW = os.getenv("PREVIEW", "false").lower() == "true"

# OpenCV only needed for the preview window.
cv2 = None
if PREVIEW:
    try:
        import cv2  # noqa
    except ImportError:
        print("PREVIEW requested but opencv not installed — run: pip install opencv-python")
        PREVIEW = False


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
    print(f"API     : {API_URL}")
    print(f"PREVIEW : {PREVIEW}")

    picam2 = Picamera2()
    config = picam2.create_preview_configuration(
        main={"format": "RGB888", "size": (1280, 720)}
    )
    picam2.configure(config)
    picam2.start()

    # Enable continuous autofocus (Module 3). Without this, close-up QR is blurry.
    try:
        picam2.set_controls({"AfMode": controls.AfModeEnum.Continuous})
    except Exception as e:
        print(f"(autofocus not set: {e})")

    time.sleep(1.5)  # let AF + auto-exposure settle

    last_token = None
    last_seen_at = 0.0
    frame_count = 0
    print("\nReady. Hold the app's QR code ~15-25 cm from the camera.\n")

    try:
        while True:
            frame = picam2.capture_array()  # RGB numpy array
            codes = decode(frame)
            frame_count += 1

            # Heartbeat so you know it's alive even when nothing is detected.
            if frame_count % 60 == 0 and not codes:
                print("…looking for a QR code (nothing in view yet)")

            for code in codes:
                token = code.data.decode("utf-8", "ignore").strip()
                if PREVIEW:
                    (x, y, w, h) = code.rect
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 3)
                if not token:
                    continue
                now = time.time()
                if token == last_token and (now - last_seen_at) < COOLDOWN_SECONDS:
                    continue
                last_token = token
                last_seen_at = now

                print(f"Scanned: {token[:14]}…")
                ok, msg = verify_token(token)
                print(("  ✓ " if ok else "  ✗ ") + msg + "\n")

            if PREVIEW:
                # Picamera2 gives RGB; OpenCV shows BGR.
                cv2.imshow("CoffeePreorderQR scanner — press q to quit",
                           cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
            else:
                time.sleep(0.05)
    except KeyboardInterrupt:
        print("\nBye.")
    finally:
        picam2.stop()
        if PREVIEW:
            cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
