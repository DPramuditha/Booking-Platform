# EN2H Booking Platform REST API & Dashboard

A premium, production-ready booking platform featuring a **NestJS + TypeScript** backend REST API integrated with a **PostgreSQL** database, and a beautiful visitor and administrator dashboard built with **React, Vite, and TypeScript**. 

The brand design theme leverages color `#d57e1e` (a warm, premium orange) with sleek dark panels, rich states, and micro-interactions.

---

## Technical Stack

- **Backend**: NestJS (v11), TypeORM, PostgreSQL, class-validator, Swagger UI
- **Frontend**: Vite + React, TypeScript, Vanilla CSS, Lucide icons
- **Environment Management**: Docker Compose, dotenv configurations
- **Design System**: Warm charcoal backdrops (`#0c0d0f`, `#15171c`), custom scrollbars, glassmorphism, transitions, and brand highlight color `#d57e1e`.

---

## Project Structure

```
booking-platform/
├── backend/                  # NestJS REST API source
│   ├── src/
│   │   ├── auth/             # JWT, Registration, Logins, Refresh tokens
│   │   ├── users/            # User account entity and handlers
│   │   ├── services/         # Platform services management (CRUD)
│   │   ├── bookings/         # Customer bookings management & business checks
│   │   └── main.ts           # App shell setup, CORS, themed Swagger UI
│   ├── Dockerfile            # Multi-stage optimized Docker build
│   └── tsconfig.json
├── frontend/                 # Vite + React + TS dashboard
│   ├── src/
│   │   ├── api.ts            # Frontend HTTP client wrappers
│   │   ├── App.tsx           # Page logic, customer & admin dashboard panels
│   │   └── index.css         # Styling system themed with #d57e1e
│   └── Dockerfile            # Container deployment configurations
├── database/
│   └── migrations/
│       └── schema.sql        # Database table definitions and indexes
├── docker-compose.yml        # Orchestration configurations
├── .env.example              # Sample settings
└── README.md                 # Project handbook
```

---

## Installation & Setup

### Option 1: Docker Compose (Quickest & Preferred)

Spin up the entire platform including PostgreSQL, NestJS backend API, and React frontend with a single command:

1. **Verify Ports**: Ensure ports `3000`, `5173`, and `5432` are available.
2. **Launch Application**:
   ```bash
   docker compose up --build
   ```
3. **Explore**:
   - **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
   - **Swagger API Docs**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
   - **Database connection**: port `5432` (user: `postgres`, password: `postgres`, db: `booking_platform`)

---

### Option 2: Local Manual Setup

If you prefer to run the components directly on your host machine:

#### 1. Setup PostgreSQL Database
- Run local PostgreSQL.
- Create a database called `booking_platform`.
- Configure the `.env` file at the root of the project:
  ```env
  PORT=3000
  DATABASE_HOST=localhost
  DATABASE_PORT=5432
  DATABASE_USER=your_postgres_user
  DATABASE_PASSWORD=your_postgres_password
  DATABASE_NAME=booking_platform
  JWT_SECRET=super_secret_jwt_key_12345
  JWT_EXPIRES_IN=1h
  JWT_REFRESH_SECRET=super_secret_refresh_key_67890
  JWT_REFRESH_EXPIRES_IN=7d
  ```

#### 2. Install & Start Backend
```bash
cd backend
npm install
npm run start:dev
```
The NestJS server will start on port `3000` and automatically synchronize table schemas in PostgreSQL.

#### 3. Install & Start Frontend
```bash
cd ../frontend
npm install
npm run dev
```
The Vite development server will start on port `5173`. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Running Automated Tests

To verify backend controller business rules, authentication handlers, and database integrations, execute:

```bash
cd backend
npm run test
```

---

## Database Migration & Schema

TypeORM is configured with `synchronize: true` for development convenience to automatically generate tables upon startup. 
For production audits, raw SQL schema migration files are provided in [schema.sql](file:///c:/Users/dimut/Dimuthu/Web/booking-platform/database/migrations/schema.sql).

---

## API Documentation

Interactive API documentation is generated using Swagger UI at [http://localhost:3000/api/docs](http://localhost:3000/api/docs). The interface has been customized with `#d57e1e` brand aesthetics.

### Authentication Endpoints
- `POST /auth/register` - Create an administrator account.
- `POST /auth/login` - Secure credential validation returning access/refresh tokens.
- `POST /auth/refresh` - Swap active refresh token for a fresh access token.
- `POST /auth/logout` (Authenticated) - Destroy session tokens in backend database.

### Service Management (Authenticated Admin only for Writes)
- `POST /services` - Create a service package.
- `PUT /services/:id` - Edit service attributes.
- `DELETE /services/:id` - Remove service offering.
- `GET /services` (Public) - Fetch active services for customers or all services for admins.
- `GET /services/:id` (Public) - Retrieve details of a specific service.

### Booking Management (Public for Creation, Admin for Operations)
- `POST /bookings` (Public) - Create a booking reservation (validates date and conflicts).
- `PUT /bookings/:id/cancel` (Public) - Allow customers to cancel a booking if they hold the reference ID.
- `GET /bookings` (Admin Only) - Paginated, searchable list of customer reservations.
- `GET /bookings/:id` (Admin Only) - Details of a booking order.
- `PUT /bookings/:id/status` (Admin Only) - Perform state transitions (`PENDING`, `CONFIRMED`, `COMPLETED`).

---

## Business Rules Implemented

1. **Service Dependency**: Every booking must reference a valid, active service ID.
2. **No Past Bookings**: Validates date strings; attempts to reserve days prior to current calendar date are rejected with `400 Bad Request`.
3. **No Completing Cancelled Bookings**: Bookings in `CANCELLED` state cannot transition to `COMPLETED`.
4. **Duplicate Prevention**: Concurrency validation checks if the `(serviceId, bookingDate, bookingTime)` slot is occupied by an active reservation. If a previous booking for that slot was `CANCELLED`, the slot is treated as available.
5. **Security Separation**: Service CRUD and booking overview queries are protected by passport-jwt auth guards, while customers can book and cancel slots publicly.

---

## Assumptions Made

- **Slot Availability**: Booking times are handled as slots (e.g., `"14:00"`, `"14:30"`). Two customers cannot book the same service on the same date and time.
- **Cancellation**: If a customer cancels their booking, their time slot is released and becomes bookable again.
- **Authentication Scope**: Anyone can register as an admin using the registration form in the administrator portal, which is convenient for testing. In real-world environments, this route would be restricted or closed.

---

## Future Improvements

- **Interactive Calendar**: Replace text time input with an interactive calendar showing busy slots.
- **Email Notifications**: Automatically dispatch confirm/cancellation links via Nodemailer.
- **Role-based Access Control**: Distinguish between normal admins and super admins.
- **Database Backups**: Schedule automated pg_dump backups inside Postgres volumes.
