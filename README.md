# EN2H Booking Platform REST API & Dashboard

A premium, production-ready booking platform featuring a **NestJS + TypeScript** backend REST API integrated with a **PostgreSQL** database, and a beautiful visitor and administrator dashboard built with **React, Vite, and TypeScript**. 

The brand design theme leverages color `#d57e1e` (a warm, premium orange) with sleek dark panels, rich states, and micro-interactions.

---

## ● Project Overview

The **EN2H Booking Platform** is designed to provide clients with a frictionless scheduling experience while giving administrators full operational control over service offerings and schedules. 

### Key Features
*   **Customer Booking Portal**: Allows clients to view available active services, choose scheduling slots (date and time), and place reservations. Customers can also cancel their bookings using their unique reference IDs. No customer authentication is required.
*   **Admin Dashboard Panel**: A secure workspace where administrators can authenticate (login/register) to manage the service catalog (CRUD) and manage customer bookings (view schedules, search, filter, and transition booking states).
*   **Double-Booking Prevention**: Employs application-level checks and database-level partial unique indexes to guarantee slot availability and prevent double bookings.
*   **Modern Premium Theming**: A bespoke charcoal dark mode dashboard (`#0c0d0f`, `#15171c`) optimized with brand highlight orange (`#d57e1e`), custom scrollbars, animations, and clean status indicators.

### Tech Stack
*   **Backend REST API**: NestJS (v11), TypeORM, PostgreSQL, class-validator, Swagger UI, Jest (unit tests).
*   **Frontend Dashboard**: React, Vite, TypeScript, Vanilla CSS, Lucide icons.
*   **Orchestrator**: Docker, Docker Compose.

### Directory Structure
```
booking-platform/
├── backend/                  # NestJS REST API source
│   ├── src/
│   │   ├── auth/             # JWT authentication, login/register logic
│   │   ├── users/            # User account entities and database operations
│   │   ├── services/         # Service offerings CRUD handlers
│   │   ├── bookings/         # Booking reservations & slot conflict logic
│   │   └── main.ts           # Bootstrapper (CORS, themed Swagger UI setup)
│   ├── Dockerfile            # Multi-stage optimized Docker deployment file
│   └── package.json          # Backend dependencies and scripts
├── frontend/                 # Vite + React + TS dashboard source
│   ├── src/
│   │   ├── api.ts            # Frontend HTTP client wrappers
│   │   ├── App.tsx           # Customer & administrator dashboard views
│   │   ├── index.css         # Styling system themed with #d57e1e
│   │   └── main.tsx          # Frontend entry point
│   ├── Dockerfile            # Container deployment configurations
│   └── package.json          # Frontend dependencies and scripts
├── database/
│   └── migrations/
│       └── schema.sql        # Database table definitions and indexes
├── docker-compose.yml        # Multi-container orchestration configurations
├── .env.example              # Sample project configuration file
├── .gitignore                # Git exclusions
└── README.md                 # System documentation handbook
```

---

## ● Environment Variables

Configuration parameters are managed using environment variables. An `.env.example` file is included in the project root. To configure your local environment, copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

| Key | Description | Default Value |
| :--- | :--- | :--- |
| **PORT** | Port that the backend API binds to | `3000` |
| **DATABASE_HOST** | PostgreSQL host address (set to `postgres-db` in Docker) | `localhost` |
| **DATABASE_PORT** | PostgreSQL server connection port | `5432` |
| **DATABASE_USER** | PostgreSQL database administrator username | `postgres` |
| **DATABASE_PASSWORD**| PostgreSQL database administrator password | `postgres` |
| **DATABASE_NAME** | Target database name | `booking_platform` |
| **JWT_SECRET** | Secret string key used for signing JWT access tokens | `super_secret_jwt_key_12345` |
| **JWT_EXPIRES_IN** | Expiry duration for JWT access tokens | `1h` |
| **JWT_REFRESH_SECRET**| Secret string key used for signing JWT refresh tokens | `super_secret_refresh_key_67890`|
| **JWT_REFRESH_EXPIRES_IN**| Expiry duration for JWT refresh tokens | `7d` |

---

## ● Database Setup

The project uses a **PostgreSQL** database. 

### Using Docker Compose (Automatic Setup)
When running the application via Docker Compose, a PostgreSQL container (`postgres:15-alpine`) is automatically configured, initialized with credentials from your `.env` file, and mounts a persistent volume (`postgres_data`). No manual steps are required.

### Manual Setup (Local Host Machine)
1. Ensure a PostgreSQL instance is running on your host machine.
2. Connect to PostgreSQL using your administration tool (e.g. pgAdmin, psql) and create the target database:
   ```sql
   CREATE DATABASE booking_platform;
   ```
3. Update the `.env` file in the project root with your PostgreSQL credentials (`DATABASE_USER` and `DATABASE_PASSWORD`).

---

## ● Running Migrations

TypeORM is configured with schema auto-synchronization for seamless development. However, production-grade schema DDL definitions are preserved in the `database/migrations/` directory.

