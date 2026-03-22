/**
 * One-time script to obtain a Google OAuth2 refresh token.
 *
 * Usage:
 *   1. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in .env.local
 *   2. Add http://localhost:3001/callback as an Authorized Redirect URI
 *      in your Google Cloud OAuth client settings
 *   3. Run:  npm run get-token
 *   4. Your browser will open automatically — sign in and grant access
 *   5. The script prints your GOOGLE_REFRESH_TOKEN
 */

import http from "http";
import { google } from "googleapis";
import { config } from "dotenv";
import { exec } from "child_process";

config({ path: ".env.local" });

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const PORT = 3001;
const REDIRECT_URI = `http://localhost:${PORT}/callback`;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error(
    "\n  ERROR: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set.\n" +
      "  Add them to .env.local before running this script.\n"
  );
  process.exit(1);
}

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const authUrl = oauth2.generateAuthUrl({
  access_type: "offline",
  prompt: "consent",
  scope: ["https://www.googleapis.com/auth/calendar"],
});

const server = http.createServer(async (req, res) => {
  if (!req.url?.startsWith("/callback")) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<h1>Access denied</h1><p>You can close this tab.</p>");
    console.error(`\n  ERROR: Google returned: ${error}\n`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.writeHead(400, { "Content-Type": "text/html" });
    res.end("<h1>Missing code</h1>");
    return;
  }

  try {
    const { tokens } = await oauth2.getToken(code);

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(
      "<html><body style='font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff7ed'>" +
        "<div style='text-align:center'><h1 style='font-size:3rem'>&#127882;</h1>" +
        "<h2>Success!</h2><p>Your refresh token has been printed in the terminal.<br>You can close this tab.</p></div>" +
        "</body></html>"
    );

    if (!tokens.refresh_token) {
      console.error(
        "\n  WARNING: No refresh token received.\n" +
          "  Go to https://myaccount.google.com/permissions,\n" +
          "  remove this app, then run the script again.\n"
      );
    } else {
      console.log("\n──────────────────────────────────────────────");
      console.log("  SUCCESS! Here is your refresh token:\n");
      console.log(`  GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log("\n  Add this to your .env.local file and to");
      console.log("  your Vercel environment variables.");
      console.log("──────────────────────────────────────────────\n");
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/html" });
    res.end("<h1>Error</h1><p>Check the terminal for details.</p>");
    console.error("\n  ERROR: Failed to exchange code for token.");
    console.error(" ", err.message || err);
  }

  server.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log("\n──────────────────────────────────────────────");
  console.log("  Opening your browser for Google sign-in...");
  console.log("  (If it doesn't open, copy this URL manually)\n");
  console.log(`  ${authUrl}`);
  console.log("\n──────────────────────────────────────────────\n");

  // Open browser automatically (Windows / macOS / Linux)
  const platform = process.platform;
  const cmd =
    platform === "win32" ? `start "" "${authUrl}"` :
    platform === "darwin" ? `open "${authUrl}"` :
    `xdg-open "${authUrl}"`;

  exec(cmd, (err) => {
    if (err) console.log("  Could not open browser automatically. Please open the URL above manually.\n");
  });
});
