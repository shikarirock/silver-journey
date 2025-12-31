# Financial Tracker Mobile App

React Native mobile companion app for automatic transaction tracking from banking notifications.

## Features

- **User Authentication**: Login/Register with the backend
- **Automatic Notification Monitoring**: Listens for banking notifications
- **Transaction Sync**: Automatically sends notifications to backend for processing
- **Transaction Viewing**: See all your tracked transactions
- **Cross-Platform**: Works on both iOS and Android

## Setup

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (for testing)
- For iOS: Xcode and iOS Simulator
- For Android: Android Studio and Android Emulator

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Update API URL:
   - Open `src/services/api.ts`
   - Change `API_URL` to your backend URL (use your computer's IP address, not localhost)
   - Example: `http://192.168.1.100:3000/api`

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on device:
   - Scan QR code with Expo Go app
   - Or use:
     - `npm run ios` for iOS simulator
     - `npm run android` for Android emulator

## Important Notes

### Notification Access Limitations

The current implementation has limitations regarding full notification access:

**What Works:**
- Push notifications sent TO this app
- Manual testing by sending test notifications

**What Requires Native Implementation:**
- Reading notifications from OTHER apps (e.g., banking apps)
- This requires:
  - **Android**: NotificationListenerService (native module)
  - **iOS**: This is heavily restricted; typically not possible without jailbreak

### To Enable Full Notification Access:

For production use, you'll need to:

1. **Eject from Expo** or use a **custom development build**:
   ```bash
   npx expo prebuild
   ```

2. **Android Implementation**:
   - Create a NotificationListenerService in Java/Kotlin
   - Request BIND_NOTIFICATION_LISTENER_SERVICE permission
   - Filter for banking app notifications
   - Bridge to React Native

3. **iOS Implementation**:
   - iOS does not allow third-party apps to read other apps' notifications
   - Alternative: Use Shortcuts app or manual forwarding

### Development Workflow

For now, the app demonstrates the architecture and can:
- Authenticate with backend
- View transactions
- Process notifications sent to it
- Provide the UI/UX for the full solution

To test notification processing:
1. Send a test push notification to the app
2. The app will forward it to the backend
3. Backend will parse and create a transaction

## Project Structure

```
mobile/
├── src/
│   ├── screens/           # Screen components
│   ├── services/          # API and notification services
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript types
├── App.tsx                # Main app component
├── app.json               # Expo configuration
└── package.json
```

## Building for Production

### Android

```bash
eas build --platform android
```

### iOS

```bash
eas build --platform ios
```

Note: You'll need an Expo account and to set up EAS Build.

## Technology Stack

- React Native with Expo
- TypeScript
- Expo Notifications
- AsyncStorage for local data
- Axios for API calls

## Future Enhancements

- Native notification listener module
- Better error handling and offline support
- Transaction categorization improvements
- Spending analytics and charts
- Budget tracking
- Receipt scanning with OCR
