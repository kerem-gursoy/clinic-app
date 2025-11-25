import * as appointmentService from "./appointment.service.js";

export async function listAppointments(req, res, next) {
  try {
    const items = await appointmentService.listAppointments(req.query);
    res.json({ appointments: items });
  } catch (err) {
    next(err);
  }
}

export async function getAppointment(req, res, next) {
  try {
    const id = Number(req.params.id);
    const item = await appointmentService.getAppointmentById(id);

    if (!item) {
      return res.status(404).json({ error: "Not found" });
    }

    return res.json({ appointment: item });
  } catch (err) {
    return next(err);
  }
}

export async function createAppointment(req, res, next) {
  try {
    const payload = req.body ?? {};

    if (!payload.patientId || !payload.start || !payload.end) {
      return res.status(400).json({ error: "Missing required appointment fields" });
    }

    const appointmentId = await appointmentService.createAppointment({
      patientId: Number(payload.patientId),
      providerId: payload.providerId ? Number(payload.providerId) : null,
      start: payload.start,
      end: payload.end,
      reason: payload.reason ?? null,
      status: payload.status ?? "scheduled",
      procedureCode: payload.procedureCode ?? null,
      amount: payload.amount ?? null,
    });

    return res.status(201).json({ id: appointmentId });
  } catch (err) {
    console.error("Appointment creation error:", err);
    const status = err && err.status ? err.status : 500;
    return res.status(status).json({ error: err?.message ?? "Failed to create appointment" });
  }
}

export async function updateAppointment(req, res, next) {
    try {
        const id = Number(req.params.id);
        const patch = req.body ?? {};

        // Validate at least one known updatable field exists
        const updatable = ["status", "reason"];
        const hasUpdate = updatable.some((k) => Object.prototype.hasOwnProperty.call(patch, k));
        if (!hasUpdate) {
            return res.status(400).json({ error: "No updatable fields provided" });
        }

        await appointmentService.updateAppointment(id, patch);
        res.status(204).end();
    } catch (err) {
        next(err);
    }
}


export async function deleteAppointment(req, res, next) {
  try {
    const id = Number(req.params.id);
    await appointmentService.removeAppointment(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

