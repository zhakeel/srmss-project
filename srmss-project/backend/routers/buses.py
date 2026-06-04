from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db_connection

router = APIRouter(prefix="/buses", tags=["Buses"])


# ── Pydantic models ──────────────────────────────────────────────────
# Defined here locally — no imports from models.py or schemas.py

class BusCreate(BaseModel):
    registration_no: str
    capacity: int
    mileage: float
    service_type: str   # Normal or Express
    status: str         # Available / Assigned / Maintenance / Inactive


class BusUpdate(BaseModel):
    registration_no: Optional[str] = None
    capacity: Optional[int] = None
    mileage: Optional[float] = None
    service_type: Optional[str] = None
    status: Optional[str] = None


# ── GET /buses/ ──────────────────────────────────────────────────────

@router.get("/")
def get_all_buses():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM buses ORDER BY bus_id")
    buses = cursor.fetchall()
    cursor.close()
    conn.close()
    return buses


# ── POST /buses/ ─────────────────────────────────────────────────────

@router.post("/", status_code=201)
def create_bus(bus: BusCreate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    sql = """
        INSERT INTO buses (registration_no, capacity, mileage, service_type, status)
        VALUES (%s, %s, %s, %s, %s)
    """
    cursor.execute(sql, (
        bus.registration_no,
        bus.capacity,
        bus.mileage,
        bus.service_type,
        bus.status
    ))
    conn.commit()
    new_id = cursor.lastrowid
    cursor.close()
    conn.close()
    return {"message": "Bus created successfully", "bus_id": new_id}


# ── PUT /buses/{bus_id} ──────────────────────────────────────────────

@router.put("/{bus_id}")
def update_bus(bus_id: int, bus: BusUpdate):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Check the bus exists first
    cursor.execute("SELECT * FROM buses WHERE bus_id = %s", (bus_id,))
    existing = cursor.fetchone()
    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Bus not found")

    # Build SET clause only for fields that were actually sent
    fields = []
    values = []
    if bus.registration_no is not None:
        fields.append("registration_no = %s")
        values.append(bus.registration_no)
    if bus.capacity is not None:
        fields.append("capacity = %s")
        values.append(bus.capacity)
    if bus.mileage is not None:
        fields.append("mileage = %s")
        values.append(bus.mileage)
    if bus.service_type is not None:
        fields.append("service_type = %s")
        values.append(bus.service_type)
    if bus.status is not None:
        fields.append("status = %s")
        values.append(bus.status)

    if fields:
        values.append(bus_id)
        sql = f"UPDATE buses SET {', '.join(fields)} WHERE bus_id = %s"
        cursor.execute(sql, values)
        conn.commit()

    cursor.close()
    conn.close()
    return {"message": "Bus updated successfully"}


# ── DELETE /buses/{bus_id} ───────────────────────────────────────────
# We deactivate (set status = Inactive) instead of hard-deleting
# so schedules linked to this bus are not broken

@router.delete("/{bus_id}")
def deactivate_bus(bus_id: int):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM buses WHERE bus_id = %s", (bus_id,))
    existing = cursor.fetchone()
    if not existing:
        cursor.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Bus not found")

    cursor.execute(
        "UPDATE buses SET status = 'Inactive' WHERE bus_id = %s",
        (bus_id,)
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"message": "Bus deactivated successfully"}
