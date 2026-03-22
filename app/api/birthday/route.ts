import { NextRequest, NextResponse } from "next/server";
import { addBirthdayEvent } from "@/lib/google-calendar";

// Simple in-memory rate limiter: max 10 submissions per IP per minute
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT;
}

function isValidDate(dateStr: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;

  const date = new Date(dateStr + "T00:00:00Z");
  return !isNaN(date.getTime());
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many submissions. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, birthday } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide your name." },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: "Name is too long (max 100 characters)." },
        { status: 400 }
      );
    }

    if (!birthday || typeof birthday !== "string" || !isValidDate(birthday)) {
      return NextResponse.json(
        { error: "Please provide a valid birthday date." },
        { status: 400 }
      );
    }

    const event = await addBirthdayEvent(name.trim(), birthday);

    return NextResponse.json({
      success: true,
      message: `Birthday saved for ${name.trim()}!`,
      eventId: event.id,
    });
  } catch (err) {
    console.error("Birthday API error:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
