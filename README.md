# Birthday Collector

A beautiful, shareable website where friends and family can enter their birthday, which automatically adds a recurring annual reminder to your Google Calendar.

Share the link on WhatsApp, and never miss a birthday again.

---

## Quick Start (Local Development)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> The form will load immediately, but submitting a birthday requires Google Calendar credentials (see below).

---

## Google Calendar Setup (One-Time)

### Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Name it anything (e.g. "Birthday Collector") → **Create**
4. Make sure the new project is selected in the dropdown

### Step 2 — Enable the Calendar API

1. In the left sidebar, go to **APIs & Services → Library**
2. Search for **Google Calendar API**
3. Click it → **Enable**

### Step 3 — Create OAuth Credentials

1. Go to **APIs & Services → Credentials**
2. Click **+ CREATE CREDENTIALS → OAuth client ID**
3. If prompted, configure the **OAuth consent screen** first:
   - Choose **External** (or Internal if using Google Workspace)
   - Fill in the app name (e.g. "Birthday Collector") and your email
   - Add scope: `https://www.googleapis.com/auth/calendar`
   - Add yourself as a **test user**
   - Save
4. Now create the OAuth client:
   - Application type: **Web application**
   - Name: anything (e.g. "Birthday Collector")
   - No redirect URIs needed for now
   - Click **Create**
5. Copy the **Client ID** and **Client Secret**

### Step 4 — Get Your Refresh Token

1. Create a `.env.local` file from the template:

   ```bash
   cp .env.example .env.local
   ```

2. Paste your Client ID and Client Secret into `.env.local`:

   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   GOOGLE_REFRESH_TOKEN=
   ```

3. Run the token helper script:

   ```bash
   npm run get-token
   ```

4. It will print a URL — open it in your browser, sign in with the Google account that owns the calendar, and grant access.

5. Copy the authorization code, paste it back into the terminal.

6. The script prints your `GOOGLE_REFRESH_TOKEN` — paste it into `.env.local`.

Your `.env.local` should now look like:

```
GOOGLE_CLIENT_ID=1234...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_REFRESH_TOKEN=1//0e...
```

### Step 5 — Test Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), submit a test birthday, and check your Google Calendar — you should see a new "Birthdays" calendar with the event.

---

## Deploy to Vercel (Free)

1. Push this project to a GitHub repository

2. Go to [vercel.com](https://vercel.com), sign in with GitHub

3. Click **Import Project** → select your repo

4. In **Environment Variables**, add:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REFRESH_TOKEN`

5. Click **Deploy**

6. Once deployed, you'll get a URL like `https://birthday-collector.vercel.app` — share this on WhatsApp!

---

## How It Works

1. Your friend opens the shared link
2. They enter their name and birthday
3. The server-side API adds a recurring annual all-day event to your Google Calendar under a "Birthdays" calendar
4. The event includes a reminder 1 day before

Your Google credentials are never exposed to visitors — they're stored securely as server-side environment variables.

---

## Project Structure

```
birthday-collector/
  app/
    layout.tsx            Root layout (fonts, metadata)
    page.tsx              Birthday form (confetti on success)
    globals.css           Tailwind styles
    api/birthday/
      route.ts            POST endpoint → Google Calendar
  lib/
    google-calendar.ts    Auth + calendar helpers
  scripts/
    get-token.mjs         One-time OAuth token helper
```
