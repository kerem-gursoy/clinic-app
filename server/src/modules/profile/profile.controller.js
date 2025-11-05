import {
  getRecentDoctorAppointments,
  getRecentPatientAppointments,
  getRecentStaffAppointments,
} from "../appointments/appointment.service.js";
import {
  findDoctorById,
  findPatientById,
  findStaffById,
} from "../users/user.service.js";

export async function getCurrentUser(req, res) {
  const authUser = req.user;
  if (!authUser) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { user_id: userId, role, email } = authUser;

  try {
    if (role === "PATIENT") {
      const [profile, appointments] = await Promise.all([
        findPatientById(userId),
        getRecentPatientAppointments(userId, { limit: 5 }),
      ]);
      const firstName = profile?.patient_fname ?? null;
      return res.json({
        user: { user_id: userId, role, email, first_name: firstName },
        profile: profile ?? null,
        appointments,
      });
    }

    if (role === "DOCTOR") {
      const [profile, appointments] = await Promise.all([
        findDoctorById(userId),
        getRecentDoctorAppointments(userId, { limit: 5 }),
      ]);
      const firstName = profile?.doc_fname ?? null;
      return res.json({
        user: { user_id: userId, role, email, first_name: firstName },
        profile: profile ?? null,
        appointments,
      });
    }

    if (role === "STAFF") {
      const [profile, appointments] = await Promise.all([
        findStaffById(userId),
        getRecentStaffAppointments({ limit: 10 }),
      ]);
      const firstName = profile?.staff_first_name ?? null;
      return res.json({
        user: { user_id: userId, role, email, first_name: firstName },
        profile: profile ?? null,
        appointments,
      });
    }

    return res.status(400).json({ error: "Unknown role" });
  } catch (err) {
    console.error("Fetching authenticated user failed", err);
    return res.status(500).json({ error: "Server error" });
  }
}

