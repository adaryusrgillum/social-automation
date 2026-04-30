# Social Automation

Scaffold for automating scheduled social-media posts using an Android APK and a desktop controller.

Components:
- `android-app`: Android Kotlin app (scheduling + secure storage). Use official APIs where possible.
- `desktop-controller`: Electron/Node app to control the phone via ADB and clipboard.
- `backend`: Light Node.js scheduler and API for storing schedules (optional).

Next steps:
1. Initialize Android project in `android-app` (Kotlin + WorkManager).
2. Implement desktop controller in `desktop-controller` and integrate ADB.
3. Implement backend schedule endpoints in `backend`.

Security note: Prefer official platform APIs (e.g., Instagram Graph API for business accounts). UI automation is possible but must respect platform terms of service and user privacy.
