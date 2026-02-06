# ASTBA - Training & Attendance Tracking

## Overview
Web application for Association Sciences and Technology Ben Arous to manage student training programs, track attendance, monitor progress, and generate certificates.

## Architecture
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui components
- **Backend**: Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Routing**: wouter (frontend), Express (backend)

## Project Structure
- `client/src/pages/` - Dashboard, Students, Trainings, Attendance, Certificates pages
- `client/src/components/` - AppSidebar, ThemeProvider, ThemeToggle, shadcn/ui components
- `server/` - Express server, routes, storage layer, database connection, seed data
- `shared/schema.ts` - Drizzle schema definitions for all tables

## Data Model
- **Students**: Personal info (name, email, phone, guardian)
- **Trainings**: Training programs with 4 levels, 6 sessions per level (auto-created)
- **Enrollments**: Student-to-training associations
- **Attendance**: Per-session presence records
- **Certificates**: Issued upon completing all 4 levels of a training

## Key Features
- Student CRUD and profile view with enrollment/attendance history
- Training management with auto-generated levels and sessions
- Attendance marking per session with bulk save
- Certificate generation for eligible students (completed all levels)
- Dashboard with KPIs and training progress overview
- Dark/light theme toggle

## Recent Changes
- 2026-02-06: Initial MVP build with all core features
