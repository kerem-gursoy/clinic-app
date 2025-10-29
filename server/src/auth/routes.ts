import { Router, type NextFunction, type Request, type Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import argon2 from "argon2";
import type { RowDataPacket } from "mysql2/promise";
import { pool, createDoctor, createPatient, createStaff } from "../schedule/pool.js";


type UserRole = "PATIENT" | "DOCTOR" | "STAFF";

interface AuthTokenPayload extends JwtPayload {
  user_id: number;
  role: UserRole;
  email: string;
}

interface RequestWithUser extends Request {
  user?: AuthTokenPayload;
}

interface LoginRow extends RowDataPacket {
  user_id: number;
  email: string;
  password: string;
  role: UserRole;
}

interface PatientAppointment {
  appointment_id: number;
  patient_id: number;
  provider_id: number | null;
  providerName: string | null;
  reason: string | null;
  status: string | null;
  start_at: string | null;
  time: string | null;
  duration: number | null;
  notes?: string | null;
}

type AppointmentRow = RowDataPacket & {
  appointment_id?: number;
  patient_id?: number;
  doctor_id?: number | null;
  doc_fname?: string | null;
  doc_lname?: string | null;
  reason?: string | null;
  status?: string | null;
  start_at?: string | null;
  end_at?: string | null;
  time?: string | null;
  duration?: number | null;
  length_minutes?: number | null;
  notes?: string | null;
  patient_fname?: string | null;
  patient_lname?: string | null;
};

async function fetchPatientAppointments(patientId: number, limit = 50) {
  const normalizedLimit = Math.min(Math.max(limit, 1), 200);
  const [rows] = await pool.query<AppointmentRow[]>(
    `SELECT a.*, d.doc_fname, d.doc_lname
     FROM appointment a
     LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
     WHERE a.patient_id = ?
     ORDER BY a.start_at DESC
     LIMIT ?`,
    [patientId, normalizedLimit]
  );

  return rows.map((row) => ({
    appointment_id: row.appointment_id ?? 0,
    patient_id: row.patient_id ?? patientId,
    provider_id: row.doctor_id ?? null,
    providerName:
      [row.doc_fname, row.doc_lname]
        .filter((part) => !!part)
        .join(" ")
        .trim() || null,
    reason: row.reason ?? null,
    status: row.status ?? null,
    start_at: row.start_at ?? null,
    time: formatAppointmentTime(row.start_at ?? null),
    duration: calculateDuration(row.start_at ?? null, row.end_at ?? null),
    notes: row.notes ?? null,
  }));
}

interface DoctorAppointment {
  appointment_id: number;
  patient_id: number | null;
  provider_id: number;
  providerName: string | null;
  patientName: string | null;
  reason: string | null;
  status: string | null;
  start_at: string | null;
  time: string | null;
  duration: number | null;
  notes?: string | null;
}

async function fetchDoctorAppointments(doctorId: number, limit = 50): Promise<DoctorAppointment[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 200);
  const [rows] = await pool.query<AppointmentRow[]>(
    `SELECT a.*, p.patient_fname, p.patient_lname, d.doc_fname, d.doc_lname
     FROM appointment a
     LEFT JOIN patient p ON a.patient_id = p.patient_id
     LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
     WHERE a.doctor_id = ?
     ORDER BY a.start_at DESC
     LIMIT ?`,
    [doctorId, normalizedLimit]
  );

  return rows.map((row) => ({
    appointment_id: row.appointment_id ?? 0,
    patient_id: row.patient_id ?? null,
    provider_id: row.doctor_id ?? doctorId,
    providerName:
      [row.doc_fname, row.doc_lname]
        .filter((part) => !!part)
        .join(" ")
        .trim() || null,
    patientName:
      [row.patient_fname, row.patient_lname]
        .filter((part) => !!part)
        .join(" ")
        .trim() || null,
    reason: row.reason ?? null,
    status: row.status ?? null,
    start_at: row.start_at ?? null,
    time: formatAppointmentTime(row.start_at ?? null),
    duration: calculateDuration(row.start_at ?? null, row.end_at ?? null),
    notes: row.notes ?? null,
  }));
}

interface StaffAppointment {
  appointment_id: number;
  patient_id: number | null;
  doctor_id: number | null;
  patientName: string | null;
  doctorName: string | null;
  status: string | null;
  reason: string | null;
  start_at: string | null;
  time: string | null;
  duration: number | null;
  notes?: string | null;
}