### Auto-synchronization (Development)
The NestJS backend has `synchronize: true` configured inside [app.module.ts](file:///c:/Users/dimut/Dimuthu/Web/booking-platform/backend/src/app.module.ts). When the server starts up, it automatically connects to PostgreSQL and creates the database schema, matching the TypeScript entity models.

### Manual Migrations (Production/Auditing)
If you disable auto-synchronization and wish to apply the schema manually:
1. Run the DDL statements found in [database/migrations/schema.sql](file:///c:/Users/dimut/Dimuthu/Web/booking-platform/database/migrations/schema.sql) directly on your database.
2. Note that active booking slot uniqueness is enforced via a partial unique index, which must be executed:
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_booking ON bookings(service_id, "bookingDate", "bookingTime") WHERE status != 'CANCELLED';
   ```

---

## ● Installation Steps & Running the Application

Ensure you have [Docker](https://www.docker.com/) and [Node.js](https://nodejs.org/) installed on your machine.

### Option A: Running via Docker Compose (Recommended)
This approach spins up the database, backend NestJS API, and frontend Vite server concurrently in containers.

1.  Navigate to the project root directory.
2.  Launch the orchestration stack:
    ```bash
    docker compose up --build
    ```
3.  Once the build completes and the logs display successful startup, the services are available at:
    *   **Frontend Dashboard**: [http://localhost:5173](http://localhost:5173)
    *   **Backend Swagger API**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
    *   **Database Port**: `5432`

---

### Option B: Running Manually on Local Machine
If you prefer running the components directly on your host operating system:

#### 1. Start the Backend API
1.  Navigate to the `backend` folder:
    ```bash
    cd backend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the NestJS application in development hot-reload mode:
    ```bash
    npm run start:dev
    ```
    The backend binds to port `3000` (e.g., [http://localhost:3000](http://localhost:3000)).

#### 2. Start the Frontend Dashboard
1.  Open a new terminal and navigate to the `frontend` folder:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite dev server:
    ```bash
    npm run dev
    ```
    The frontend binds to port `5173` (e.g., [http://localhost:5173](http://localhost:5173)).

---

### Running Tests
To run the automated backend unit test suites (which verify business logic for bookings, services, user accounts, and authentication):

```bash
cd backend
npm run test
```

---

## ● API Documentation

The backend application generates interactive API documentation using **Swagger UI**. 

*   **Endpoint Docs URL**: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)
*   **Theming**: The Swagger documentation layout is customized to match the brand orange (`#d57e1e`) aesthetic.

### API Endpoints Summary

#### 1. Authentication (`/auth`)
*   `POST /auth/register` - Create a new administrator account.
*   `POST /auth/login` - Authenticate admin credentials and retrieve JWT Access & Refresh tokens.
*   `POST /auth/refresh` - Rotate and retrieve a fresh JWT Access token using a valid Refresh token.
*   `POST /auth/logout` (Authenticated) - Invalidate and clear refresh tokens in the database.

#### 2. Services Management (`/services`)
*   `GET /services` (Public) - Fetch active services for customer views, or all services for admin panels.
*   `GET /services/:id` (Public) - Fetch details of a single service offering.
*   `POST /services` (Authenticated Admin) - Create a new service package.
*   `PUT /services/:id` (Authenticated Admin) - Modify service attributes.
*   `DELETE /services/:id` (Authenticated Admin) - Permanently delete a service offering (restricted if active bookings exist).

#### 3. Bookings Management (`/bookings`)
*   `POST /bookings` (Public) - Create a reservation slot (undergoes validation for date and duplicate slots).
*   `GET /bookings` (Authenticated Admin) - Retrieve paginated, searchable customer bookings.
*   `GET /bookings/:id` (Authenticated Admin) - Fetch details of a specific booking.
*   `PUT /bookings/:id/status` (Authenticated Admin) - Transition a booking status (`PENDING`, `CONFIRMED`, `COMPLETED`, `CANCELLED`).
*   `PUT /bookings/:id/cancel` (Public) - Cancel a booking using its reference ID.

---

## ● Assumptions Made

1.  **Slot Division**: Time slot values are treated as distinct string increments (e.g. `"09:00"`, `"09:30"`, `"14:00"`). A booking is a duplicate only if the *exact* time string, date, and service ID match.
2.  **Uniqueness Scope**: If a booking is `CANCELLED`, its slot is immediately released and becomes open for other clients to schedule. Uniqueness constraints only apply to active status bookings.
3.  **Administrator Registration Openness**: For evaluation convenience, the administrative registration endpoint `/auth/register` remains open on the web. In a production environment, registration would be protected behind access tokens, restricted to specific domains, or disabled entirely.
4.  **No Customer Accounts**: Customers do not need accounts or login credentials to book or cancel slots. They manage booking cancel requests directly using their unique reference IDs.

---

## ● Future Improvements

1.  **Interactive Calendar Grid**: Build an interactive scheduling calendar on the frontend dashboard to display real-time slot availability, graying out pre-booked slots.
2.  **Email Notification Engine**: Integrate an email microservice (e.g., using Nodemailer and templates) to automatically send booking confirmations, reference IDs, and status changes directly to customer inboxes.
3.  **Flexible Slot Durations**: Dynamically calculate slot overlaps based on service durations instead of exact time matches.
4.  **Role-Based Access Control (RBAC)**: Differentiate administration roles (e.g., *Staff* who can manage bookings versus *Managers* who can manage service fees and remove records).
5.  **Automated Backups**: Create cron tasks within the Docker container stack to run pg_dump database backups at regular intervals.
