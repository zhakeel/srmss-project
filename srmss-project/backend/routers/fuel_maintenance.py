from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db_connection

router = APIRouter(tags=["Fuel & Maintenance"])


# ── Pydantic models ──────────────────────────────────────────────────
# Defined here locally — no imports from models.py or schemas.py

class FuelLogCreate(BaseModel):
    bus_id: int
    fuel_date: str       # format: YYYY-MM-DD
    liters: float
    cost: float
    odometer_reading: float


class FuelLogUpdate(BaseModel):
    bus_id: Optional[int] = None
    fuel_date: Optional[str] = None
    liters: Optional[float] = None
    cost: Optional[float] = None
    odometer_reading: Optional[float] = None


class MaintenanceCreate(BaseModel):
    bus_id: int
    maintenance_type: str
    maintenance_date: str   # format: YYYY-MM-DD
    description: Optional[str] = None
    cost: float
    next_service_date: Optional[str] = None  # format: YYYY-MM-DD


class MaintenanceUpdate(BaseModel):
    bus_id: Optional[int] = None
    maintenance_type: Optional[str] = None
    maintenance_date: Optional[str] = None
    description: Optional[str] = None
    cost: Optional[float] = None
    next_service_date: Optional[str] = None


# ════════════════════════════════════════════════════════════════════
# FUEL LOGS
# ════════════════════════════════════════════════════════════════════

# ── GET /fuel-logs ───────────────────────────────────────────────────

@router.get("/fuel-logs")
def get_all_fuel_logs():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM fuel_logs ORDER BY fuel_id")
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    return logs


# ── POST /fuel-logs ──────────────────────────────────────────────────

@router.post("/fuel-logs", status_code=201)
def create_fuel_log(log: FuelLogCreate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """
        INSERT INTO fuel_logs (bus_id, fuel_date, liters, cost, odometer_reading)
        VALUES (%s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        log.bus_id,
        log.fuel_date,
        log.liters,
        log.cost,
        log.odometer_reading
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"message": "Fuel log created successfully", "fuel_id": new_id}


# ── PUT /fuel-logs/{fuel_id} ─────────────────────────────────────────

@router.put("/fuel-logs/{fuel_id}")
def update_fuel_log(fuel_id: int, log: FuelLogUpdate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM fuel_logs WHERE fuel_id = %s", (fuel_id,))
    existing = cursor.fetchone()
    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Fuel log not found")

    fields = []
    values = []
    if log.bus_id is not None:
        fields.append("bus_id = %s")
        values.append(log.bus_id)
    if log.fuel_date is not None:
        fields.append("fuel_date = %s")
        values.append(log.fuel_date)
    if log.liters is not None:
        fields.append("liters = %s")
        values.append(log.liters)
    if log.cost is not None:
        fields.append("cost = %s")
        values.append(log.cost)
    if log.odometer_reading is not None:
        fields.append("odometer_reading = %s")
        values.append(log.odometer_reading)

    if fields:
        values.append(fuel_id)
        sql = f"UPDATE fuel_logs SET {', '.join(fields)} WHERE fuel_id = %s"
        cursor.execute(sql, values)
        conn.commit()

    cursor.close()
    conn.close()
    return {"message": "Fuel log updated successfully"}


# ── DELETE /fuel-logs/{fuel_id} ──────────────────────────────────────

@router.delete("/fuel-logs/{fuel_id}")
def delete_fuel_log(fuel_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM fuel_logs WHERE fuel_id = %s", (fuel_id,))
    existing = cursor.fetchone()
    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Fuel log not found")

    cursor.execute("DELETE FROM fuel_logs WHERE fuel_id = %s", (fuel_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Fuel log deleted successfully"}


# ════════════════════════════════════════════════════════════════════
# MAINTENANCE LOGS
# ════════════════════════════════════════════════════════════════════

# ── GET /maintenance ─────────────────────────────────────────────────

@router.get("/maintenance")
def get_all_maintenance():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM maintenance_logs ORDER BY maintenance_id")
    logs = cursor.fetchall()
    cursor.close()
    conn.close()
    return logs


# ── POST /maintenance ────────────────────────────────────────────────

@router.post("/maintenance", status_code=201)
def create_maintenance(log: MaintenanceCreate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """
        INSERT INTO maintenance_logs
            (bus_id, maintenance_type, maintenance_date, description, cost, next_service_date)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        log.bus_id,
        log.maintenance_type,
        log.maintenance_date,
        log.description,
        log.cost,
        log.next_service_date
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"message": "Maintenance log created successfully", "maintenance_id": new_id}


# ── PUT /maintenance/{maintenance_id} ───────────────────────────────

@router.put("/maintenance/{maintenance_id}")
def update_maintenance(maintenance_id: int, log: MaintenanceUpdate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM maintenance_logs WHERE maintenance_id = %s",
        (maintenance_id,)
    )
    existing = cursor.fetchone()
    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Maintenance log not found")

    fields = []
    values = []
    if log.bus_id is not None:
        fields.append("bus_id = %s")
        values.append(log.bus_id)
    if log.maintenance_type is not None:
        fields.append("maintenance_type = %s")
        values.append(log.maintenance_type)
    if log.maintenance_date is not None:
        fields.append("maintenance_date = %s")
        values.append(log.maintenance_date)
    if log.description is not None:
        fields.append("description = %s")
        values.append(log.description)
    if log.cost is not None:
        fields.append("cost = %s")
        values.append(log.cost)
    if log.next_service_date is not None:
        fields.append("next_service_date = %s")
        values.append(log.next_service_date)

    if fields:
        values.append(maintenance_id)
        sql = f"UPDATE maintenance_logs SET {', '.join(fields)} WHERE maintenance_id = %s"
        cursor.execute(sql, values)
        conn.commit()

    cursor.close()
    conn.close()
    return {"message": "Maintenance log updated successfully"}


# ── DELETE /maintenance/{maintenance_id} ─────────────────────────────

@router.delete("/maintenance/{maintenance_id}")
def delete_maintenance(maintenance_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM maintenance_logs WHERE maintenance_id = %s",
        (maintenance_id,)
    )
    existing = cursor.fetchone()
    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Maintenance log not found")

    cursor.execute(
        "DELETE FROM maintenance_logs WHERE maintenance_id = %s",
        (maintenance_id,)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Maintenance log deleted successfully"}
