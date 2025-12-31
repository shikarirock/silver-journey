# Financial Tracker Frontend

React + TypeScript frontend with Tailwind CSS for the financial tracker application.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file:
   ```
   VITE_API_URL=http://localhost:3000/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

## Features

- **Authentication**: Login and registration with JWT
- **Manual Transaction Input**: Add transactions using natural language
  - Example: "10 bucks at starbucks this morning"
  - AI automatically parses amount, merchant, category, and date
- **Transaction Management**: View, edit, and delete transactions
- **Professional UI**: Modern, clean design with Tailwind CSS
- **Real-time Updates**: Immediate feedback on all actions

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Axios for API calls
- date-fns for date formatting

## Project Structure

```
src/
├── components/       # Reusable components
├── contexts/         # React contexts (Auth)
├── pages/           # Page components
├── services/        # API client
├── types/           # TypeScript types
├── App.tsx          # Main app component
├── main.tsx         # App entry point
└── index.css        # Tailwind styles
```

## Development

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Usage

1. **Register/Login**: Create an account or login
2. **Add Transaction**: Type a natural language description like "spent 25 dollars at target yesterday"
3. **View Transactions**: See all your transactions with categories and totals
4. **Edit/Delete**: Modify or remove transactions as needed

## Mobile App

The companion mobile app (iOS/Android) will automatically sync banking notifications to create transactions.
