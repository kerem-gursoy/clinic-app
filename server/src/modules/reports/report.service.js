import { pool } from "../../db/pool.js";
import { getTopItems } from "../../utils/collections.js";

export async function queryDoctorMedicalRecords(doctorId, filters = {}) {
  const {
    patientName,
    diagnosis,
    dateFrom,
    dateTo,
    symptoms = [],
    medications = [],
  } = filters;

  let sqlQuery = `
    SELECT 
      a.appointment_id AS id,
      a.patient_id,
      CONCAT(p.patient_fname, ' ', p.patient_lname) AS patient_name,
      a.appointment_id,
      DATE(a.start_at) AS appointment_date,
      a.reason AS diagnosis,
      a.notes,
      a.doctor_id,
      CONCAT(d.doc_fname, ' ', d.doc_lname) AS doctor_name,
      a.start_at
    FROM appointment a
    LEFT JOIN patient p ON a.patient_id = p.patient_id
    LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
    WHERE a.doctor_id = ? AND a.status = 'completed'
  `;

  const params = [doctorId];

  if (patientName) {
    sqlQuery += " AND CONCAT(p.patient_fname, ' ', p.patient_lname) LIKE ?";
    params.push(`%${patientName}%`);
  }

  if (diagnosis) {
    sqlQuery += " AND a.reason LIKE ?";
    params.push(`%${diagnosis}%`);
  }

  if (dateFrom) {
    sqlQuery += " AND DATE(a.start_at) >= ?";
    params.push(dateFrom);
  }

  if (dateTo) {
    sqlQuery += " AND DATE(a.start_at) <= ?";
    params.push(dateTo);
  }

  sqlQuery += " ORDER BY a.start_at DESC LIMIT 100";

  const [rows] = await pool.query(sqlQuery, params);

  const records = rows.map((row) => {
    const mockData = generateMockMedicalData(row.diagnosis ?? "General consultation");

    return {
      id: `mr-${row.id}`,
      patientId: row.patient_id?.toString() ?? "",
      patientName: row.patient_name ?? "Unknown Patient",
      appointmentId: row.appointment_id?.toString() ?? "",
      date: row.appointment_date ?? row.start_at,
      diagnosis: row.diagnosis ?? "General consultation",
      symptoms: mockData.symptoms,
      treatment: mockData.treatment,
      medications: mockData.medications,
      notes: row.notes ?? "No additional notes",
      doctorId: row.doctor_id?.toString() ?? "",
      doctorName: row.doctor_name ?? "Unknown Doctor",
      filters: {
        symptoms,
        medications,
      },
    };
  });

  const diagnoses = records.map((record) => record.diagnosis);
  const allSymptoms = records.flatMap((record) => record.symptoms);
  const allMedications = records.flatMap((record) => record.medications.map((med) => med.name));
  const dates = records
    .map((record) => new Date(record.date))
    .filter((date) => !Number.isNaN(date.getTime()));

  const summary = {
    mostCommonDiagnosis: getTopItems(diagnoses, 5),
    mostCommonSymptoms: getTopItems(allSymptoms, 5),
    mostPrescribedMedications: getTopItems(allMedications, 5),
    dateRange: {
      earliest:
        dates.length > 0
          ? new Date(Math.min(...dates.map((d) => d.getTime()))).toISOString().split("T")[0]
          : null,
      latest:
        dates.length > 0
          ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString().split("T")[0]
          : null,
    },
  };

  return {
    query: filters,
    totalRecords: records.length,
    records,
    summary,
  };
}

function generateMockMedicalData(diagnosis) {
  const mockData = {
    hypertension: {
      symptoms: ["headache", "dizziness", "fatigue", "chest pain"],
      treatment: "Lifestyle modification, dietary changes, and antihypertensive medication",
      medications: [
        { name: "Lisinopril", dosage: "10mg", frequency: "Daily", duration: "30 days" },
        { name: "Hydrochlorothiazide", dosage: "25mg", frequency: "Daily", duration: "30 days" },
      ],
    },
    diabetes: {
      symptoms: ["increased thirst", "frequent urination", "blurred vision", "fatigue"],
      treatment: "Dietary counseling, exercise plan, and glucose management",
      medications: [{ name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "90 days" }],
    },
    bronchitis: {
      symptoms: ["cough", "fever", "chest congestion", "shortness of breath"],
      treatment: "Rest, fluids, and symptomatic treatment",
      medications: [
        { name: "Azithromycin", dosage: "250mg", frequency: "Daily", duration: "5 days" },
        { name: "Albuterol inhaler", dosage: "2 puffs", frequency: "As needed", duration: "30 days" },
      ],
    },
  };

  const key = Object.keys(mockData).find((condition) =>
    diagnosis.toLowerCase().includes(condition.toLowerCase())
  );

  if (key) {
    return mockData[key];
  }

  return {
    symptoms: ["general discomfort", "fatigue"],
    treatment: "Symptomatic treatment and follow-up as needed",
    medications: [{ name: "Acetaminophen", dosage: "500mg", frequency: "As needed", duration: "7 days" }],
  };
}

