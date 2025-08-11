
#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../backend"
python3 -m venv .venv || true
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
