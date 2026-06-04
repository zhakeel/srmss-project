// Bus Management API calls
// Uses shared api.js instance — do NOT hardcode http://127.0.0.1:8000

import api from "./api";

export const getAllBuses = () => api.get("/buses/");
export const createBus = (data) => api.post("/buses/", data);
export const updateBus = (bus_id, data) => api.put(`/buses/${bus_id}`, data);
export const deactivateBus = (bus_id) => api.delete(`/buses/${bus_id}`);
