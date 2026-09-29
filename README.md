# Apponext HRMS — Mobile

React Native CLI app (JavaScript / JSX) for the Apponext HRMS platform, with an
**Employee** side and an **Admin** side. It talks to the existing backend at
`https://hrms.apponext.in/api/v1` (set in `src/config/env.js`).

## Modules

| Module     | Employee side                                              | Admin side                                                     |
|------------|------------------------------------------------------------|----------------------------------------------------------------|
| Dashboard  | Live punch card, quick actions, month stats, leave balance | Headcount KPIs, today's attendance, weekly trend, leave by type |
| Attendance | Check in / out with GPS, breaks, monthly log and summary   | Org attendance today, weekly trend, regularization approvals   |
| Leave      | Balances, apply (full / half day), history, cancel         | Pending and processed approvals, approve / reject with note    |
| Expense    | Multi-item claims with receipt photos, filters, details    | Pending claim approvals, approve / reject with note            |
| Profile    | Profile, edit profile, change password                     | Same                                                           |

Plus: notifications, settings (light / dark / system theme, notification
preferences, clear cache), help & FAQ, about, secure sign-out.

Users with an admin role (`organization_admin`, `company_admin`, `hr_manager`,
`finance`, `super_admin`) always get the admin side. Everyone else, including
team leads and reporting managers, gets the employee side. There is no view
switch.

## Tech stack

- React Native 0.87 (CLI, new architecture), JavaScript + JSX
- Redux Toolkit + React Redux
- React Navigation 7 (native stack + bottom tabs)
- Axios with automatic token refresh
- react-native-keychain (tokens in Android Keystore / iOS Keychain), AsyncStorage (preferences)
- Ionicons (filled / outline tab icons) and lucide-react-native (same icon set as the web portal), react-native-svg, react-native-linear-gradient
- @react-native-community/geolocation, @react-native-community/datetimepicker, react-native-image-picker, dayjs

Colors come from the portal's `app-shell-reference` skin in
`client/src/index.css`, converted to hex in `src/theme/colors.js`.

## Folder structure

```
src/
├── App.jsx                  # Providers + session bootstrap
├── api/
│   ├── client.js            # Axios instance, auth header, 401 → refresh → retry
│   ├── endpoints.js         # Every backend route used by the app
│   └── services/            # auth, dashboard, attendance, leave, expense, profile, notifications
├── store/
│   ├── index.js             # configureStore
│   ├── helpers.js           # remote() state shape + thunk wiring
│   └── slices/              # auth, settings, dashboard, attendance, leave, expense, profile, notifications
├── navigation/              # RootNavigator, EmployeeTabs, AdminTabs
├── screens/
│   ├── auth/                # Splash, Login
│   ├── employee/            # dashboard, attendance, leave, expense
│   ├── admin/               # dashboard, attendance, leave, expense
│   ├── profile/             # Profile, EditProfile, ChangePassword
│   ├── settings/            # Settings, Help, About
│   └── notifications/
├── components/
│   ├── ui/                  # Design system: Button, Card, Input, Screen, Header, BottomSheet…
│   └── common/              # PunchCard, LeaveCard, ExpenseCard, DecisionSheet, charts
├── theme/                   # colors, typography, spacing
├── hooks/                   # useTheme, useRedux
├── utils/                   # format, normalize (API → UI shapes), roles, storage, location, errors
├── config/env.js            # API URL and app constants
└── assets/images/logo.png
```

`@/` is an alias for `src/` (babel-plugin-module-resolver + jsconfig.json).

## Running

Requirements: Node ≥ 22.11, JDK 17+ and the Android SDK (`ANDROID_HOME`).

```bash
npm install
npm start                # Metro bundler
npm run android          # build and install on an emulator / connected device
```

Release APK: `cd android && ./gradlew assembleRelease` (set up a release
keystore in `android/app/build.gradle` first; the template signs release builds
with the debug key).

## Notes on the backend

- The API mixes camelCase and snake_case fields; `src/utils/normalize.js` maps
  both to one shape, so screens never read raw API objects.
- `POST /auth/refresh` returns new tokens only as `Set-Cookie`; the client reads
  them from the response headers.
- Expense receipts are sent the same way the web portal sends them: as a
  base64 data URL in each item's `receiptUrl` (camera or gallery, max 10MB).
