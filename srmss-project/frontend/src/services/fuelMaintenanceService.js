// Fuel Log and Maintenance Log API calls
// Uses shared api.js instance — do NOT hardcode http://127.0.0.1:8000

import api from "./api";

// ── Fuel Logs ────────────────────────────────────────────────────────
export const getAllFuelLogs = () => api.get("/fuel-logs");
export const createFuelLog = (data) => api.post("/fuel-logs", data);
export const updateFuelLog = (fuel_id, data) => api.put(`/fuel-logs/${fuel_id}`, data);
export const deleteFuelLog = (fuel_id) => api.delete(`/fuel-logs/${fuel_id}`);

// ── Maintenance Logs ─────────────────────────────────────────────────
export const getAllMaintenance = () => api.get("/maintenance");
export const createMaintenance = (data) => api.post("/maintenance", data);
export const updateMaintenance = (maintenance_id, data) => api.put(`/maintenance/${maintenance_id}`, data);
export const deleteMaintenance = (maintenance_id) => api.delete(`/maintenance/${maintenance_id}`);
