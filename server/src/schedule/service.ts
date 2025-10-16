import * as model from "./model.js";

export async function list(filters: any) {
  // optional: normalize filters, add defaults, pagination
  return model.list(filters);
}
export async function getOne(id: number) { return model.getOne(id); }
export async function create(payload: any) {
  // optional: validate, check conflicts
  return model.create(payload);
}
export async function update(id: number, patch: any) {
  // enforce status transitions here if needed
  return model.update(id, patch);
}
export async function remove(id: number) { return model.remove(id); }