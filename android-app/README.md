Android app guidance

- Recommended: create a Kotlin Android app using `WorkManager` for scheduled background work and the Android Keystore for secure credentials.
- Where possible, use official platform APIs (e.g., Instagram Graph API for business accounts) instead of UI automation.
- If UI automation is required, implement a careful AccessibilityService that the user explicitly enables; this must respect privacy and platform TOS.

Next: run `npx @react-native` or `Android Studio -> New Project` inside this folder to create the full Android project.
