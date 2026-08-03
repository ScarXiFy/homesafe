# ROADMAP.md — HomeSafe

Ordered checklist. Each item should be a separate PR into `main` from
`enricode` where practical.

- [x] Scaffold Expo React Native (TypeScript) project, SDK 57
- [x] Set up `expo-dev-client` and local iOS dev build via Xcode
      (free Personal Team, `npx expo run:ios --device`)
- [x] Firebase project setup (Spark plan) — Auth, Firestore, FCM configured
- [x] Email/password authentication (sign up, sign in, sign out)
- [x] Request and confirm location permissions — foreground, then
      background ("Always Allow"), with proper handling if denied
- [x] Safe location setup — let user set one location (MVP: one only),
      current-position save + Apple Maps preview, Firestore-backed
- [x] Geofence registration via `expo-task-manager`, background arrival
      detection (100m radius, tuned via testing)
- [ ] Bidirectional family linking (MVP: one linked contact) — either
      linked person can be notified when the other arrives. No fixed
      Parent/Member roles; the link itself is symmetric.
- [ ] Push notification sent via FCM on confirmed arrival — target device
      may be iOS or Android (Enrico's parent uses Android), so notification
      delivery must be verified on both platforms, not iOS-only
- [ ] End-to-end testing: real-device background arrival detection,
      notification delivery, and app-killed/backgrounded state handling,
      on both the tracked device (iOS) and the notified device (Android)

## Post-MVP (not started, do not build yet)

- [ ] Notification history screen — view past notifications, max 3-day
      retention window
- [ ] Data retention/cleanup for expired history records

Notes:

- Background location will not work correctly in Expo Go — always test via
  the dev client build.
- Do not add items to this list beyond MVP scope without checking against
  AGENTS.md scope lock first.
- Post-MVP items are captured here so they're not lost, but must not be
  started until the MVP checklist above is fully complete and tested.
- The notified family member's device is Android. FCM setup and the
  eventual notification-sending code must not assume iOS-only; Android
  will need its own Firebase app registration (google-services.json) and
  its own build/test pass before this is considered done.
