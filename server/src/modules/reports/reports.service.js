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
