import twilio from "twilio";

// Turns "780-753-4499", "(780) 753 4499", or "17807534499" into "+17807534499".
// Returns null if it doesn't look like a valid North American number.
export function normalizePhone(input: string | null | undefined): string | null {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export type SmsResult = { ok: true } | { ok: false; error: string };

// Sends one text through Twilio. Never throws: returns ok/error so callers
// can tell the difference between "sent" and "failed".
export async function sendSms(
  to: string | null | undefined,
  body: string
): Promise<SmsResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { ok: false, error: "Twilio is not configured on the server." };
  }

  const phone = normalizePhone(to);
  if (!phone) {
    return { ok: false, error: "missing or invalid phone number" };
  }

  try {
    const client = twilio(accountSid, authToken);
    await client.messages.create({ to: phone, from: fromNumber, body });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown Twilio error",
    };
  }
}
