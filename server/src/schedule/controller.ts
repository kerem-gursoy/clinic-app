import { Request, Response, NextFunction } from "express";

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({ message: "List schedules" });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    res.json({ message: `Get schedule ${id}` });
  } catch (err) {
    next(err);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = req.body;
    res.status(201).json({ created: payload });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const patch = req.body;
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
