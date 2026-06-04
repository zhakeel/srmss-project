import { useState, useEffect } from "react";
import {
  getAllFuelLogs, createFuelLog, updateFuelLog, deleteFuelLog,
  getAllMaintenance, createMaintenance, updateMaintenance, deleteMaintenance,
} from "../services/fuelMaintenanceService";
import { getAllBuses } from "../services/busService";

const EMPTY_FUEL = {
  bus_id: "",
  fuel_date: "",
  liters: "",
  cost: "",
  odometer_reading: "",
};

const EMPTY_MAINT = {
  bus_id: "",
  maintenance_type: "",
  maintenance_date: "",
  description: "",
  cost: "",
  next_service_date: "",
};

// Returns true if next_service_date is within 7 days from today
const isUpcomingSoon = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diffDays = (target - today) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
};

export default function FuelMaintenance() {
  const [activeTab, setActiveTab] = useState("fuel");

  const [buses, setBuses] = useState([]);

  // Fuel state
  const [fuelLogs, setFuelLogs] = useState([]);
  const [fuelForm, setFuelForm] = useState(EMPTY_FUEL);
  const [editingFuelId, setEditingFuelId] = useState(null);

  // Maintenance state
  const [maintLogs, setMaintLogs] = useState([]);
  const [maintForm, setMaintForm] = useState(EMPTY_MAINT);
  const [editingMaintId, setEditingMaintId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchBuses();
    fetchFuelLogs();
    fetchMaintLogs();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await getAllBuses();
      setBuses(res.data);
    } catch { /* silent — buses list is optional helper */ }
  };

  const fetchFuelLogs = async () => {
    try {
      const res = await getAllFuelLogs();
      setFuelLogs(res.data);
    } catch {
      showMessage("Failed to load fuel logs.", true);
    }
  };

  const fetchMaintLogs = async () => {
    try {
      const res = await getAllMaintenance();
      setMaintLogs(res.data);
    } catch {
      showMessage("Failed to load maintenance logs.", true);
    }
  };

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 3000);
  };

  // Helper: get registration no from bus_id
  const getBusReg = (bus_id) => {
    const bus = buses.find((b) => b.bus_id === Number(bus_id));
    return bus ? bus.registration_no : `Bus #${bus_id}`;
  };

  // ── FUEL HANDLERS ──────────────────────────────────────────────────

  const handleFuelChange = (e) =>
    setFuelForm({ ...fuelForm, [e.target.name]: e.target.value });

  const handleFuelSubmit = async () => {
    if (!fuelForm.bus_id)   { showMessage("Please select a bus.", true); return; }
    if (!fuelForm.fuel_date){ showMessage("Fuel date is required.", true); return; }
    if (!fuelForm.liters || Number(fuelForm.liters) <= 0) {
      showMessage("Litres must be a positive number.", true); return;
    }
    try {
      setLoading(true);
      if (editingFuelId) {
        await updateFuelLog(editingFuelId, fuelForm);
        showMessage("Fuel log updated.");
      } else {
        await createFuelLog(fuelForm);
        showMessage("Fuel log added.");
      }
      setFuelForm(EMPTY_FUEL);
      setEditingFuelId(null);
      fetchFuelLogs();
    } catch {
      showMessage("Operation failed. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleFuelEdit = (log) => {
    setEditingFuelId(log.fuel_id);
    setFuelForm({
      bus_id:           log.bus_id,
      fuel_date:        log.fuel_date ? String(log.fuel_date).slice(0, 10) : "",
      liters:           log.liters,
      cost:             log.cost,
      odometer_reading: log.odometer_reading,
    });
  };

  const handleFuelDelete = async (id) => {
    if (!window.confirm("Delete this fuel log?")) return;
    try {
      await deleteFuelLog(id);
      showMessage("Fuel log deleted.");
      fetchFuelLogs();
    } catch {
      showMessage("Delete failed.", true);
    }
  };

  // ── MAINTENANCE HANDLERS ───────────────────────────────────────────

  const handleMaintChange = (e) =>
    setMaintForm({ ...maintForm, [e.target.name]: e.target.value });

  const handleMaintSubmit = async () => {
    if (!maintForm.bus_id) { showMessage("Please select a bus.", true); return; }
    if (!maintForm.maintenance_type.trim()) {
      showMessage("Maintenance type is required.", true); return;
    }
    if (!maintForm.maintenance_date) {
      showMessage("Maintenance date is required.", true); return;
    }
    try {
      setLoading(true);
      if (editingMaintId) {
        await updateMaintenance(editingMaintId, maintForm);
        showMessage("Maintenance record updated.");
      } else {
        await createMaintenance(maintForm);
        showMessage("Maintenance record added.");
      }
      setMaintForm(EMPTY_MAINT);
      setEditingMaintId(null);
      fetchMaintLogs();
    } catch {
      showMessage("Operation failed. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleMaintEdit = (log) => {
    setEditingMaintId(log.maintenance_id);
    setMaintForm({
      bus_id:            log.bus_id,
      maintenance_type:  log.maintenance_type,
      maintenance_date:  log.maintenance_date ? String(log.maintenance_date).slice(0, 10) : "",
      description:       log.description || "",
      cost:              log.cost,
      next_service_date: log.next_service_date ? String(log.next_service_date).slice(0, 10) : "",
    });
  };

  const handleMaintDelete = async (id) => {
    if (!window.confirm("Delete this maintenance record?")) return;
    try {
      await deleteMaintenance(id);
      showMessage("Maintenance record deleted.");
      fetchMaintLogs();
    } catch {
      showMessage("Delete failed.", true);
    }
  };

  // ── RENDER ─────────────────────────────────────────────────────────

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>⛽ Fuel & Maintenance Log</h2>

      {error   && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {/* Tabs */}
      <div style={styles.tabBar}>
        <button
          style={activeTab === "fuel" ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab("fuel")}
        >
          Fuel Logs
        </button>
        <button
          style={activeTab === "maintenance" ? styles.tabActive : styles.tabInactive}
          onClick={() => setActiveTab("maintenance")}
        >
          Maintenance Logs
        </button>
      </div>

      {/* ══ FUEL TAB ══════════════════════════════════════════════════ */}
      {activeTab === "fuel" && (
        <>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              {editingFuelId ? "Edit Fuel Log" : "Add Fuel Log"}
            </h3>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bus *</label>
                <select style={styles.input} name="bus_id" value={fuelForm.bus_id} onChange={handleFuelChange}>
                  <option value="">-- Select Bus --</option>
                  {buses.map((b) => (
                    <option key={b.bus_id} value={b.bus_id}>
                      {b.registration_no}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Fuel Date *</label>
                <input style={styles.input} type="date" name="fuel_date" value={fuelForm.fuel_date} onChange={handleFuelChange} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Litres *</label>
                <input style={styles.input} type="number" min="0" step="0.01" name="liters" value={fuelForm.liters} onChange={handleFuelChange} placeholder="e.g. 40" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cost (LKR)</label>
                <input style={styles.input} type="number" min="0" step="0.01" name="cost" value={fuelForm.cost} onChange={handleFuelChange} placeholder="e.g. 8000" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Odometer (km)</label>
                <input style={styles.input} type="number" min="0" name="odometer_reading" value={fuelForm.odometer_reading} onChange={handleFuelChange} placeholder="e.g. 45000" />
              </div>
            </div>
            <div style={styles.btnRow}>
              <button style={styles.btnPrimary} onClick={handleFuelSubmit} disabled={loading}>
                {loading ? "Saving..." : editingFuelId ? "Update Log" : "Add Log"}
              </button>
              {editingFuelId && (
                <button style={styles.btnSecondary} onClick={() => { setFuelForm(EMPTY_FUEL); setEditingFuelId(null); }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>All Fuel Logs ({fuelLogs.length})</h3>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Bus</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Litres</th>
                    <th style={styles.th}>Cost (LKR)</th>
                    <th style={styles.th}>Odometer (km)</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, textAlign: "center", color: "#888" }}>
                        No fuel logs found.
                      </td>
                    </tr>
                  ) : (
                    fuelLogs.map((log, i) => (
                      <tr key={log.fuel_id} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                        <td style={styles.td}>{log.fuel_id}</td>
                        <td style={styles.td}>{getBusReg(log.bus_id)}</td>
                        <td style={styles.td}>{String(log.fuel_date).slice(0, 10)}</td>
                        <td style={styles.td}>{log.liters}</td>
                        <td style={styles.td}>{log.cost}</td>
                        <td style={styles.td}>{log.odometer_reading}</td>
                        <td style={styles.td}>
                          <button style={styles.btnEdit} onClick={() => handleFuelEdit(log)}>Edit</button>
                          <button style={styles.btnDelete} onClick={() => handleFuelDelete(log.fuel_id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ══ MAINTENANCE TAB ══════════════════════════════════════════ */}
      {activeTab === "maintenance" && (
        <>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              {editingMaintId ? "Edit Maintenance Record" : "Add Maintenance Record"}
            </h3>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bus *</label>
                <select style={styles.input} name="bus_id" value={maintForm.bus_id} onChange={handleMaintChange}>
                  <option value="">-- Select Bus --</option>
                  {buses.map((b) => (
                    <option key={b.bus_id} value={b.bus_id}>
                      {b.registration_no}
                    </option>
                  ))}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Maintenance Type *</label>
                <input style={styles.input} name="maintenance_type" value={maintForm.maintenance_type} onChange={handleMaintChange} placeholder="e.g. Oil Change" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Maintenance Date *</label>
                <input style={styles.input} type="date" name="maintenance_date" value={maintForm.maintenance_date} onChange={handleMaintChange} />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Cost (LKR)</label>
                <input style={styles.input} type="number" min="0" step="0.01" name="cost" value={maintForm.cost} onChange={handleMaintChange} placeholder="e.g. 3500" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Next Service Date</label>
                <input style={styles.input} type="date" name="next_service_date" value={maintForm.next_service_date} onChange={handleMaintChange} />
              </div>
              <div style={{ ...styles.formGroup, gridColumn: "1 / -1" }}>
                <label style={styles.label}>Description</label>
                <textarea
                  style={{ ...styles.input, minHeight: "70px", resize: "vertical" }}
                  name="description"
                  value={maintForm.description}
                  onChange={handleMaintChange}
                  placeholder="Details of work done..."
                />
              </div>
            </div>
            <div style={styles.btnRow}>
              <button style={styles.btnPrimary} onClick={handleMaintSubmit} disabled={loading}>
                {loading ? "Saving..." : editingMaintId ? "Update Record" : "Add Record"}
              </button>
              {editingMaintId && (
                <button style={styles.btnSecondary} onClick={() => { setMaintForm(EMPTY_MAINT); setEditingMaintId(null); }}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              All Maintenance Records ({maintLogs.length})
            </h3>
            {/* Amber highlight reminder */}
            <p style={styles.hint}>
              ⚠️ Rows highlighted in amber have a service due within 7 days.
            </p>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.thead}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Bus</th>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Cost (LKR)</th>
                    <th style={styles.th}>Next Service</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {maintLogs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ ...styles.td, textAlign: "center", color: "#888" }}>
                        No maintenance records found.
                      </td>
                    </tr>
                  ) : (
                    maintLogs.map((log, i) => {
                      const soon = isUpcomingSoon(log.next_service_date);
                      const rowStyle = soon
                        ? styles.trUpcoming
                        : i % 2 === 0 ? styles.trEven : styles.trOdd;
                      return (
                        <tr key={log.maintenance_id} style={rowStyle}>
                          <td style={styles.td}>{log.maintenance_id}</td>
                          <td style={styles.td}>{getBusReg(log.bus_id)}</td>
                          <td style={styles.td}>{log.maintenance_type}</td>
                          <td style={styles.td}>{String(log.maintenance_date).slice(0, 10)}</td>
                          <td style={styles.td}>{log.cost}</td>
                          <td style={styles.td}>
                            {log.next_service_date
                              ? String(log.next_service_date).slice(0, 10)
                              : "—"}
                            {soon && (
                              <span style={styles.dueSoonBadge}>Due Soon</span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <button style={styles.btnEdit} onClick={() => handleMaintEdit(log)}>Edit</button>
                            <button style={styles.btnDelete} onClick={() => handleMaintDelete(log.maintenance_id)}>Delete</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page:         { padding: "24px", fontFamily: "Segoe UI, sans-serif" },
  title:        { fontSize: "22px", fontWeight: "700", marginBottom: "20px", color: "#1a3c5e" },
  tabBar:       { display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "2px solid #2E75B6" },
  tabActive:    { background: "#2E75B6", color: "#fff", border: "none", padding: "9px 24px", borderRadius: "6px 6px 0 0", cursor: "pointer", fontWeight: "700", fontSize: "14px" },
  tabInactive:  { background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", padding: "9px 24px", borderRadius: "6px 6px 0 0", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  card:         { background: "#fff", borderRadius: "8px", padding: "20px", marginBottom: "24px", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", border: "1px solid #e5e7eb" },
  cardTitle:    { fontSize: "16px", fontWeight: "600", color: "#1a3c5e", marginBottom: "16px", borderBottom: "2px solid #2E75B6", paddingBottom: "8px" },
  formGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "16px" },
  formGroup:    { display: "flex", flexDirection: "column" },
  label:        { fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" },
  input:        { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: "6px", fontSize: "14px" },
  btnRow:       { display: "flex", gap: "10px" },
  btnPrimary:   { background: "#2E75B6", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  btnSecondary: { background: "#6b7280", color: "#fff", border: "none", padding: "9px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "14px" },
  tableWrapper: { overflowX: "auto" },
  table:        { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  thead:        { background: "#1a3c5e" },
  th:           { padding: "10px 14px", textAlign: "left", color: "#fff", fontWeight: "600", whiteSpace: "nowrap" },
  td:           { padding: "10px 14px", borderBottom: "1px solid #e5e7eb" },
  trEven:       { background: "#fff" },
  trOdd:        { background: "#f8fafc" },
  trUpcoming:   { background: "#fef3c7" },
  dueSoonBadge: { background: "#f59e0b", color: "#fff", padding: "1px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: "700", marginLeft: "6px" },
  btnEdit:      { background: "#f59e0b", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", marginRight: "6px", fontWeight: "600" },
  btnDelete:    { background: "#ef4444", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  hint:         { fontSize: "13px", color: "#92400e", background: "#fef3c7", padding: "6px 12px", borderRadius: "4px", marginBottom: "12px" },
  errorBox:     { background: "#fee2e2", color: "#991b1b", padding: "10px 16px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" },
  successBox:   { background: "#d1fae5", color: "#065f46", padding: "10px 16px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" },
};
