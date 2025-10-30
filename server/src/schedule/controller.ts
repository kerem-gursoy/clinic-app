import { Request, Response, NextFunction } from "express";
import * as model from "./model.js";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await model.list(req.query);
    res.json({ appointments: items });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const item = await model.getOne(id);
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json({ appointment: item });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body;

    // payload should include: patientId, providerId, start (ISO string), end (ISO string), reason, status
    if (!payload || !payload.patientId || !payload.start || !payload.end) {
      return res.status(400).json({ error: "Missing required appointment fields" });
    }

    const id = await model.create({
      patientId: Number(payload.patientId),
      providerId: payload.providerId ? Number(payload.providerId) : null,
      start: payload.start,
      end: payload.end,
      reason: payload.reason ?? null,
      status: payload.status ?? "scheduled",
    });

    return res.status(201).json({ id });
  } catch (err: any) {
    console.error("Appointment creation error:", err);
    return res.status(500).json({ error: err?.message || "Failed to create appointment" });
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const patch = req.body;
    await model.update(id, patch);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    await model.remove(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
