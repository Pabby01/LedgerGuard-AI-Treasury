# Minimal Dockerfile to run Speculos and the Solana Ledger app for CI tests
# This is an example; adapt versions as needed.
FROM python:3.11-slim

RUN apt-get update && apt-get install -y git build-essential libusb-1.0-0-dev pkg-config && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/speculos
RUN git clone https://github.com/LedgerHQ/speculos.git .
RUN pip install -r requirements.txt

# Expose u2f/hid endpoints as needed (CI runners may require privileged mode)

CMD ["python3", "speculos.py", "--log", "speculos.log"]