async function fetchStaffAppointments(limit = 100): Promise<StaffAppointment[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 500);
  const [rows] = await pool.query<AppointmentRow[]>(
    `SELECT a.*, 
            p.patient_fname, p.patient_lname,
            d.doc_fname, d.doc_lname
     FROM appointment a
     LEFT JOIN patient p ON a.patient_id = p.patient_id
     LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
     ORDER BY a.start_at DESC
     LIMIT ?`,
    [normalizedLimit]
  );

  return rows.map((row) => ({
    appointment_id: row.appointment_id ?? 0,
    patient_id: row.patient_id ?? null,
    doctor_id: row.doctor_id ?? null,
    patientName:
      [row.patient_fname, row.patient_lname]
        .filter((part) => !!part)
        .join(" ")
        .trim() || null,
    doctorName:
      [row.doc_fname, row.doc_lname]
        .filter((part) => !!part)
        .join(" ")
        .trim() || null,
    status: row.status ?? null,
    reason: row.reason ?? null,
    start_at: row.start_at ?? null,
    time: formatAppointmentTime(row.start_at ?? null),
    duration: calculateDuration(row.start_at ?? null, row.end_at ?? null),
    notes: row.notes ?? null,
  }));
}

interface StaffPatient {
  patient_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  dob: string | null;
}

interface StaffDoctorInfo {
  doctor_id: number;
  name: string;
  specialty: string | null;
  email: string | null;
  phone: string | null;
}

async function fetchStaffPatients(limit = 200): Promise<StaffPatient[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 500);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT patient_id, patient_fname, patient_lname, patient_email, phone, dob
     FROM patient
     ORDER BY patient_fname ASC
     LIMIT ?`,
    [normalizedLimit]
  );

  return rows.map((row) => ({
    patient_id: Number(row.patient_id),
    name: [row.patient_fname, row.patient_lname].filter(Boolean).join(" ").trim(),
    email: row.patient_email ?? null,
    phone: row.phone ?? null,
    dob: row.dob ?? null,
  }));
}

async function fetchStaffDoctors(limit = 200): Promise<StaffDoctorInfo[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 500);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT doctor_id, doc_fname, doc_lname, email, phone
     FROM doctor
     ORDER BY doc_fname ASC
     LIMIT ?`,
    [normalizedLimit]
  );

  return rows.map((row) => ({
    doctor_id: Number(row.doctor_id),
    name: [row.doc_fname, row.doc_lname].filter(Boolean).join(" ").trim(),
    specialty: null, // No specialty column in current database schema
    email: row.email ?? null,
    phone: row.phone ?? null,
  }));
}

interface DoctorPatient {
  patient_id: number;
  name: string;
  email: string | null;
  phone: string | null;
  last_visit: string | null;
}

