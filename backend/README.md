# Financial Tracker Backend

Express.js backend API with TypeScript, SQLite, and llama.cpp integration.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Configure your `.env` file with:
   - `LLM_API_URL`: Your llama.cpp server URL (default: http://localhost:8080/v1/chat/completions)
   - `JWT_SECRET`: A secure secret key for JWT tokens
   - Other settings as needed

4. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

### Transactions (Authenticated)

All transaction endpoints require `Authorization: Bearer <token>` header.

- `GET /api/transactions` - Get all transactions
  - Query params: `limit`, `offset`

- `POST /api/transactions/manual` - Create transaction from natural language
  ```json
  {
    "text": "10 bucks at starbucks this morning"
  }
  ```

- `PUT /api/transactions/:id` - Update transaction
  ```json
  {
    "amount": 10.50,
    "merchant": "Starbucks",
    "category": "food",
    "date": "2024-01-15",
    "description": "Morning coffee"
  }
  ```

- `DELETE /api/transactions/:id` - Delete transaction

### Notifications (Authenticated)

- `POST /api/notifications` - Process notification from mobile app
  ```json
  {
    "text": "Payment of $25.00 at Amazon",
    "appName": "Bank App"
  }
  ```

## Database

SQLite database is automatically created at `./data/finance.db` on first run.

### Schema

- `users` - User accounts
- `transactions` - Financial transactions
- `raw_notifications` - Raw notification data for debugging

## Development

```bash
# Development with auto-reload
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

## LLM Integration

The backend expects a llama.cpp server running with an OpenAI-compatible API endpoint.

Make sure your llama.cpp server is running and accessible at the URL specified in `LLM_API_URL`.

Example llama.cpp server command:
```bash
./server -m model.gguf --host 0.0.0.0 --port 8080
```
