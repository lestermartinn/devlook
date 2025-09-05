# devlook/backend/main.py
from fastapi import FastAPI, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from collections import defaultdict

from db import Base, engine, SessionLocal
from models import ActivityLog

app = FastAPI()

# --- Pydantic input model ---
class ActivityLogIn(BaseModel):
    app_name: Optional[str] = Field(None, description="Process/app name, e.g., Code.exe")
    window_title: Optional[str] = Field(None, description="Current window title")
    # NOTE: utcnow() returns a naive UTC; we normalize below anyway.
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp")
    project: Optional[str] = None
    user_id: Optional[str] = None

# --- DB session dependency ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    # Create tables if they don't exist
    Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "API is running"}

# --- Time helpers (normalize everything to UTC-naive) ---
def iso_utc(dt: datetime) -> str:
    # Treat stored naive datetimes as UTC and serialize with Z
    return dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")

def to_naive_utc(dt: datetime) -> datetime:
    """Return a timezone-naive UTC datetime."""
    if dt.tzinfo is None:
        # Assume provided as UTC already (naive)
        return dt
    return dt.astimezone(timezone.utc).replace(tzinfo=None)

def parse_iso_to_naive_utc(s: str) -> datetime:
    """Parse ISO string (with Z or offset) to timezone-naive UTC."""
    s = s.replace("Z", "+00:00")
    d = datetime.fromisoformat(s)
    return to_naive_utc(d)

# --- Endpoints ---
@app.post("/api/log")
def ingest_log(payload: ActivityLogIn, db: Session = Depends(get_db)):
    # Normalize incoming timestamp to UTC-naive before saving
    ts = to_naive_utc(payload.timestamp)
    row = ActivityLog(
        timestamp=ts,
        app_name=payload.app_name,
        window_title=payload.window_title,
        project=payload.project,
        user_id=payload.user_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"status": "ok", "id": row.id}

@app.get("/api/logs")
def get_logs(
    limit: int = Query(50, ge=1, le=5000),
    since: Optional[str] = Query(None, description="ISO datetime, e.g. 2025-08-17T00:00:00Z"),
    until: Optional[str] = Query(None, description="ISO datetime, e.g. 2025-08-18T00:00:00Z"),
    project: Optional[str] = Query(None, description="Exact project tag (optional)"),
    db: Session = Depends(get_db),
) -> List[dict]:
    stmt = select(ActivityLog)

    # Apply optional filters (all normalized to UTC-naive)
    if since:
        stmt = stmt.where(ActivityLog.timestamp >= parse_iso_to_naive_utc(since))
    if until:
        stmt = stmt.where(ActivityLog.timestamp < parse_iso_to_naive_utc(until))
    if project:
        stmt = stmt.where(ActivityLog.project == project)

    stmt = stmt.order_by(desc(ActivityLog.timestamp)).limit(limit)
    rows = db.execute(stmt).scalars().all()

    return [
        {
            "id": r.id,
            "timestamp": iso_utc(r.timestamp),
            "app_name": r.app_name,
            "window_title": r.window_title,
            "project": r.project,
            "user_id": r.user_id,
        }
        for r in rows
    ]
@app.get("/api/summary")
def get_summary(
    limit: int = Query(5000, ge=1, le=20000),
    since: Optional[str] = Query(None, description="ISO datetime, e.g. 2025-08-17T00:00:00Z"),
    until: Optional[str] = Query(None, description="ISO datetime, e.g. 2025-08-18T00:00:00Z"),
    project: Optional[str] = Query(None, description="Exact project tag (optional)"),
    db: Session = Depends(get_db),
) -> dict:
    """
    Returns aggregated minutes per app plus totals for the given range.
    Approximation: each event ≈ 5 seconds.
    """
    stmt = select(ActivityLog)

    if since:
        stmt = stmt.where(ActivityLog.timestamp >= parse_iso_to_naive_utc(since))
    if until:
        stmt = stmt.where(ActivityLog.timestamp < parse_iso_to_naive_utc(until))
    if project:
        stmt = stmt.where(ActivityLog.project == project)

    # pull up to 'limit' events (newest first)
    stmt = stmt.order_by(desc(ActivityLog.timestamp)).limit(limit)
    rows = db.execute(stmt).scalars().all()

    counts = defaultdict(int)
    total_events = 0
    for r in rows:
        key = (r.app_name or "Unknown").replace(".exe", "")
        counts[key] += 1
        total_events += 1

    per_app = [
        {
            "app": app,
            "events": cnt,
            "minutes": round(cnt * 5 / 60, 1),  # one decimal minute
        }
        for app, cnt in counts.items()
    ]
    per_app.sort(key=lambda x: x["minutes"], reverse=True)

    total_minutes = round(total_events * 5 / 60, 1)

    return {
        "total_events": total_events,
        "total_minutes": total_minutes,
        "apps": per_app[:50],  # top 50 apps
    }