async function fetchDoctorPatients(doctorId: number, limit = 200): Promise<DoctorPatient[]> {
  const normalizedLimit = Math.min(Math.max(limit, 1), 500);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT p.patient_id,
            p.patient_fname,
            p.patient_lname,
            p.patient_email,
            p.phone,
            MAX(a.start_at) AS last_visit
     FROM appointment a
     JOIN patient p ON a.patient_id = p.patient_id
     WHERE a.doctor_id = ?
     GROUP BY p.patient_id, p.patient_fname, p.patient_lname, p.patient_email, p.phone
     ORDER BY last_visit DESC
     LIMIT ?`,
    [doctorId, normalizedLimit]
  );

  return rows.map((row) => ({
    patient_id: Number(row.patient_id),
    name: [row.patient_fname, row.patient_lname].filter(Boolean).join(" ").trim(),
    email: row.patient_email ?? null,
    phone: row.phone ?? null,
    last_visit: row.last_visit ?? null,
  }));
}

function formatAppointmentTime(date: string | null): string | null {
  if (!date) {
    return null;
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function calculateDuration(start: string | null, end: string | null): number | null {
  if (!start || !end) {
    return null;
  }
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return null;
  }
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)));
}


const router = Router();
function signToken(user: Pick<AuthTokenPayload, "user_id" | "role" | "email">) {
  return jwt.sign(user, getJwtSecret(), { expiresIn: "7d" });
}



export function requireAuth(req: RequestWithUser, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (!decoded || typeof decoded !== "object" || !("user_id" in decoded) || !("role" in decoded) || !("email" in decoded)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.user = decoded as AuthTokenPayload;
    return next();
  } catch (err) {
    console.warn("JWT verification failed", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: RequestWithUser, res: Response, next: NextFunction) => {

    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

router.post("/auth/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password" });
    }

    const [rows] = await pool.query<LoginRow[]>(
      "SELECT user_id, email, password, role FROM login WHERE email = ? LIMIT 1",
      [email]
    );

    if (!rows.length) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const row = rows[0];
    const passwordMatches = await argon2.verify(row.password, password);
    if (!passwordMatches) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = { user_id: row.user_id, role: row.role, email: row.email };
    
    // Fetch first name based on role
    let firstName: string | null = null;
    if (row.role === "PATIENT") {
      const [patientRows] = await pool.query<RowDataPacket[]>(
        "SELECT patient_fname FROM patient WHERE patient_id = ? LIMIT 1",
        [row.user_id]
      );
      firstName = patientRows[0]?.patient_fname ?? null;
    } else if (row.role === "DOCTOR") {
      const [doctorRows] = await pool.query<RowDataPacket[]>(
        "SELECT doc_fname FROM doctor WHERE doctor_id = ? LIMIT 1",
        [row.user_id]
      );
      firstName = doctorRows[0]?.doc_fname ?? null;
    } else if (row.role === "STAFF") {
      const [staffRows] = await pool.query<RowDataPacket[]>(
        "SELECT staff_first_name FROM staff WHERE staff_id = ? LIMIT 1",
        [row.user_id]
      );
      firstName = staffRows[0]?.staff_first_name ?? null;
    }

    const token = signToken(user);
    return res.json({ token, user: { ...user, first_name: firstName } });
  } catch (err) {
    console.error("Login failed", err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/logout", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Logged out" });
});

router.post("/doctors", async (req: Request, res: Response) => {
  try {
    const result = await createDoctor(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error("createDoctor failed", err);
    return res.status(500).json({ error: "Unable to create doctor" });
  }
});

router.post("/patients", async (req: Request, res: Response) => {
  try {
    const result = await createPatient(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error("createPatient failed", err);
    return res.status(500).json({ error: "Unable to create patient" });
  }
});

router.post("/staff", async (req: Request, res: Response) => {
  try {
    const result = await createStaff(req.body);
    return res.status(201).json(result);
  } catch (err) {
    console.error("createStaff failed", err);
    return res.status(500).json({ error: "Unable to create staff" });
  }
});

router.get("/patient/appointments", requireAuth, requireRole("PATIENT"), async (req: RequestWithUser, res: Response) => {
  const patientId = req.user?.user_id;
  if (!patientId) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 200);

  try {
    const appointments = await fetchPatientAppointments(patientId, limit);
    res.json({ appointments, limit });
  } catch (err: any) {
    console.error("patient/appointments error:", err);
    res.status(500).json({ error: err?.message || "Failed to load appointments" });
  }
});

router.get("/doctor/appointments", requireAuth, requireRole("DOCTOR"), async (req: RequestWithUser, res: Response) => {
  const doctorId = req.user?.user_id;
  if (!doctorId) return res.status(401).json({ error: "Unauthorized" });

  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "50"), 10) || 50, 1), 200);

  try {
    const appointments = await fetchDoctorAppointments(doctorId, limit);
    res.json({ appointments, limit });
  } catch (err: any) {
    console.error("doctor/appointments error:", err);
    res.status(500).json({ error: err?.message || "Failed to load appointments" });
  }
});

router.get("/staff/appointments", requireAuth, requireRole("STAFF"), async (req: RequestWithUser, res: Response) => {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "100"), 10) || 100, 1), 500);

  try {
    const appointments = await fetchStaffAppointments(limit);
    res.json({ appointments, limit });
  } catch (err: any) {
    console.error("staff/appointments error:", err);
    res.status(500).json({ error: err?.message || "Failed to load appointments" });
  }
});

router.get("/staff/patients", requireAuth, requireRole("STAFF"), async (_req: RequestWithUser, res: Response) => {
  try {
    const patients = await fetchStaffPatients();
    res.json({ patients });
  } catch (err: any) {
    console.error("staff/patients error:", err);
    res.status(500).json({ error: err?.message || "Failed to load patients" });
  }
});

router.get("/staff/doctors", requireAuth, requireRole("STAFF"), async (_req: RequestWithUser, res: Response) => {
  try {
    const doctors = await fetchStaffDoctors();
    res.json({ doctors });
  } catch (err: any) {
    console.error("staff/doctors error:", err);
    res.status(500).json({ error: err?.message || "Failed to load doctors" });
  }
});

// Search patients by name or email (staff and doctors)
router.get(
  "/patients/search",
  requireAuth,
  requireRole("STAFF", "DOCTOR"),
  async (req: RequestWithUser, res: Response) => {
    try {
      const q = String(req.query.q ?? "").trim();
      if (!q) return res.json({ patients: [] });

      const like = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
      const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "25"), 10) || 25, 1), 200);

      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT patient_id, patient_fname, patient_lname, patient_email FROM patient WHERE CONCAT(patient_fname, ' ', patient_lname) LIKE ? OR patient_email LIKE ? LIMIT ?`,
        [like, like, limit]
      );

      const patients = (rows as any[]).map((r) => ({
        patient_id: r.patient_id,
        patient_fname: r.patient_fname,
        patient_lname: r.patient_lname,
        patient_email: r.patient_email,
      }));

      return res.json({ patients });
    } catch (err: any) {
      console.error("patients/search error:", err);
      return res.status(500).json({ error: err?.message || "Server error" });
    }
  },
);

