# AGENTS.md — HomeSafe

## Project Overview

HomeSafe is a mobile app that automatically notifies a family member when a
loved one arrives safely at a location, using geofencing. It replaces manual
"I'm home" check-ins with an automatic, unfakeable arrival signal.

Dual purpose: real personal family use + a portfolio piece.

## Tech Stack

- Expo React Native (TypeScript)
- Zustand for state management
- Firebase Auth — email/password only
- Firestore
- Firebase Cloud Messaging (FCM) for push notifications
- `expo-location` + `expo-task-manager` for background geofencing
- `expo-dev-client` — required. This project does **not** run in Expo Go.
  Background location needs entitlements Expo Go can't provide.

## Cost Constraints (hard rules)

- All Firebase services must stay on the **Spark (free) plan**. No paid
  upgrades, ever, under any circumstances.
- No paid Apple Developer Program account. iOS dev builds are built and
  signed **locally via Xcode** (`npx expo run:ios --device`) using a free
  Apple ID Personal Team, not via EAS cloud build. This means dev builds
  installed this way expire after 7 days and need reinstalling — that's
  expected and fine.
- If EAS cloud build is ever needed later (e.g. TestFlight/App Store), that
  requires the $99/year Apple Developer Program fee — do not assume this
  is available. Confirm with Enrico first before recommending anything
  that depends on it.
- No other paid third-party services of any kind without explicit
  confirmation first.

## MVP Scope (locked)

In scope:

- One safe location
- One linked family member
- Automatic geofence detection on arrival
- Push notification sent to family member on arrival

Out of scope for MVP — do not build, even if it seems easy or "while we're
at it":
scope for MVP — do not build, even if it seems easy or "while we're
at it":

- Multiple locations
- Multiple contacts
- Departure notifications
- Any settings/customization beyond the above

## Coding Conventions

- TypeScript throughout, strict typing preferred over `any`
- Zustand for state, no Redux/Context-heavy patterns
- Keep components small and single-purpose
- Minimize dependencies — don't add a library for something a few lines of
  native code or an existing dependency can already do
- Match existing file/folder structure before introducing new patterns

## Guardrails

- Never introduce a paid service or paid tier without asking first
- Never expand scope beyond the locked MVP list above without asking first
- Never remove or alter existing working features unless explicitly told to
- Before making changes, check for existing project structure/conventions
  and follow them rather than introducing something new
- Flag potential bugs, security issues, or regressions before or while
  making changes, don't silently work around them

## Workflow Rules

- Enrico commits manually. Agents/Claude **never run `git commit`**.
  Prepare a commit message and let Enrico commit it himself.
- Commit message format: `[branch][Action] Brief description`
  - Example: `[enricode][Add] Geofence arrival detection task`
- Active branch: `enricode`. Merge to `main` via GitHub pull request.

## Agentic AI Prompt Format

When writing prompts for Antigravity (Gemini Flash) or any other AI coding
assistant, use the `/prompt-master` format: explicit MUST/MUST NOT scope
locks and clear stop conditions, so the model doesn't drift into
unrequested features.
