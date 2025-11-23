import * as reportsService from "./reports.service.js";

export async function getAppointmentReport(req, res, next) {
    try {
        const data = await reportsService.getAppointmentReport();
        res.json(data);
    } catch (err) {
        next(err);
    }
}

export async function getRevenueReport(req, res, next) {
    try {
        const data = await reportsService.getRevenueReport();
        res.json(data);
    } catch (err) {
        next(err);
    }
}