router.get("/doctor/patients", requireAuth, requireRole("DOCTOR"), async (req: RequestWithUser, res: Response) => {
  const doctorId = req.user?.user_id;
  if (!doctorId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const patients = await fetchDoctorPatients(doctorId);
    res.json({ patients });
  } catch (err: any) {
    console.error("doctor/patients error:", err);
    res.status(500).json({ error: err?.message || "Failed to load patients" });
  }
});



router.get("/me", requireAuth, async (req: RequestWithUser, res: Response) => {
  const { user } = req;
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { user_id, role, email } = user;

    if (role === "PATIENT") {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM patient WHERE patient_id = ? LIMIT 1",
        [user_id]
      );
      const appointments = await fetchPatientAppointments(user_id, 5);
      const firstName = rows[0]?.patient_fname ?? null;
      return res.json({ user: { user_id, role, email, first_name: firstName }, profile: rows[0] ?? null, appointments });
    }

    if (role === "DOCTOR") {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM doctor WHERE doctor_id = ? LIMIT 1",
        [user_id]
      );
      const appointments = await fetchDoctorAppointments(user_id, 5);
      const firstName = rows[0]?.doc_fname ?? null;
      return res.json({ user: { user_id, role, email, first_name: firstName }, profile: rows[0] ?? null, appointments });
    }

    if (role === "STAFF") {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT * FROM staff WHERE staff_id = ? LIMIT 1",
        [user_id]
      );
      const appointments = await fetchStaffAppointments(10);
      const firstName = rows[0]?.staff_first_name ?? null;
      return res.json({ user: { user_id, role, email, first_name: firstName }, profile: rows[0] ?? null, appointments });
    }

    return res.status(400).json({ error: "Unknown role" });
  } catch (err) {
    console.error("Fetching authenticated user failed", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// Medical Records Query Endpoint
router.get("/doctor/medical-records/query", requireAuth, requireRole("DOCTOR"), async (req: RequestWithUser, res: Response) => {
  const doctorId = req.user?.user_id;
  if (!doctorId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const {
      patientName,
      diagnosis,
      dateFrom,
      dateTo,
      symptoms = [],
      medications = []
    } = req.query;

    // Build base query for medical records from appointments and patient data
    let sqlQuery = `
      SELECT 
        a.appointment_id as id,
        a.patient_id,
        CONCAT(p.patient_fname, ' ', p.patient_lname) as patient_name,
        a.appointment_id,
        DATE(a.start_at) as appointment_date,
        a.reason as diagnosis,
        a.notes,
        a.doctor_id,
        CONCAT(d.doc_fname, ' ', d.doc_lname) as doctor_name,
        a.start_at
      FROM appointment a
      LEFT JOIN patient p ON a.patient_id = p.patient_id
      LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
      WHERE a.doctor_id = ? AND a.status = 'completed'
    `;

    const queryParams: any[] = [doctorId];

    // Add filters based on query parameters
    if (patientName) {
      sqlQuery += ` AND CONCAT(p.patient_fname, ' ', p.patient_lname) LIKE ?`;
      queryParams.push(`%${patientName}%`);
    }

    if (diagnosis) {
      sqlQuery += ` AND a.reason LIKE ?`;
      queryParams.push(`%${diagnosis}%`);
    }

    if (dateFrom) {
      sqlQuery += ` AND DATE(a.start_at) >= ?`;
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      sqlQuery += ` AND DATE(a.start_at) <= ?`;
      queryParams.push(dateTo);
    }

    sqlQuery += ` ORDER BY a.start_at DESC LIMIT 100`;

    const [records] = await pool.query<RowDataPacket[]>(sqlQuery, queryParams);

    // Transform the data and add mock medical details for demonstration
    const medicalRecords = records.map((record: any) => {
      // Generate mock symptoms and medications based on diagnosis
      const mockData = generateMockMedicalData(record.diagnosis || "General consultation");
      
      return {
        id: `mr-${record.id}`,
        patientId: record.patient_id?.toString() || "",
        patientName: record.patient_name || "Unknown Patient",
        appointmentId: record.appointment_id?.toString() || "",
        date: record.appointment_date || record.start_at,
        diagnosis: record.diagnosis || "General consultation",
        symptoms: mockData.symptoms,
        treatment: mockData.treatment,
        medications: mockData.medications,
        notes: record.notes || "No additional notes",
        doctorId: record.doctor_id?.toString() || "",
        doctorName: record.doctor_name || "Unknown Doctor"
      };
    });

    // Generate summary statistics
    const diagnoses = medicalRecords.map(r => r.diagnosis);
    const allSymptoms = medicalRecords.flatMap(r => r.symptoms);
    const allMedications = medicalRecords.flatMap(r => r.medications.map((m: any) => m.name));
    const dates = medicalRecords.map(r => new Date(r.date)).filter(d => !isNaN(d.getTime()));

    const summary = {
      mostCommonDiagnosis: getTopItems(diagnoses, 5),
      mostCommonSymptoms: getTopItems(allSymptoms, 5),
      mostPrescribedMedications: getTopItems(allMedications, 5),
      dateRange: {
        earliest: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0] : null,
        latest: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0] : null
      }
    };

    const report = {
      query: req.query,
      totalRecords: medicalRecords.length,
      records: medicalRecords,
      summary
    };

    return res.json(report);
  } catch (err: any) {
    console.error("Medical records query error:", err);
    return res.status(500).json({ error: err?.message || "Failed to query medical records" });
  }
});

