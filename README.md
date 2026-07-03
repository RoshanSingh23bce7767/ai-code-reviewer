# AI Code Reviewer

AI Code Reviewer is a full-stack code review app with a React/Vite client and an Express/TypeScript backend. It supports email/password authentication, protected sessions, AI-powered code review, review history, analytics, and language-specific editor support.

## Tech Stack

- Client: React, TypeScript, Vite, Monaco Editor
- Server: Node.js, Express, TypeScript
- Database: MongoDB
- Cache/session support: Redis
- AI review engine: Google Gemini API

## Project Structure

```text
ai code reviewer/
  client/        React frontend
  server/        Express backend
  docker/        Docker build files
  docker-compose.yml
  package.json   Root scripts for both apps
```

## Requirements

- Node.js 20 or newer recommended
- npm
- MongoDB running locally or through Docker
- Redis running locally or through Docker
- Gemini API key for real AI reviews

## Environment Files

The project already has:

- `server/.env`
- `client/.env`

Important values:

```env
# server/.env
PORT=5050
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/ai_code_review
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:5173
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_google_ai_studio_key
GEMINI_MODEL=gemini-2.5-flash-lite
```

```env
# client/.env
VITE_API_URL=http://localhost:5050/api/v1
VITE_APP_NAME=AI Code Reviewer
```

Keep `.env` values private. Do not commit API keys or production secrets.

## Install

From the root folder:

```powershell
npm.cmd run install:all
```

If dependencies already exist, you can skip this.

## Run Locally

Start MongoDB and Redis first. If they are installed locally, make sure these are available:

```text
MongoDB: mongodb://localhost:27017
Redis: redis://localhost:6379
```

Then run both client and server:

```powershell
npm.cmd run dev
```

Or run them separately:

```powershell
npm.cmd run dev:server
npm.cmd run dev:client
```

Default local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5050/api/v1`
- API health: `http://localhost:5050/health`
- API docs: `http://localhost:5050/api/docs`

## Fresh Start

For a fresh app state, reset the MongoDB database used by `MONGODB_URI`.

For the default local database:

```javascript
use ai_code_review
db.dropDatabase()
```

You can run that in MongoDB Compass, `mongosh`, or your preferred MongoDB tool.

This deletes app data such as users, sessions, reviews, analytics, history, and notifications. It does not delete source code or environment files.

## Supported Review Languages

The review workspace and backend validator now support:

- JavaScript
- TypeScript
- Python
- Java
- C
- C++
- C#
- Go
- Rust
- PHP
- Ruby
- Swift
- Kotlin
- Scala
- SQL
- Shell

The client uses language metadata so Monaco Editor receives correct language IDs, including `csharp` for C#, `ruby` for Ruby, and `cpp` for C++.

## Authentication Notes

- Development without SMTP auto-verifies users so local testing is easy.
- Test, production, and SMTP-configured environments use email verification.
- Password reset and email verification tokens are hashed before storage.
- Auth uses HTTP-only cookies for access and refresh tokens.

## Build

Build both apps:

```powershell
npm.cmd run build
```

Build individually:

```powershell
npm.cmd run build:server
npm.cmd run build:client
```

## Test

Run server tests:

```powershell
npm.cmd run test:server
```

The server test suite uses an in-memory MongoDB test database, so normal app data is not touched.

## Verification Status

Latest verification performed:

- Server tests passed: 17 suites, 56 tests
- Server production build passed
- Client TypeScript check passed
- Client production build passed

Vite may warn that the client bundle is larger than 500 KB. That is a performance warning, not a run-blocking error.

## Troubleshooting

If PowerShell blocks `npm`, use `npm.cmd` instead:

```powershell
npm.cmd run dev
```

If login or registration fails:

- Confirm the backend is running on port `5050`.
- Confirm `client/.env` points to `http://localhost:5050/api/v1`.
- Confirm MongoDB is running and matches `server/.env`.
- Clear browser cookies for `localhost` if old auth cookies are stuck.

If AI review fails:

- Confirm `GEMINI_API_KEY` is set.
- Confirm the key is valid in Google AI Studio.
- Check server logs for quota or model errors.

If Redis is unavailable:

- The app can still run, but caching/session dependency checks may report degraded health depending on configuration.
