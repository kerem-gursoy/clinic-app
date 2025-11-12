import { createDoctor, createPatient, createStaff } from "./user.service.js";

export async function registerDoctor(req, res) {
  try {
    const result = await createDoctor(req.body ?? {});
    return res.status(201).json(result);
  } catch (err) {
    console.error("createDoctor failed", err);
    const status = typeof err?.statusCode === "number" ? err.statusCode : 500;
    return res.status(status).json({ error: status === 500 ? "Unable to create doctor" : err.message });
  }
}

export async function registerPatient(req, res) {
  try {
    const result = await createPatient(req.body ?? {});
    return res.status(201).json(result);
  } catch (err) {
    console.error("createPatient failed", err);
    return res.status(500).json({ error: "Unable to create patient" });
  }
}

export async function registerStaff(req, res) {
  try {
    const result = await createStaff(req.body ?? {});
    return res.status(201).json(result);
  } catch (err) {
    console.error("createStaff failed", err);
    return res.status(500).json({ error: "Unable to create staff" });
  }
}
