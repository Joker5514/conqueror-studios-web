// Canonical waitlist constants shared by the client form and the server action.
// Kept out of the "use server" action file so non-async values can be exported
// and imported by client components.

export const WAITLIST_INTERESTS = [
  "AI Bridge",
  "OrchestrAI Nexus",
  "VoiceIsolate Pro",
  "AI Counselor",
  "Love-Me-Not",
  "Other",
] as const;

export type WaitlistInterest = (typeof WAITLIST_INTERESTS)[number];

// Upper bounds for stored free-text fields. Submissions are sliced to these
// lengths server-side so a single request can't bloat the database.
export const WAITLIST_MAX_LENGTHS = {
  email: 254,
  name: 120,
  org: 200,
  message: 4000,
} as const;
