# ROADMAP.md — HomeSafe

Ordered checklist. Each item should be a separate PR into `main` from
`enricode` where practical.

- [x] Scaffold Expo React Native (TypeScript) project, SDK 57
- [x] Set up `expo-dev-client` and local iOS dev build via Xcode
      (free Personal Team, `npx expo run:ios --device`)
- [ ] Firebase project setup (Spark plan) — Auth, Firestore, FCM configured
- [ ] Email/password authentication (sign up, sign in, sign out)
- [ ] Request and confirm location permissions — foreground, then
      background ("Always Allow"), with proper handling if denied
- [ ] Safe location setup — let user set one location (MVP: one only)
- [ ] Geofence registration via `expo-task-manager`, background arrival
      detection
- [ ] Link one family member (MVP: one only) to receive notifications
- [ ] Push notification sent via FCM on confirmed arrival
- [ ] End-to-end testing: real-device background arrival detection,
      notification delivery, and app-killed/backgrounded state handling

Notes:

- Background location will not work correctly in Expo Go — always test via
  the dev client build.
- Do not add items to this list beyond MVP scope without checking against
  AGENTS.md scope lock first.
AGENTS.md scope lock first.
  