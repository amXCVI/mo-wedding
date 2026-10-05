const MAX_NAMES_LENGTH = 300;
const MAX_GUEST_COUNT = 50;
const MIN_FORM_TIME_MS = 1_500;

function send(response, status, payload) {
  response.status(status).json(payload);
}

function normalizeBody(body) {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return null;
    }
  }

  return body;
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return send(response, 405, { ok: false, error: "Method not allowed" });
  }

  const body = normalizeBody(request.body);
  if (!body) return send(response, 400, { ok: false, error: "Invalid JSON" });

  const names = typeof body.names === "string" ? body.names.trim() : "";
  const guestCount = Number(body.guestCount);
  const attendance = body.attendance;
  const startedAt = Number(body.startedAt);
  const elapsed = Date.now() - startedAt;

  if (body.website) return send(response, 200, { ok: true });
  if (!names || names.length > MAX_NAMES_LENGTH) {
    return send(response, 422, { ok: false, error: "Invalid names" });
  }
  if (
    !Number.isInteger(guestCount) ||
    guestCount < 1 ||
    guestCount > MAX_GUEST_COUNT
  ) {
    return send(response, 422, { ok: false, error: "Invalid guest count" });
  }
  if (!["yes", "no"].includes(attendance)) {
    return send(response, 422, {
      ok: false,
      error: "Invalid attendance value",
    });
  }
  if (
    !Number.isFinite(startedAt) ||
    elapsed < MIN_FORM_TIME_MS ||
    elapsed > 86_400_000
  ) {
    return send(response, 422, { ok: false, error: "Invalid form timing" });
  }

  const formActionUrl = process.env.GOOGLE_FORM_ACTION_URL;
  const namesField = process.env.GOOGLE_FORM_NAMES_FIELD;
  const guestCountField = process.env.GOOGLE_FORM_GUEST_COUNT_FIELD;
  const attendanceField = process.env.GOOGLE_FORM_ATTENDANCE_FIELD;

  if (!formActionUrl || !namesField || !guestCountField || !attendanceField) {
    console.error("Google Form integration is not configured");
    return send(response, 503, {
      ok: false,
      error: "RSVP service is not configured",
    });
  }

  try {
    const formBody = new URLSearchParams({
      [namesField]: names,
      [guestCountField]: String(guestCount),
      [attendanceField]: attendance === "yes" ? "Да, буду" : "К сожалению, не смогу",
    });

    const formResponse = await fetch(formActionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: formBody,
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });

    if (!formResponse.ok) {
      throw new Error(`Google Form responded with ${formResponse.status}`);
    }

    return send(response, 200, { ok: true });
  } catch (error) {
    console.error("Google Form submission error", error);
    return send(response, 502, { ok: false, error: "Could not save RSVP" });
  }
}
