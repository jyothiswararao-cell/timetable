# Dynamic Timetable Management System

An enterprise-grade, full-stack, AI-powered responsive web application to automatically generate conflict-free university timetables with intelligent workload balancing, real-time schedule optimization, and substitute teaching assignments.

## Technology Stack

- **Frontend**: React, Next.js (App Router), Tailwind CSS, Framer Motion, Chart.js, Axios, React Hook Form, Zod.
- **Backend**: Node.js, Express.js, Prisma ORM, JWT Authentication, bcrypt, Joi validation.
- **Database**: SQLite (default configuration for immediate local execution), PostgreSQL supported.

---

## Getting Started

### Prerequisites

- Node.js (v24 or higher recommended)
- NPM

### Backend Installation

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Sync the SQLite database schema and generate the Prisma Client:
   ```bash
   npx prisma db push
   ```
4. Seed the database with sample data (mock accounts, courses, and schedules):
   ```bash
   node prisma/seed.js
   ```
5. Start the API server in development mode:
   ```bash
   npm run dev
   ```
   The API will listen at `http://localhost:5000`.

### Frontend Installation

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open your browser and navigate to `http://localhost:3000`.

---

## Seed Accounts (Credentials)

Use the following profiles to test different role privileges in the system:

- **System Administrator Profile**:
  - **Email**: `admin@timetable.com`
  - **Password**: `admin123`
- **Faculty Profile (Dr. Alan Turing)**:
  - **Email**: `faculty@timetable.com`
  - **Password**: `faculty123`

---

## Swapping Database to PostgreSQL

To deploy with PostgreSQL:
1. In `backend/prisma/schema.prisma`, update the datasource provider block:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Update the `DATABASE_URL` in `backend/.env` to point to your running PostgreSQL instance:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/timetable_db?schema=public"
   ```
3. Re-run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
