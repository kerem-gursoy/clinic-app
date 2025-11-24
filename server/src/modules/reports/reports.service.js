import { pool } from "../../db/pool.js";

const DEFAULT_WINDOW_DAYS = 30;
const DEFAULT_CAPACITY_THRESHOLD = 4; // appointments per hour equivalent

export async function getAppointmentReport({
  dateFrom,
  dateTo,
  providerId,
  status,
  capacityThreshold,
} = {}) {
  const { start, end } = buildDateRange(dateFrom, dateTo);
  const windowMs = end.getTime() - start.getTime();
  const previousEnd = start;
  const previousStart = new Date(start.getTime() - windowMs);

  const normalizedStatus = normalizeStatus(status);
  const normalizedProvider = normalizeId(providerId);
  const threshold = normalizeNumber(capacityThreshold, DEFAULT_CAPACITY_THRESHOLD);

  const [currentRows, previousRows] = await Promise.all([
    queryAppointments({ start, end, providerId: normalizedProvider, status: normalizedStatus }),
    queryAppointments({
      start: previousStart,
      end: previousEnd,
      providerId: normalizedProvider,
      status: normalizedStatus,
    }),
  ]);

  const current = buildAggregates(currentRows, threshold);
  const previous = buildAggregates(previousRows, threshold);

  const deltas = {
    totalAppointments: current.totals.totalAppointments - previous.totals.totalAppointments,
    completionRate: current.totals.completionRate - previous.totals.completionRate,
    cancelRate: current.totals.cancelRate - previous.totals.cancelRate,
    noShowRate: current.totals.noShowRate - previous.totals.noShowRate,
    averageLeadTimeDays: current.totals.averageLeadTimeDays - previous.totals.averageLeadTimeDays,
  };

  return {
    range: { start: start.toISOString(), end: end.toISOString() },
    previousRange: { start: previousStart.toISOString(), end: previousEnd.toISOString() },
    totals: current.totals,
    previousTotals: previous.totals,
    deltas,
    appointmentsByDoctor: current.appointmentsByDoctor,
    statusDistribution: current.statusDistribution,
    genderByDoctor: current.genderByDoctor,
    providerLoad: current.providerLoad,
    heavyDays: current.heavyDays,
    filtersApplied: {
      dateFrom: start.toISOString(),
      dateTo: end.toISOString(),
      providerId: normalizedProvider,
      status: normalizedStatus,
      capacityThreshold: threshold,
    },
  };
}

async function queryAppointments({ start, end, providerId, status }) {
  let sql = `
    SELECT 
      a.appointment_id,
      a.doctor_id,
      a.patient_id,
      a.status,
      a.start_at,
      a.end_at,
      d.doc_fname,
      d.doc_lname,
      p.gender
    FROM appointment a
    LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
    LEFT JOIN patient p ON a.patient_id = p.patient_id
    WHERE a.start_at >= ? AND a.start_at <= ?
  `;

  const params = [start, end];

  if (providerId) {
    sql += " AND a.doctor_id = ?";
    params.push(providerId);
  }

  if (status && status !== "all") {
    sql += " AND a.status = ?";
    params.push(status);
  }

  const [rows] = await pool.query(sql, params);
  return rows;
}

