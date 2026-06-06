"""
CoffeePreorderQR — QR scanner for the Raspberry Pi Camera Module 3.

Watches the Pi Camera for a QR code shown on a customer's phone and POSTs the
token to the backend's /api/pickup/scan. The backend verifies it, marks the
order PICKED_UP, and flags that compartment to open. The SEPARATE locker_hub.py
process (which owns the GPIO/relays and polls the backend) then pulses the
right solenoid.

So this script does NOT touch GPIO — run it ALONGSIDE locker_hub.py.

Camera Module 3 uses libcamera on Bookworm, so we use Picamera2. The Module 3
has AUTOFOCUS (enabled in continuous mode) — without it a phone held close is
blurry and the QR won't decode.

PREVIEW:
  Set PREVIEW=true in pi/.env to show a live, hardware-accelerated window
  (Picamera2's native QtGL preview — reliable on the Pi desktop, unlike
  OpenCV's imshow). Needs a desktop session. Leave off on a headless Pi.

Setup:
    sudo apt install -y python3-picamera2 libzbar0
    pip install pyzbar requests python-dotenv numpy
"""

import os
import time

import requests
from dotenv import load_dotenv
from pyzbar.pyzbar import decode
from picamera2 import Picamera2, Preview
from libcamera import controls

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

API_URL = os.getenv("API_URL", "http://localhost:4000").rstrip("/")
COOLDOWN_SECONDS = float(os.getenv("COOLDOWN_SECONDS", "5"))
PREVIEW = os.getenv("PREVIEW", "false").lower() == "true"


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

    # Native preview window. Use the software QT preview (not QTGL) — QTGL
    # rejects the RGB888 format we capture in. QT is slower but plenty for QR.
    if PREVIEW:
        try:
            picam2.start_preview(Preview.QT)
        except Exception as e:
            print(f"(preview unavailable: {e})")

    picam2.start()

    # Continuous autofocus — critical for close-up phone QR codes.
    try:
        picam2.set_controls({"AfMode": controls.AfModeEnum.Continuous})
    except Exception as e:
        print(f"(autofocus not set: {e})")

    time.sleep(1.5)  # let AF + auto-exposure settle

    last_token = None
    last_seen_at = 0.0
    frame_count = 0
    print("\nReady. Hold the app's QR ~15-25 cm from the camera.\n")

    try:
        while True:
            frame = picam2.capture_array()  # RGB numpy array
            codes = decode(frame)
            frame_count += 1

            if frame_count % 60 == 0 and not codes:
                print("…looking for a QR code (nothing in view yet)")

            for code in codes:
                token = code.data.decode("utf-8", "ignore").strip()
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

            time.sleep(0.03)
    except KeyboardInterrupt:
        print("\nBye.")
    finally:
        picam2.stop()


if __name__ == "__main__":
    main()
