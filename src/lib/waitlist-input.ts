const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type WaitlistFields = {
  email: string;
  name: string | null;
  org: string | null;
  interests: string[] | null;
  message: string | null;
};

export type WaitlistInputResult =
  | { ok: true; value: WaitlistFields }
  | { ok: false; error: string };

function clip(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function normalizeWaitlistInput(input: {
  email: string;
  name: string;
  org: string;
  interests: string[];
  message: string;
}): WaitlistInputResult {
  const email = input.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 320) {
    return { ok: false, error: "That doesn't look like a valid email." };
  }

  const interests = input.interests
    .filter((item): item is string => typeof item === "string")
    .map((item) => clip(item, 80))
    .filter(Boolean)
    .slice(0, 12);

  const name = clip(input.name, 120);
  const org = clip(input.org, 160);
  const message = clip(input.message, 2000);

  return {
    ok: true,
    value: {
      email,
      name: name || null,
      org: org || null,
      interests: interests.length > 0 ? interests : null,
      message: message || null,
    },
  };
}
