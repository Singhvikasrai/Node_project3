# Employee Management API

Express and MySQL API for registration, profile management, approvals, audit history, and document uploads.

## Setup

1. Copy `.env.example` to `.env` and set the database credentials and a strong `JWT_SECRET`.
2. Install dependencies with `npm install`.
3. Start the API with `npm start`.

The server defaults to `http://localhost:5000`. On startup it creates missing tables and adds the legacy columns required by the current API.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port (default: `5000`) |
| `JWT_SECRET` | Secret used to sign access tokens |
| `DB_HOST` / `DB_PORT` | MySQL host and port |
| `DB_USER` / `DB_PASSWORD` | MySQL credentials |
| `DB_NAME` | Database name |

## Main routes

| Route | Purpose |
| --- | --- |
| `POST /register` | Register a user with address, employment, and documents |
| `POST /login` | Authenticate and get a JWT |
| `GET /users` | Get paginated users (requires JWT) |
| `PUT`, `DELETE /users/:id` | Update or delete a user (requires JWT) |
| `GET /address/:userId` | Get a user's complete profile data |
| `GET /state`, `GET /city?state_id=` | Location lookup data |
| `GET /pending` | List approval requests (admin JWT required) |
| `PUT /pending/:id/approve` | Approve a request (admin JWT required) |
| `PUT /pending/:id/reject` | Reject a request (admin JWT required) |
| `GET /audit` | Get audit history |

Uploaded files are saved under `backend/uploads` and served from `/uploads`.
