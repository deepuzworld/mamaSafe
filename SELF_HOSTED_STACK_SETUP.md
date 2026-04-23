# Self-Hosted Pulse Activation Stack (SIMULATION MODE)

This document provides instructions for setting up the self-hosted emergency notification stack for MamaSafe in **Simulation Mode**. This allows you to test the Kannel and FreeSWITCH architecture without needing a physical GSM Modem.

## 1. Simulation Architecture
* **Kannel (SMS)**: Configured with `fakesmsc`. Instead of sending real SMS, it writes all outgoing messages to a log file.
* **FreeSWITCH (Voice)**: Configured for ESL (Event Socket Library). It will process call commands and log them, but will not dial out to the real PSTN.

## 2. Docker Deployment
Start the stack via Docker:
```bash
docker-compose up -d
```
No physical USB devices are required for this mode.

### Step 2: Start Services
```bash
docker-compose up -d mamasafe_kannel mamasafe_freeswitch
```

## 3. Configuration Details

### Kannel (SMS)
Configuration file: `docker/kannel/kannel.conf`
* **SMSC Group**: Defines the AT command parameters for your modem.
* **SendSMS User**: Credentials used by the backend to authenticate.

### FreeSWITCH (Voice)
* **ESL (Event Socket Layer)**: Enables the backend to control calls.
* **Gateway**: You must define an endpoint in FreeSWITCH that uses the GSM modem (e.g., via `mod_gsmopen` or a SIP-to-GSM bridge).

## 4. Backend Environment Variables
Update your `backend/.env` to point to the local containers:
```env
KANNEL_HOST=http://localhost:13013
KANNEL_USER=kannel_user
KANNEL_PASS=kannel_password

FS_HOST=127.0.0.1
FS_PORT=8021
FS_PASS=ClueCon
```

## 5. Testing the Stack
1. Ensure the modem LED is blinking (means it's registered on the network).
2. Log in as a 'Mother'.
3. Click **Activate Pulse** on the dashboard.
4. Check Kannel logs: `docker logs mamasafe_kannel`.
5. Check FreeSWITCH logs: `docker logs mamasafe_freeswitch`.

---
*Note: Ensure your Docker user has permissions to access `/dev/ttyUSB*` devices. You might need to run `sudo usermod -aG dialout $USER`.*
