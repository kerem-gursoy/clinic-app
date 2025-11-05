import { queryDoctorMedicalRecords } from "./report.service.js";

export async function queryMedicalRecords(req, res) {
  const authUser = req.user;
  if (!authUser?.user_id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const report = await queryDoctorMedicalRecords(authUser.user_id, req.query ?? {});
    return res.json(report);
  } catch (err) {
    console.error("Medical records query error:", err);
    return res.status(500).json({ error: err?.message ?? "Failed to query medical records" });
  }
}

