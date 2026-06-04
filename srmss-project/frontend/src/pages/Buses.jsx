import { useState, useEffect } from "react";
import { getAllBuses, createBus, updateBus, deactivateBus } from "../services/busService";

// Status options agreed by the team — do NOT use "Active"
const STATUS_OPTIONS = ["Available", "Assigned", "Maintenance", "Inactive"];
const SERVICE_OPTIONS = ["Normal", "Express"];

const EMPTY_FORM = {
  registration_no: "",
  capacity: "",
  mileage: "",
  service_type: "Normal",
  status: "Available",
};

export default function Buses() {
  const [buses, setBuses] = useState([]);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null); // null = add mode
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load buses when page opens
  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      const res = await getAllBuses();
      setBuses(res.data);
    } catch {
      showMessage("Failed to load buses.", true);
    }
  };

  const showMessage = (msg, isError = false) => {
    if (isError) setError(msg);
    else setSuccess(msg);
    setTimeout(() => { setError(""); setSuccess(""); }, 3000);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Validate form before submit
  const validate = () => {
    if (!formData.registration_no.trim()) {
      showMessage("Registration number is required.", true);
      return false;
    }
    if (!formData.capacity || Number(formData.capacity) <= 0) {
      showMessage("Capacity must be a positive number.", true);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setLoading(true);
      if (editingId) {
        await updateBus(editingId, formData);
        showMessage("Bus updated successfully.");
      } else {
        await createBus(formData);
        showMessage("Bus added successfully.");
      }
      setFormData(EMPTY_FORM);
      setEditingId(null);
      fetchBuses();
    } catch {
      showMessage("Operation failed. Please try again.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bus) => {
    setEditingId(bus.bus_id);
    setFormData({
      registration_no: bus.registration_no,
      capacity: bus.capacity,
      mileage: bus.mileage,
      service_type: bus.service_type,
      status: bus.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Deactivate sets status = Inactive in the database (no hard delete)
  const handleDeactivate = async (bus) => {
    if (!window.confirm(`Deactivate bus ${bus.registration_no}?`)) return;
    try {
      await deactivateBus(bus.bus_id);
      showMessage(`Bus ${bus.registration_no} deactivated.`);
      fetchBuses();
    } catch {
      showMessage("Deactivate failed.", true);
    }
  };

  const handleCancel = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  // Badge colour per status
  const statusStyle = (status) => {
    const map = {
      Available:   { background: "#d1fae5", color: "#065f46" },
      Assigned:    { background: "#dbeafe", color: "#1e40af" },
      Maintenance: { background: "#fef3c7", color: "#92400e" },
      Inactive:    { background: "#fee2e2", color: "#991b1b" },
    };
    return { ...styles.badge, ...(map[status] || {}) };
  };

  return (
    <div style={styles.page}>
      <h2 style={styles.title}>🚌 Bus Management</h2>

      {error   && <div style={styles.errorBox}>{error}</div>}
      {success && <div style={styles.successBox}>{success}</div>}

      {/* ── Add / Edit Form ── */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>
          {editingId ? "Edit Bus" : "Add New Bus"}
        </h3>
        <div style={styles.formGrid}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Registration No *</label>
            <input
              style={styles.input}
              name="registration_no"
              value={formData.registration_no}
              onChange={handleChange}
              placeholder="e.g. NB-1234"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Capacity *</label>
            <input
              style={styles.input}
              name="capacity"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={handleChange}
              placeholder="e.g. 42"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Mileage (km)</label>
            <input
              style={styles.input}
              name="mileage"
              type="number"
              min="0"
              value={formData.mileage}
              onChange={handleChange}
              placeholder="e.g. 12000"
            />
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Service Type</label>
            <select style={styles.input} name="service_type" value={formData.service_type} onChange={handleChange}>
              {SERVICE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
          <div style={styles.formGroup}>
            <label style={styles.label}>Status</label>
            <select style={styles.input} name="status" value={formData.status} onChange={handleChange}>
              {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
        <div style={styles.btnRow}>
          <button style={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : editingId ? "Update Bus" : "Add Bus"}
          </button>
          {editingId && (
            <button style={styles.btnSecondary} onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ── Bus Table ── */}
      <div style={styles.card}>
        <h3 style={styles.cardTitle}>All Buses ({buses.length})</h3>
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>Registration No</th>
                <th style={styles.th}>Capacity</th>
                <th style={styles.th}>Mileage (km)</th>
                <th style={styles.th}>Service Type</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ ...styles.td, textAlign: "center", color: "#888" }}>
                    No buses found.
                  </td>
                </tr>
              ) : (
                buses.map((bus, i) => (
                  <tr key={bus.bus_id} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                    <td style={styles.td}>{bus.bus_id}</td>
                    <td style={styles.td}>{bus.registration_no}</td>
                    <td style={styles.td}>{bus.capacity}</td>
                    <td style={styles.td}>{bus.mileage}</td>
                    <td style={styles.td}>{bus.service_type}</td>
                    <td style={styles.td}>
                      <span style={statusStyle(bus.status)}>{bus.status}</span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.btnEdit} onClick={() => handleEdit(bus)}>
                        Edit
                      </button>
                      {bus.status !== "Inactive" && (
                        <button style={styles.btnDeactivate} onClick={() => handleDeactivate(bus)}>
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page:         { padding: "24px", fontFamily: "Segoe UI, sans-serif" },
  title:        { fontSize: "22px", fontWeight: "700", marginBottom: "20px", color: "#1a3c5e" },
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
  badge:        { padding: "2px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: "600" },
  btnEdit:       { background: "#f59e0b", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", marginRight: "6px", fontWeight: "600" },
  btnDeactivate: { background: "#ef4444", color: "#fff", border: "none", padding: "5px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "13px", fontWeight: "600" },
  errorBox:     { background: "#fee2e2", color: "#991b1b", padding: "10px 16px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" },
  successBox:   { background: "#d1fae5", color: "#065f46", padding: "10px 16px", borderRadius: "6px", marginBottom: "16px", fontSize: "14px" },
};
