# OnionGrade AI — Dark Mobile App Redesign + Accounts + Live Camera

Rebuild the app as a dark, neon-green mobile app (matching the reference screens), add email
login with real email verification, an in-app live camera with a permission explainer, and a
detailed farmer profile that flows into every quality report.

## 1. Visual direction (from the reference)

- Deep near-black / dark ink background, elevated dark cards, soft rounded 24-28px corners.
- Neon green gradient primary (used on the main CTA buttons and active nav icon), amber for URS,
  red-coral for Reject.
- Full-bleed photo headers with a dark gradient fade into the content, chips over the image.
- Bottom tab bar (Scan · Reports · Camera · Profile) with the active item in a green pill.
- Everything constrained to a phone-width column, generous 20px side padding, consistent
  spacing scale, single-line truncation on long text so nothing breaks on small screens.

## 2. Screens

- `/auth` — Welcome screen over a photo: email + password fields, show/hide password,
  "Remember me", "Forgot password?", green gradient LOGIN button, "Don't have an account? Sign up".
- `/verify-email` — "Check your inbox" screen after signup, with resend link.
- `/reset-password` — set a new password from the emailed recovery link.
- `/` (protected home) — greeting with farmer name, lot reference field, camera/upload actions,
  live analysis state.
- `/camera` — permission explainer card ("Allow camera access to scan your onion lot") →
  browser permission prompt → live viewfinder with framing guide and a capture shutter;
  graceful denied state with instructions and an Upload fallback.
- `/report/$id` — the quality report screen (Grade A / URS / Reject bars, bulb count, avg
  diameter, defect breakdown, inspector notes) with the farmer + lot details in the header
  and Print / Save / New scan actions.
- `/reports` — history list of past scans for the signed-in farmer.
- `/profile` — farmer template: name, phone, village, district, state, farm size, onion
  variety, harvest date, storage type. Saved profile auto-fills every new report.

## 3. Backend

Enable Lovable Cloud and add:

- Email/password auth with confirmation email required before sign-in (plus Google sign-in
  on the auth screen).
- `farmer_profiles` — one row per user with the fields above.
- `onion_reports` — every analysis stored with the grading percentages, counts, defects,
  notes and the lot reference, linked to the farmer.
- Row-level security so each farmer only ever sees their own profile and reports.

The existing AI grading function stays as-is; it just also persists the report and stamps it
with the farmer's profile.

## Technical notes

- Auth gate via `src/routes/_authenticated/route.tsx`; `/auth`, `/verify-email`,
  `/reset-password` stay public. Home moves under the gate; `/` becomes the signed-in home
  and unauthenticated visitors are redirected to `/auth`.
- Live camera uses `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })`
  in a client-only component, draws the frame to a canvas on capture, then reuses the existing
  compress → `analyzeOnionImage` path. Permission state is read from the Permissions API so the
  explainer only shows when access has not been granted.
- Tokens rewritten in `src/styles.css` (dark palette as the default `:root`); no hardcoded
  colour utilities in components.
- Report persistence and profile reads/writes go through `createServerFn` with
  `requireSupabaseAuth`; each report row insert happens in the analyze flow.
- Per-route `head()` metadata for each new screen.
