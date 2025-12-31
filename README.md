# Financial Tracker

A comprehensive financial tracking application with automatic transaction detection from mobile notifications and natural language input processing.

## Features

1. **Automatic Transaction Detection**: Mobile companion app monitors banking notifications and automatically extracts transaction details
2. **Natural Language Input**: Manually add transactions using natural language (e.g., "10 bucks at starbucks this morning")
3. **LLM-Powered Parsing**: Uses Claude AI to intelligently parse and categorize transactions
4. **Web Dashboard**: View, edit, and manage all your transactions
5. **Cross-Platform**: Web app + iOS/Android companion apps

## Project Structure

```
financial-tracker/
├── backend/          # Node.js + Express API
├── frontend/         # React web application
├── mobile/           # React Native mobile app
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Anthropic API key (for Claude AI)
- For mobile development:
  - Xcode (iOS)
  - Android Studio (Android)

### Installation

1. Clone the repository
2. Install dependencies for all projects:
   ```bash
   npm run install:all
   ```

3. Set up environment variables (see individual README files in each directory)

### Development

Run each component separately:

```bash
# Backend API
npm run dev:backend

# Web Frontend
npm run dev:frontend

# Mobile App
npm run dev:mobile
```

## Architecture

- **Backend**: Node.js, Express, TypeScript, SQLite
- **Frontend**: React, TypeScript, Vite
- **Mobile**: React Native, TypeScript
- **LLM**: Anthropic Claude API
- **Database**: SQLite (development), PostgreSQL (production-ready)

## License

MIT
