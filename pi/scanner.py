"""
CoffeePreorderQR — Raspberry Pi 5 locker scanner.

Continuously watches the camera for a QR code, posts the scanned token
to the backend's /api/pickup/scan endpoint, and pulses a relay (driving
a 12V solenoid lock) for a few seconds when the server approves.

One Pi == one locker. Configure which locker this Pi represents via
LOCKER_NUMBER in pi/.env.

Hardware (see pi/README.md for the wiring diagram):
  - Raspberry Pi 5
  - USB webcam or Pi Camera Module (libcamera-bridged to /dev/video0)
  - 5V single-channel relay module
      VCC -> Pi 5V (pin 2)
      GND -> Pi GND (pin 6)
      IN  -> Pi GPIO17 (pin 11)
  - 12V solenoid lock + 12V DC power supply
      Relay COM -> 12V PSU (+)
      Relay NO  -> Solenoid (+)
      Solenoid (-) -> 12V PSU (-)
"""

import os
import sys
import time

import cv2
import requests
from dotenv import load_dotenv
from gpiozero import OutputDevice
from pyzbar.pyzbar import decode

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:4000").rstrip("/")
LOCKER_NUMBER = int(os.getenv("LOCKER_NUMBER", "1"))
RELAY_PIN = int(os.getenv("RELAY_PIN", "17"))
# Most cheap blue relay modules are ACTIVE LOW (driven LOW to switch on).
# If yours clicks at startup instead of staying off, flip this to False.
RELAY_ACTIVE_HIGH = os.getenv("RELAY_ACTIVE_HIGH", "false").lower() == "true"
PULSE_SECONDS = float(os.getenv("PULSE_SECONDS", "3"))
COOLDOWN_SECONDS = float(os.getenv("COOLDOWN_SECONDS", "5"))
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))

# initial_value=False -> relay starts de-energised (solenoid locked)
relay = OutputDevice(
    RELAY_PIN,
    active_high=RELAY_ACTIVE_HIGH,
    initial_value=False,
)


def unlock_door():
    """Energise the relay for PULSE_SECONDS, then drop it."""
    print(f"[locker {LOCKER_NUMBER}] >>> UNLOCK ({PULSE_SECONDS}s)")
    relay.on()
    try:
        time.sleep(PULSE_SECONDS)
    finally:
        relay.off()
    print(f"[locker {LOCKER_NUMBER}] <<< re-locked")


def verify_token(token: str) -> bool:
    """POST the scanned token to the backend. Return True iff this locker
    should open. The server flips the order to PICKED_UP as part of this
    call, so we only call it when we're actually going to unlock."""
    try:
        r = requests.post(
            f"{API_URL}/api/pickup/scan",
            json={"qrToken": token},
            timeout=8,
        )
    except requests.RequestException as e:
        print(f"  network error: {e}")
        return False

    if r.status_code != 200:
        try:
            msg = r.json().get("error") or r.text
        except ValueError:
            msg = r.text
        print(f"  rejected ({r.status_code}): {msg[:140]}")
        return False

    data = r.json()
    open_for = (data.get("open") or {}).get("lockerNumber")
    if open_for != LOCKER_NUMBER:
        # Server approved the QR but it's not for THIS locker. Don't open.
        print(f"  wrong locker: order is for locker #{open_for}")
        return False
    return True


def main():
    print(f"CoffeePreorderQR scanner — locker #{LOCKER_NUMBER}")
    print(f"API : {API_URL}")
    print(f"GPIO: pin {RELAY_PIN}  (active_high={RELAY_ACTIVE_HIGH})")

    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print(f"ERROR: could not open camera at index {CAMERA_INDEX}")
        sys.exit(1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    last_token = None
    last_seen_at = 0.0
    print("Ready. Hold a phone QR up to the camera.")

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                time.sleep(0.1)
                continue

            for code in decode(frame):
                token = code.data.decode("utf-8", "ignore").strip()
                if not token:
                    continue
                now = time.time()
                if token == last_token and (now - last_seen_at) < COOLDOWN_SECONDS:
                    continue
                last_token = token
                last_seen_at = now

                print(f"Scanned: {token[:14]}…")
                if verify_token(token):
                    print("  ✓ approved")
                    unlock_door()
                else:
                    print("  ✗ denied")

            time.sleep(0.05)
    except KeyboardInterrupt:
        print("\nBye.")
    finally:
        cap.release()
        relay.off()


if __name__ == "__main__":
    main()
