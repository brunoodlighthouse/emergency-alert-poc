# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npx expo start              # Start Expo dev server (requires expo-dev-client build on device)
npx expo run:android        # Build and run on Android emulator/device
npx expo start --web        # Run web version

# Build
npm run build:apk           # EAS cloud build (preview APK)
npm run build:apk:local     # Local Android release build (increments version, runs Gradle, copies APK)

# Version management
npm run version:current     # Show current version
npm run version:apply       # Apply version from version.json
npm run version:rollback     # Rollback version

# Firebase Functions (from firebase/functions/)
npm install                 # Install function dependencies
firebase deploy --only functions  # Deploy Cloud Functions
```

**Important:** This project uses native modules (`@react-native-firebase/messaging`, `@notifee/react-native`) that require a native build — it cannot run with `expo go`. Always use a dev client or full native build.

## Architecture

### App (Expo Router, file-based routing)

- `app/index.tsx` — Entry point: redirects to `/login` or `/(app)` based on auth state
- `app/login.tsx` — Email/password login + anonymous sign-in
- `app/(app)/` — Authenticated tab layout with 3 screens:
  - `index.tsx` — "Enviar Alerta" (send emergency alert form)
  - `groups.tsx` — Group management
  - `profile.tsx` — User profile

### Auth & Data (`contexts/`, `lib/firebase.ts`)

- `AuthContext` wraps the entire app; provides `user`, `userData`, `loading`, `refreshUserData`
- On auth state change, FCM token is registered and saved to Firestore `users/{uid}`
- `lib/firebase.ts` initializes Firebase (using `getReactNativePersistence` for AsyncStorage on native, `getAuth` on web) and exports all Firestore helpers and TypeScript interfaces (`UserData`, `GroupData`, `AlertData`)

### Notification Pipeline

Alerts flow through two paths depending on app state:

1. **Alert created** → Firestore `alerts/{id}` document written by client
2. **Cloud Function** (`firebase/functions/index.js`) triggers `onCreate`, reads FCM tokens from Firestore, sends **data-only** FCM messages (no `notification` field, to prevent the system from displaying via a default channel)
3. **App receives FCM:**
   - **Background/killed:** `lib/fcm-handler.ts` (registered via `messaging().setBackgroundMessageHandler`) processes the data and calls `notifee.displayNotification()` with the emergency channel
   - **Foreground:** `lib/notifications.ts` `setupNotificationListeners()` handles `messaging().onMessage()` and triggers both the in-app `EmergencyOverlay` and `displayEmergencyNotification()`
4. **Notifee displays notification** using the `emergency_alerts` channel (`lib/notifee-channel.ts`) — this channel has `bypassDnd: true`, `AndroidCategory.ALARM`, looping sound, and full-screen intent

### Emergency Overlay

`components/EmergencyOverlay.tsx` renders a full-screen modal with haptic feedback and alarm sound when an alert arrives while the app is foregrounded. Dismissed via `onClose` callback.

### Custom Expo Config Plugins

- `withEmergencySound.js` — Copies `assets/sounds/emergency_alert.wav` into native Android `res/raw/`
- `withNotifeeAndroidFix.js` — Patches Android Manifest for Notifee compatibility
- `withFirebaseManifestFix.js` — Fixes Firebase manifest entries
- `withVersion.js` — Injects versionCode from `version.json` into Android build

### Firebase Setup

- `google-services.json` is required in the project root (not committed; see `google-services.json.example`)
- Firebase project: `poc-alert-a3beb`
- Firestore collections: `users`, `groups`, `alerts`
- Cloud Functions in `firebase/functions/` use Node.js + `firebase-admin`

### EAS Build Profiles

- `development` — APK with dev client
- `preview` — Internal distribution APK
- `production` — AAB for Play Store