function generateMockMedicalData(diagnosis: string) {
  const mockData: { [key: string]: any } = {
    "hypertension": {
      symptoms: ["headache", "dizziness", "fatigue", "chest pain"],
      treatment: "Lifestyle modification, dietary changes, and antihypertensive medication",
      medications: [
        { name: "Lisinopril", dosage: "10mg", frequency: "Daily", duration: "30 days" },
        { name: "Hydrochlorothiazide", dosage: "25mg", frequency: "Daily", duration: "30 days" }
      ]
    },
    "diabetes": {
      symptoms: ["increased thirst", "frequent urination", "blurred vision", "fatigue"],
      treatment: "Dietary counseling, exercise plan, and glucose management",
      medications: [
        { name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "90 days" }
      ]
    },
    "bronchitis": {
      symptoms: ["cough", "fever", "chest congestion", "shortness of breath"],
      treatment: "Rest, fluids, and symptomatic treatment",
      medications: [
        { name: "Azithromycin", dosage: "250mg", frequency: "Daily", duration: "5 days" },
        { name: "Albuterol inhaler", dosage: "2 puffs", frequency: "As needed", duration: "30 days" }
      ]
    }
  };

  // Find matching condition or return default
  const key = Object.keys(mockData).find(k => 
    diagnosis.toLowerCase().includes(k.toLowerCase())
  );

  if (key) {
    return mockData[key];
  }

  // Default mock data
  return {
    symptoms: ["general discomfort", "fatigue"],
    treatment: "Symptomatic treatment and follow-up as needed",
    medications: [
      { name: "Acetaminophen", dosage: "500mg", frequency: "As needed", duration: "7 days" }
    ]
  };
}

function getTopItems(items: string[], limit: number): string[] {
  const counts: { [key: string]: number } = {};
  items.forEach(item => {
    const normalized = item.toLowerCase().trim();
    counts[normalized] = (counts[normalized] || 0) + 1;
  });

  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([item]) => item);
}

export default router;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not configured.");
  }
  return secret;
}
