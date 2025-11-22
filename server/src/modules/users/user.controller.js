import { createDoctor, createPatient, createStaff, deleteDoctor, findDoctorById, updateDoctor } from "./user.service.js";

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

export async function getDoctor(req, res) {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }
    
    const doctor = await findDoctorById(parseInt(doctorId));
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }
    
    return res.json({ doctor });
  } catch (err) {
    console.error("getDoctor failed", err);
    return res.status(500).json({ error: "Unable to fetch doctor" });
  }
}

export async function updateDoctorHandler(req, res) {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }
    
    const result = await updateDoctor(parseInt(doctorId), req.body ?? {});
    return res.json(result);
  } catch (err) {
    console.error("updateDoctor failed", err);
    const status = typeof err?.statusCode === "number" ? err.statusCode : 500;
    return res.status(status).json({ error: status === 500 ? "Unable to update doctor" : err.message });
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

export async function removeDoctor(req, res) {
  try {
    const { doctorId } = req.params;
    if (!doctorId) {
      return res.status(400).json({ error: "Doctor ID is required" });
    }
    const result = await deleteDoctor(parseInt(doctorId));
    return res.status(200).json(result);
  } catch (err) {
    console.error("deleteDoctor failed", err);
    const status = typeof err?.statusCode === "number" ? err.statusCode : 500;
    return res.status(status).json({ error: status === 500 ? "Unable to delete doctor" : err.message });
  }
}