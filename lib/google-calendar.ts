import { google, calendar_v3 } from "googleapis";

const BIRTHDAY_CALENDAR_NAME = "Birthdays";

function getAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(
      "Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN."
    );
  }

  const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
  oauth2.setCredentials({ refresh_token: refreshToken });
  return oauth2;
}

/**
 * Finds an existing "Birthdays" calendar or creates one.
 * Returns the calendar ID.
 */
async function getOrCreateBirthdayCalendar(
  cal: calendar_v3.Calendar
): Promise<string> {
  const list = await cal.calendarList.list();
  const existing = list.data.items?.find(
    (c) => c.summary === BIRTHDAY_CALENDAR_NAME
  );

  if (existing?.id) return existing.id;

  const created = await cal.calendars.insert({
    requestBody: {
      summary: BIRTHDAY_CALENDAR_NAME,
      description: "Birthdays collected via Birthday Collector",
      timeZone: "UTC",
    },
  });

  if (!created.data.id) throw new Error("Failed to create Birthdays calendar");
  return created.data.id;
}

/**
 * Adds a recurring annual all-day birthday event.
 *
 * @param name     - Person's full name
 * @param birthday - ISO date string "YYYY-MM-DD"
 */
export async function addBirthdayEvent(name: string, birthday: string) {
  const auth = getAuthClient();
  const cal = google.calendar({ version: "v3", auth });
  const calendarId = await getOrCreateBirthdayCalendar(cal);

  const event: calendar_v3.Schema$Event = {
    summary: `${name}'s Birthday`,
    description: `Birthday reminder for ${name} — added via Birthday Collector`,
    start: { date: birthday },
    end: { date: birthday },
    recurrence: ["RRULE:FREQ=YEARLY"],
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 1440 }, // 1 day before
      ],
    },
    transparency: "transparent", // won't block the calendar
  };

  const result = await cal.events.insert({
    calendarId,
    requestBody: event,
  });

  return result.data;
}
