#!/usr/bin/env bash
# Run once on a fresh Pi 5 (Raspberry Pi OS Bookworm 64-bit).
set -e

echo "==> apt deps"
sudo apt update
sudo apt install -y \
  python3-venv python3-pip \
  libzbar0 \
  libatlas-base-dev \
  v4l-utils

echo "==> python venv"
cd "$(dirname "$0")"
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

echo
echo "Done. Next:"
echo "  1. cp .env.example .env  &&  edit .env"
echo "  2. source .venv/bin/activate && python scanner.py"
echo "  3. (optional) sudo cp systemd/qrlocker.service /etc/systemd/system/"
echo "                sudo systemctl enable --now qrlocker"
