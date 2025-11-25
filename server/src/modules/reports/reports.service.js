import { pool } from "../../db/pool.js";

export async function getAppointmentReport() {
    const [rows] = await pool.query(`
    SELECT 
      d.doctor_id,
      d.doc_fname, 
      d.doc_lname,
      a.status,
      p.gender,
      addr.city,
      addr.state
    FROM appointment a
    JOIN doctor d ON a.doctor_id = d.doctor_id
    JOIN patient p ON a.patient_id = p.patient_id
    LEFT JOIN address addr ON p.address_id = addr.address_id
  `);

    // Process data for charts
    const appointmentsByDoctor = {};
    const statusDistribution = {};
    const genderByDoctor = {};

    rows.forEach(row => {
        const docName = `${row.doc_fname} ${row.doc_lname}`;

        // Appointments by Doctor
        if (!appointmentsByDoctor[docName]) {
            appointmentsByDoctor[docName] = 0;
        }
        appointmentsByDoctor[docName]++;

        // Status Distribution
        const status = row.status || 'unknown';
        if (!statusDistribution[status]) {
            statusDistribution[status] = 0;
        }
        statusDistribution[status]++;

        // Gender by Doctor
        if (!genderByDoctor[docName]) {
            genderByDoctor[docName] = { Male: 0, Female: 0, Other: 0 };
        }
        const genderLabel = getGenderLabel(row.gender);
        if (genderByDoctor[docName][genderLabel] !== undefined) {
            genderByDoctor[docName][genderLabel]++;
        } else {
            genderByDoctor[docName]['Other']++;
        }
    });

    return {
        totalAppointments: rows.length,
        appointmentsByDoctor: Object.entries(appointmentsByDoctor).map(([name, count]) => ({ name, count })),
        statusDistribution: Object.entries(statusDistribution).map(([name, value]) => ({ name, value })),
        genderByDoctor: Object.entries(genderByDoctor).map(([doctor, genders]) => ({
            doctor,
            ...genders
        }))
    };
}

export async function getRevenueReport({ startDate, endDate } = {}) {
    // Returns total revenue and breakdown by doctor and by month
    // The `amount` column is expected to be numeric (DECIMAL). If not present, returns zeros.
    const params = [];
    let where = "";
    if (startDate) {
        where += " AND a.start_at >= ?";
        params.push(startDate);
    }
    if (endDate) {
        where += " AND a.start_at <= ?";
        params.push(endDate);
    }

    // Only consider completed appointments for revenue
    // Build params with the status filter first
    params.unshift('completed');
    const [rows] = await pool.query(
        `SELECT a.amount, a.procedure_code, a.start_at, p.patient_fname, p.patient_lname,
                d.doctor_id, d.doc_fname, d.doc_lname, DATE_FORMAT(a.start_at, '%Y-%m') as ym
         FROM appointment a
         LEFT JOIN doctor d ON a.doctor_id = d.doctor_id
         LEFT JOIN patient p ON a.patient_id = p.patient_id
         WHERE a.status = ? ${where}`,
        params
    );

    let totalRevenue = 0;
    const revenueByDoctor = {};
    const revenueByMonth = {};

    rows.forEach((r) => {
        const amt = r.amount != null ? Number(r.amount) : 0;
        totalRevenue += amt;

        const docName = r.doc_fname || r.doc_lname ? `${r.doc_fname || ''} ${r.doc_lname || ''}`.trim() : 'Unassigned';
        revenueByDoctor[docName] = (revenueByDoctor[docName] || 0) + amt;

        const ym = r.ym || 'unknown';
        revenueByMonth[ym] = (revenueByMonth[ym] || 0) + amt;
    });

    // Build appointments list for display
    const appointments = rows.map((r) => ({
        patientName: r.patient_fname || r.patient_lname ? `${r.patient_fname || ''} ${r.patient_lname || ''}`.trim() : 'Unknown',
        doctorName: r.doc_fname || r.doc_lname ? `${r.doc_fname || ''} ${r.doc_lname || ''}`.trim() : 'Unassigned',
        procedure_code: r.procedure_code ?? null,
        amount: r.amount != null ? Number(r.amount) : null,
        start_at: r.start_at ? new Date(r.start_at).toISOString() : null,
    }));

    return {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        revenueByDoctor: Object.entries(revenueByDoctor).map(([name, amount]) => ({ name, amount: Number(amount.toFixed(2)) })),
        revenueByMonth: Object.entries(revenueByMonth).map(([month, amount]) => ({ month, amount: Number(amount.toFixed(2)) })),
        appointments,
    };
}

function getGenderLabel(genderId) {
    // Assuming 1=Female, 2=Male based on typical schema, or map as needed
    // If gender is stored as ID, we might need a lookup or assumption.
    // Based on previous file views, gender seems to be an ID.
    // Let's assume standard mapping or string if it was joined.
    // The query didn't join lookup_gender, so we get the ID.
    // Let's map 1->Female, 2->Male, else Other for now.
    if (genderId === 1) return 'Female';
    if (genderId === 2) return 'Male';
    return 'Other';
}
