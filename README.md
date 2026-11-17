# WatchDog-Chakravyuh

WatchDog is a local email breach-awareness application. It checks an email address against the Have I Been Pwned (HIBP) breach API when an API key is configured, then displays a simple rule-based indicator and recommendations.

The app does not search account-registration endpoints, does not collect passwords, and does not store scan results. Only check an email address you own or have permission to check.

## Requirements

- Node.js 18 or later
- A Have I Been Pwned API key to perform live breach checks. Without a key, the app still runs but clearly reports that breach data was not checked.

## Run on Windows

Open PowerShell in the project directory.

1. Install backend dependencies:

   ```powershell
   cd backend
   npm install
   ```

2. Configure the optional breach-data API key:

   ```powershell
   Copy-Item .env.example .env
   ```

   Edit `backend\.env` and set `HIBP_API_KEY` to your own key. Do not put the key in frontend code or commit `.env`.

3. Start the backend and leave this window open:

   ```powershell
   npm start
   ```

   It should say that it is listening at `http://localhost:5000`.

4. In a second PowerShell window, start the frontend:

   ```powershell
   cd "C:\Users\HP\Downloads\WatchDog_Chakravyuh-main\WatchDog_Chakravyuh-main\frontend"
   py -m http.server 8000
   ```

5. Open `http://localhost:8000` in your browser. Enter an email you own or are authorized to check, tick the consent box, and submit.

6. To verify the backend independently, visit `http://localhost:5000/api/health`. The response reports whether a HIBP key is configured.

The Python/Holehe service is not required. This app intentionally does not perform account-registration enumeration. Its breach results come only from the configured HIBP API; an unconfigured or unavailable provider is shown as unknown, not as “no breaches.”

## Notes

- The score is a basic indicator based on returned breach records, not a complete security assessment.
- HIBP may impose access, subscription, or rate limits. If a lookup fails, check the backend terminal and your API-key setup.
- Scan requests are not logged with the email address, and results are not persisted by this application.
