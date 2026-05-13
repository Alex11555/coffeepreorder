# Locker Pi — QR Scanner & Door Unlock

The Raspberry Pi 5 sits inside each locker. It watches a camera for the
customer's QR, asks the backend "is this token valid for THIS locker?",
and if so pulses a relay that energises a 12V solenoid for a few seconds
— door pops open.

One Pi per locker. The `LOCKER_NUMBER` in `.env` ties this Pi to a
`Locker.number` row in your Neon DB.

## Bill of materials

| Part | Notes | ~Price |
|------|-------|--------|
| Raspberry Pi 5 (2GB or 4GB) | runs the scanner | ~$60 |
| MicroSD 32GB + Pi OS Bookworm 64-bit | | ~$8 |
| Pi 5 USB-C power supply (27W official) | | ~$12 |
| USB webcam (any UVC, e.g. Logitech C270) **or** Pi Camera Module 3 | C270 is easiest | ~$25 |
| 5V single-channel relay module (e.g. SRD-05VDC-SL-C) | opto-isolated, "active low" | ~$3 |
| 12V DC solenoid lock (e.g. Adafruit 1512, "fail-secure") | this is what the door uses | ~$15 |
| 12V 2A wall adapter + barrel jack | powers the solenoid (NOT the Pi) | ~$10 |
| Female-to-female jumper wires (6) | Pi header → relay | ~$2 |
| Wago 221 or screw terminals | solenoid + PSU side | ~$3 |

> **Important:** Do **NOT** power the solenoid from the Pi's 5V rail. The
> solenoid pulls ~500 mA at 12V — way beyond what the Pi can supply. The
> relay's purpose is exactly to let the tiny Pi GPIO switch a separate
> 12V circuit.

## Wiring diagram

```
┌──────────────────┐                    ┌────────────────┐
│  Raspberry Pi 5  │                    │  5V Relay      │
│                  │                    │  Module        │
│  Pin  2 (5V)  ───┼────────────────────┤ VCC            │
│  Pin  6 (GND) ───┼────────────────────┤ GND            │
│  Pin 11 (GPIO17)─┼────────────────────┤ IN             │
│                  │                    │                │
│  USB ────── webcam                    │   ┌─ COM ──────┼──────┐
│                  │                    │   ├─ NO  ──────┼──┐   │
└──────────────────┘                    │   └─ NC (open) │  │   │
                                        └────────────────┘  │   │
                                                            │   │
                                          ┌─────────────────┘   │
                                          │   ┌─────────────────┘
                                          │   │
                              ┌───────────▼───▼────┐      ┌────────────┐
                              │  12V Solenoid Lock │      │ 12V DC PSU │
                              │       (+)──────────┼──────┤ (+) NO     │
                              │       (-)──────────┼──────┤ (-)        │
                              └────────────────────┘      └────────────┘
```

**Pin map (Pi 40-pin header, BCM numbering):**

| Pi pin | Signal      | Goes to       |
|-------:|-------------|---------------|
|  2     | 5V          | Relay `VCC`   |
|  6     | GND         | Relay `GND`   |
| 11     | GPIO17      | Relay `IN`    |

**Relay output side (switched 12V):**

- Relay `COM`  ← 12V PSU **(+)**
- Relay `NO`   → Solenoid **(+)**
- Solenoid **(-)** → 12V PSU **(-)**

So when GPIO17 fires, COM↔NO closes and 12V flows through the solenoid →
plunger retracts → door pops open. When the GPIO drops, the spring inside
the solenoid pushes it back and the door re-locks.

> A flyback diode (1N4007) across the solenoid terminals is recommended
> to protect the relay contacts from the inductive kick when the coil
> de-energises. Some solenoids already have one built in — check yours.

## Software setup

### 1. Flash & boot the Pi

1. Use **Raspberry Pi Imager** → Raspberry Pi OS (64-bit, Bookworm).
2. Pre-config Wi-Fi and SSH in the Imager (gear icon).
3. Boot, SSH in:
   ```bash
   ssh pi@<raspberrypi.local-or-ip>
   ```

### 2. Clone the repo and install deps

```bash
sudo apt update
sudo apt install -y git
git clone https://github.com/Alex11555/coffeepreorder.git ~/CoffeePreorderQR
cd ~/CoffeePreorderQR/pi
chmod +x install.sh
./install.sh
```

`install.sh` apt-installs `libzbar0` (the QR decoder native lib), creates
a Python venv, and `pip install`s `opencv`, `pyzbar`, `requests`,
`gpiozero` + `lgpio` (the Pi-5-compatible GPIO backend).

### 3. Configure

```bash
cp .env.example .env
nano .env
```

Set at minimum:
- `API_URL` → your Render URL, e.g. `https://coffeepreorderqr-api.onrender.com`
- `LOCKER_NUMBER` → which locker this Pi controls (1, 2, 3…)

### 4. Test manually

```bash
source .venv/bin/activate
python scanner.py
```

You should see:
```
CoffeePreorderQR scanner — locker #1
API : https://coffeepreorderqr-api.onrender.com
GPIO: pin 17  (active_high=False)
Ready. Hold a phone QR up to the camera.
```

Place a test order from the mobile app, mark it **READY** from the
dashboard, then hold the phone's QR up to the webcam. You should hear
the relay click and see `>>> UNLOCK` in the logs.

### 5. Run on boot (systemd)

```bash
sudo cp systemd/qrlocker.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now qrlocker
sudo systemctl status qrlocker
```

Live logs:
```bash
journalctl -u qrlocker -f
```

## Using the Pi Camera Module instead of a USB webcam

Bookworm uses `libcamera` for the official Pi Camera. The simplest path
is to enable the `libcamerify` shim:

```bash
sudo apt install -y libcamera-tools
# then start the scanner under libcamerify, which presents the camera as /dev/video0
libcamerify python scanner.py
```

Or modify the systemd service `ExecStart` to:
```
ExecStart=/usr/bin/libcamerify /home/pi/CoffeePreorderQR/pi/.venv/bin/python /home/pi/CoffeePreorderQR/pi/scanner.py
```

## Troubleshooting

**Relay clicks ON at boot, door is permanently unlocked**
Your relay is active-low. Edit `.env` and set `RELAY_ACTIVE_HIGH=false`
(this is already the default). If it's STILL on, your relay is active-high
— set `RELAY_ACTIVE_HIGH=true`.

**`ERROR: could not open camera at index 0`**
- For USB webcam: `ls /dev/video*` — note the number, set `CAMERA_INDEX`.
- For Pi Camera: run via `libcamerify` (see above).
- Check the user has access: `sudo usermod -aG video pi`, then re-login.

**`pyzbar.zbar_library.ZBarLibraryNotFound`**
`sudo apt install libzbar0`

**GPIO permission denied**
On Bookworm the user needs to be in the `gpio` group:
`sudo usermod -aG gpio pi`, then re-login. systemd runs as `pi` and
`gpiozero` uses `lgpio` which works without root on Pi 5.

**Scanner says "wrong locker"**
The QR's order was assigned to a different locker number. Either the
customer is at the wrong locker, or `LOCKER_NUMBER` in `.env` is wrong.

**Solenoid buzzes / Pi reboots when relay fires**
Inductive kickback. Add a 1N4007 diode across the solenoid (cathode/band
to +12V side). Also confirm the 12V PSU isn't sharing GND back through
the Pi.