function buildAggregates(rows, capacityThreshold) {
  const appointmentsByDoctor = {};
  const statusDistribution = {};
  const genderByDoctor = {};
  const loadByDoctor = {};
  const loadByDoctorDay = {};
  let completed = 0;
  let canceled = 0;
  let noShow = 0;
  let leadTimeDaysTotal = 0;
  let leadTimeCount = 0;

  rows.forEach((row) => {
    const docName = buildDoctorName(row.doc_fname, row.doc_lname);
    const statusKey = (row.status || "unknown").toLowerCase();

    // Appointments by doctor
    appointmentsByDoctor[docName] = (appointmentsByDoctor[docName] || 0) + 1;

    // Status distribution
    statusDistribution[statusKey] = (statusDistribution[statusKey] || 0) + 1;

    // Completion stats
    if (statusKey === "completed") completed += 1;
    if (statusKey === "canceled" || statusKey === "cancelled") canceled += 1;
    if (statusKey === "no_show" || statusKey === "no-show") noShow += 1;

    // Gender by doctor
    if (!genderByDoctor[docName]) {
      genderByDoctor[docName] = { Male: 0, Female: 0, Other: 0 };
    }
    const genderLabel = getGenderLabel(row.gender);
    genderByDoctor[docName][genderLabel] = (genderByDoctor[docName][genderLabel] || 0) + 1;

    // Lead time (distance from now to appointment start, future-only)
    if (row.start_at) {
      const startDate = new Date(row.start_at);
      const now = new Date();
      const leadMs = startDate.getTime() - now.getTime();
      if (leadMs > 0) {
        leadTimeDaysTotal += leadMs / (1000 * 60 * 60 * 24);
        leadTimeCount += 1;
      }
    }

    // Load calculations
    const durationMinutes = calculateDurationMinutes(row.start_at, row.end_at);
    const dateKey = buildDateKey(row.start_at);

    if (!loadByDoctor[docName]) {
      loadByDoctor[docName] = { minutes: 0, appointments: 0 };
    }
    loadByDoctor[docName].minutes += durationMinutes;
    loadByDoctor[docName].appointments += 1;

    if (dateKey) {
      const dayKey = `${docName}__${dateKey}`;
      if (!loadByDoctorDay[dayKey]) {
        loadByDoctorDay[dayKey] = { minutes: 0, appointments: 0, doctor: docName, date: dateKey };
      }
      loadByDoctorDay[dayKey].minutes += durationMinutes;
      loadByDoctorDay[dayKey].appointments += 1;
    }
  });

  const totalAppointments = rows.length;
  const completionRate = totalAppointments > 0 ? (completed / totalAppointments) * 100 : 0;
  const cancelRate = totalAppointments > 0 ? (canceled / totalAppointments) * 100 : 0;
  const noShowRate = totalAppointments > 0 ? (noShow / totalAppointments) * 100 : 0;
  const averageLeadTimeDays = leadTimeCount > 0 ? leadTimeDaysTotal / leadTimeCount : 0;

  const providerLoad = Object.entries(loadByDoctor).map(([doctor, meta]) => ({
    doctor,
    loadPerHour: meta.minutes / 60,
    appointments: meta.appointments,
    totalMinutes: meta.minutes,
  }));

  const heavyDays = Object.values(loadByDoctorDay)
    .filter((entry) => entry.minutes / 60 > capacityThreshold)
    .map((entry) => ({
      doctor: entry.doctor,
      date: entry.date,
      loadPerHour: entry.minutes / 60,
      appointments: entry.appointments,
      totalMinutes: entry.minutes,
    }));

  return {
    totals: {
      totalAppointments,
      completionRate,
      cancelRate,
      noShowRate,
      averageLeadTimeDays,
    },
    appointmentsByDoctor: Object.entries(appointmentsByDoctor).map(([name, count]) => ({ name, count })),
    statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
    genderByDoctor: Object.entries(genderByDoctor).map(([doctor, genders]) => ({
      doctor,
      ...genders,
    })),
    providerLoad,
    heavyDays,
  };
}

function buildDateRange(dateFrom, dateTo) {
  const end = dateTo ? new Date(dateTo) : new Date();
  const start = dateFrom ? new Date(dateFrom) : new Date(end.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const fallbackEnd = new Date();
    const fallbackStart = new Date(fallbackEnd.getTime() - DEFAULT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    return { start: fallbackStart, end: fallbackEnd };
  }
  return { start, end };
}

function buildDoctorName(first, last) {
  return [first, last].filter(Boolean).join(" ").trim() || "Unassigned";
}

function calculateDurationMinutes(startAt, endAt) {
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;
  if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    const diff = (end.getTime() - start.getTime()) / (1000 * 60);
    return diff > 0 ? diff : 30;
  }
  return 60;
}

function buildDateKey(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getGenderLabel(genderId) {
  if (genderId === 1) return "Female";
  if (genderId === 2) return "Male";
  if (genderId === "Female" || genderId === "Male") return genderId;
  return "Other";
}

function normalizeStatus(status) {
  if (!status || status === "all") return null;
  return String(status).toLowerCase();
}

function normalizeId(id) {
  if (!id || id === "all") return null;
  const num = Number(id);
  return Number.isNaN(num) ? null : num;
}

function normalizeNumber(value, fallback) {
  const num = Number(value);
  if (Number.isNaN(num) || num <= 0) return fallback;
  return num;
}
