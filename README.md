# GetMade — Phase 1 Foundation

The production web application foundation for GetMade, an AI receptionist SaaS
for small businesses. This phase builds the real Next.js architecture,
onboarding flow, and dashboard — **not** live phone calls, voice, or calendar
sync. Those are Phase 2.

---

## 1. What was built

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · hand-built
shadcn-style components on Radix primitives · Supabase (auth-ready) ·
Vercel-compatible.

```
getmade/
├── app/
│   ├── page.tsx                    Marketing landing page
│   ├── (auth)/                     /login  /signup  /forgot-password
│   ├── onboarding/                 7-step wizard (business → hours →
│   │                                services → AI → voice → calendar → go live)
│   ├── dashboard/                  /dashboard + /calls /appointments
│   │                                /customers /ai-employee /knowledge
│   │                                /integrations /settings
│   └── actions/auth.ts             Server actions: signUp, signIn, signOut,
│                                    resetPassword (real Supabase calls)
├── components/
│   ├── ui/                         Button, Card, Input, Select, Tabs, Dialog,
│   │                                Switch, Table, Badge, Avatar, etc.
│   ├── layout/                     Sidebar + responsive dashboard shell
│   ├── dashboard/                  Stat cards, status badges, empty states,
│   │                                AI Employee / Knowledge / Settings panels
│   ├── onboarding/                 Stepper nav + step shell
│   └── voice/                      Voice picker card
├── lib/
│   ├── database/
│   │   ├── schema.sql               Full Supabase schema + Row Level Security
│   │   └── types.ts                 TypeScript types mirroring the schema
│   ├── supabase/                    Browser client, server client, middleware
│   ├── ai/generateInstructions.ts   Turns toggle-based config into a real
│   │                                 AI system prompt (no model call yet)
│   ├── integrations/
│   │   ├── calendar/                Google/Outlook interface (stubbed)
│   │   ├── twilio/                  Phone provisioning interface (stubbed)
│   │   ├── voice/                   Internal voice_id catalog (stubbed)
│   │   └── sms/                     SMS interface (stubbed)
│   ├── mock/data.ts                 ⚠️ Demo data for "Riverside Auto & Tire"
│   └── data/*.ts                    Data-access functions — mock-backed today,
│                                      shaped exactly like the Supabase queries
│                                      that will replace them
├── middleware.ts                    Refreshes the Supabase session every request
└── tailwind.config.ts                Design tokens (see "Design" below)
```

**Verified:** `npx next build` compiles with zero TypeScript errors across all
23 routes, and every route returns HTTP 200 (404 on unknown paths) when
smoke-tested against a production server.

---

## 2. Install & run locally

Requires Node.js 18+.

```bash
cd getmade
npm install
cp .env.local.example .env.local
npm run dev
```

Open **http://localhost:3000**. The app is fully browsable with **zero
configuration** — the dashboard reads from the mock data layer
(`lib/mock/data.ts`, business: "Riverside Auto & Tire"), and auth pages show a
clear "Supabase isn't connected" message instead of crashing.

```bash
npm run build   # production build (TypeScript + lint checked)
npm start        # run the production build
```

---

## 3. API keys / environment variables

| Variable | Required to run the app? | What it enables |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Real accounts + real per-business data |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Reserved for server-side admin operations in Phase 2 |
| `NEXT_PUBLIC_SITE_URL` | No | Correct redirect links in password-reset emails |

Nothing else is required for this phase. Twilio, calendar OAuth, and voice
provider keys are listed (commented out) in `.env.local.example` for Phase 2 —
no code reads them yet.

**This is now wired for real, not just scaffolded.** As soon as the two
Supabase variables above are set:
- `/login`, `/signup`, and `/forgot-password` create and authenticate real users
- `/dashboard` and `/onboarding` require a logged-in session and redirect
  to `/login` if there isn't one
- Finishing onboarding (`app/actions/onboarding.ts`) actually inserts the
  business, hours, services, AI receptionist config, and voice config into
  Supabase, and makes the current user its owner
- If a logged-in user has no business yet, `/dashboard` redirects them back
  into `/onboarding` automatically
- Every dashboard page (`lib/data/*.ts`) queries Supabase directly, scoped to
  that user's business via Row Level Security — a brand-new business
  correctly sees an empty dashboard, not the demo data

**With no Supabase env vars set, none of the above applies** — every page
falls back to the mock data layer (`lib/mock/data.ts`) so the whole app stays
browsable standalone.

**To connect Supabase for real:**
1. Create a project at supabase.com
2. Run `lib/database/schema.sql` in the SQL editor (creates all tables + RLS)
3. Copy the project URL and anon key into `.env.local` (and into your
   hosting provider's environment variables if deployed)
4. Sign up through `/signup` — you'll land in onboarding, and finishing it
   creates a real business you can see in Supabase's table editor

Note: the Supabase client isn't parameterized with strict generated types yet
(see the comment in `lib/supabase/client.ts`) — queries type-check loosely
against our hand-written schema types. Once a project exists, run
`supabase gen types typescript` and swap the output in for full end-to-end
type safety on every query.

---

## 4. Design

Palette and type system live in `tailwind.config.ts` / `app/globals.css`:
navy ink (`#12161D`) + warm brass accent (`#AD7A2E`) on a porcelain
background, serif display headings paired with a grotesk sans body and a
monospace face for data (phone numbers, timestamps, prices). Font stacks are
plain CSS (no `next/font/google`) so the build doesn't require network access
to Google Fonts — swap in real webfonts (e.g. Fraunces + Inter) whenever
convenient.

---

## 5. What remains for Phase 2

Auth, onboarding persistence, and real per-business dashboard data are done
(see section 3). What's left, in order of what unlocks the most:

1. **Twilio** — implement `lib/integrations/twilio/index.ts`'s
   `provisionNumber()` for real, and add an inbound webhook route
   (`app/api/webhooks/twilio/voice/route.ts`) that receives call events.
2. **Voice provider** — implement `resolveProviderVoice()` in
   `lib/integrations/voice/index.ts` to map an internal `voice_id` (e.g.
   `alex_professional`) to a real ElevenLabs/PlayHT voice reference.
3. **Google Calendar / Outlook OAuth** — implement `connect()` in
   `lib/integrations/calendar/index.ts` for real; the Integrations page and
   onboarding Calendar step already call this interface.
4. **AI reasoning** — connect `lib/ai/generateInstructions.ts`'s output
   (already generated and saved to `ai_receptionists.generated_instructions`
   during onboarding) to an actual Claude call with tool use
   (`check_availability`, `book_appointment`, `create_human_request`) — the
   Phase 1 prototype's `aiEngine.js` is a working reference implementation
   of this loop.
5. **Write-path persistence for in-dashboard edits** — AI Employee, Knowledge,
   and Settings pages currently hold edits in local React state (they show
   "Saved ✓" but don't call Supabase). Each needs a server action mirroring
   `completeOnboardingAction`.
6. **Generated types** — replace the hand-written `Database` type with
   `supabase gen types typescript` output for full query type safety.
7. **Multi-business support in the UI** — the schema already supports a user
   belonging to multiple businesses via `business_members`; the dashboard
   currently assumes a single business per session and would need a
   business-switcher.

None of this requires touching `components/ui/`, the dashboard layout, or the
onboarding step components — that separation is why the mock and integration
layers are isolated the way they are.
