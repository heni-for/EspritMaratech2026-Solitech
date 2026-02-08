# ASTBA - Training & Attendance Tracking

## Overview
Web application for Association Sciences and Technology Ben Arous to manage student training programs, track attendance, monitor progress, and generate certificates. Features role-based access control with 3 user types.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js REST API with session-based authentication
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend), Express (backend)
- **Auth**: express-session + connect-pg-simple + bcrypt

## Project Structure
- `client/src/pages/` - Login, Dashboard, Students, Trainings, Attendance, Certificates, TrainerDashboard, StudentDashboard, UserManagement
- `client/src/components/` - AppSidebar (role-aware), ThemeProvider, ThemeToggle, shadcn/ui components
- `client/src/hooks/use-auth.ts` - Authentication hook with login/logout/session management
- `server/` - Express server, routes (with auth middleware), storage layer, database connection, seed data
- `shared/schema.ts` - Drizzle schema definitions for all tables including users and trainerAssignments

## Data Model
- **Users**: Authentication accounts with role (admin/trainer/student), optional studentId link
- **Students**: Personal info (name, email, phone, guardian)
- **Trainings**: Training programs with 4 levels, 6 sessions per level (auto-created)
- **Enrollments**: Student-to-training associations
- **Attendance**: Per-session presence records
- **Certificates**: Issued upon completing all 4 levels of a training
- **TrainerAssignments**: Links trainer users to specific trainings

## Role-Based Access Control
- **Admin**: Full access to all features - dashboard with KPIs, student/training/attendance management, certificates, user management
- **Trainer**: View assigned trainings only, mark attendance for assigned trainings, view students
- **Student**: View own dashboard with progress, formations, and certificates only

## Demo Accounts
- admin / admin123 (Administrator)
- trainer1 / trainer123 (Trainer, assigned to Robotics & Web Dev)
- ahmed / student123 (Student, linked to Ahmed Ben Ali profile)

## Key Features
- Session-based authentication with role-based middleware (requireAuth, requireRole)
- Student CRUD and profile view with enrollment/attendance history
- Training management with auto-generated levels and sessions
- Attendance marking per session with bulk save
- Certificate generation for eligible students (completed all levels)
- Admin user management (create/edit users, assign roles, link trainers to trainings)
- Dark/light theme toggle
- Role-specific sidebar navigation

## Recent Changes
- 2026-02-06: Initial MVP build with all core features
- 2026-02-06: Added role-based access control with 3 user types (admin, trainer, student)
- 2026-02-06: Added trainer authorization checks for attendance routes
- 2026-02-06: Student-scoped access control on student profile endpoints
