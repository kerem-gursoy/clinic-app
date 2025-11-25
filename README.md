# Developer Documentation

## Link
- https://main.d3w4bg0wlypycu.amplifyapp.com
- https://clinicdb.online (sometimes)

## Quick Setup Guide
- Install dependencies: `npm install`, `npm install nodemailer`
- Start dev servers: `npm run dev`
- Environment: configure `.env.local` for the client and server `.env`/DB creds (MySQL)
- Database: ensure MySQL is running
- Production build: `npm run build` (client) and run server start script

## Tech Stack
- React + Node + MySQL

## Other Notes
- Uses workspaces: `client` and `server`
- Auth via JWT/local storage token; API requests include bearer token + cookies when applicable
- Logs/errors: check server console output for API errors
- See below for detailed API endpoints

## Data You Can Manage
- Appointments: create, view, filter, cancel/update status, assign/unassign provider, set reason/notes/times.
- Patients: staff can create; doctors/staff can view lists and profiles; patients can view their own. Patient creation (including self-signup) requires DOB and SSN.
- Doctors: admins/staff can create/list for scheduling and assignment.
- Staff: admin can create staff users; staff can manage scheduling.
- Patient files: patients can view uploaded documents in their files area.

## User Roles
- Admin: access to reports/insights and workspace management.
- Staff: manage patients, schedule/edit appointments, view providers.
- Doctor: view own appointments, view/filter patient lists and related insights.
- Patient: view/manage own appointments, profile, and files.

## Reports & Queries
- Staff/Admin: Appointment Insights report with filters (date/provider/status/capacity), KPIs, completion/cancel/no-show rates, lead time, provider load, heavy-day flags, status distribution, and appointments by doctor plus gender by doctor.
- Doctor: Patient list with filters (date range, age, medications, allergies) and summary charts; doctor appointments view with status/timing.
- Staff: Appointments list for scheduling and overview, patient search, and doctor directory to aid booking.


## API Documentation

### Authentication
-   `POST /auth/signup`: Patient self-signup (requires first/last name, email, password, DOB, SSN)
-   `POST /auth/login`: Authenticate a user and return a JWT.
-   `POST /auth/logout`: Clear the session.

### User Registration
-   `POST /doctors`: Register a new doctor.
-   `POST /patients`: Register a new patient.
-   `POST /staff`: Register a new staff member.

### Profile
-   `GET /me`: Get the currently logged-in user's profile.

### Appointments (General)
-   `GET /appointments`: List appointments (supports filtering).
-   `GET /appointments/:id`: Get details of a specific appointment.
-   `POST /appointments`: Create a new appointment.
-   `PUT /appointments/:id`: Update an appointment.
-   `DELETE /appointments/:id`: Cancel/Delete an appointment.

### Doctor Specific
-   `GET /doctor/appointments`: Get appointments for the logged-in doctor.
-   `GET /doctor/patients`: Get list of patients assigned to the logged-in doctor.
-   `GET /doctor/medical-records/query`: Query medical records (requires DOCTOR role).

### Patient Specific
-   `GET /patient/appointments`: Get appointments for the logged-in patient.
-   `GET /patient/profile`: Get the logged-in patient's full profile.
-   `PUT /patients/:id`: Update patient details.

### Staff Specific
-   `GET /staff/appointments`: Get all appointments (for clinic administration).
-   `GET /staff/patients`: List all patients.
-   `GET /staff/doctors`: List all doctors.
-   `POST /staff/patients`: Register a new patient (Staff override).
-   `PUT /staff/patients/:id`: Update any patient's details.
-   `GET /patients/search`: Search for patients (accessible to Staff and Doctors).
