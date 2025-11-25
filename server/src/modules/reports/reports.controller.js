import * as reportsService from "./reports.service.js";

export async function getAppointmentReport(req, res, next) {
  try {
    const {
      dateFrom,
      dateTo,
      providerId,
      status,
      capacityThreshold,
    } = req.query;

    const data = await reportsService.getAppointmentReport({
      dateFrom,
      dateTo,
      providerId,
      status,
      capacityThreshold,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getRevenueReport(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportsService.getRevenueReport({ startDate, endDate });
    res.json(data);
  } catch (err) {
    next(err);
  }
}
