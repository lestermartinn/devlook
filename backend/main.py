# # devlook/backend/main.py
# from fastapi import FastAPI

# app = FastAPI()

# @app.get("/")
# def read_root():
#     return {"message": "API is running"}

# devlook/backend/main.py
# from fastapi import FastAPI
# from pydantic import BaseModel, Field
# from typing import Optional
# from datetime import datetime

# app = FastAPI()

# class ActivityLogIn(BaseModel):
#     app_name: Optional[str] = Field(None, description="Process/app name, e.g., Code.exe")
#     window_title: Optional[str] = Field(None, description="Current window title")
#     timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp")
#     # room to grow later:
#     project: Optional[str] = None
#     user_id: Optional[str] = None

# @app.get("/")
# def read_root():
#     return {"message": "API is running"}

# @app.post("/api/log")
# def ingest_log(payload: ActivityLogIn):
#     # For now, just echo to console and return status
#     print(f"[INGEST] {payload.timestamp.isoformat()} | app={payload.app_name} | title={payload.window_title}")
#     return {"status": "ok"}

# devlook/backend/main.py
from fastapi import FastAPI, Depends, Query
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from db import Base, engine, SessionLocal
from models import ActivityLog

app = FastAPI()

# --- Pydantic input model ---
class ActivityLogIn(BaseModel):
    app_name: Optional[str] = Field(None, description="Process/app name, e.g., Code.exe")
    window_title: Optional[str] = Field(None, description="Current window title")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="UTC timestamp")
    project: Optional[str] = None
    user_id: Optional[str] = None

# --- Dependency to get DB session per request ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.on_event("startup")
def on_startup():
    # Create tables if they don't exist (SQLite dev convenience)
    Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "API is running"}

# helper to parse ISO strings like "...Z" or with offsets
def _parse_iso_to_naive(dt: str) -> datetime:
    # Accept “Z” by converting to +00:00
    dt = dt.replace("Z", "+00:00")
    d = datetime.fromisoformat(dt)
    # Our DB column is naive (no tz), store/compare as UTC-naive
    if d.tzinfo:
        d = d.astimezone(tz=None).replace(tzinfo=None)
    return d

@app.post("/api/log")
def ingest_log(payload: ActivityLogIn, db: Session = Depends(get_db)):
    row = ActivityLog(
        timestamp=payload.timestamp,
        app_name=payload.app_name,
        window_title=payload.window_title,
        project=payload.project,
        user_id=payload.user_id,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    # simple response
    return {"status": "ok", "id": row.id}

@app.get("/api/logs")
def get_logs(
    limit: int = Query(50, ge=1, le=5000),
    since: Optional[str] = Query(None, description="ISO datetime, e.g. 2025-08-14T00:00:00Z"),
    until: Optional[str] = Query(None, description="ISO datetime, e.g. 2025-08-15T00:00:00Z"),
    project: Optional[str] = Query(None, description="Exact project tag (optional)"),
    db: Session = Depends(get_db),
) -> List[dict]:
    stmt = select(ActivityLog)

    # Apply optional filters
    if since:
        since_dt = _parse_iso_to_naive(since)
        stmt = stmt.where(ActivityLog.timestamp >= since_dt)
    if until:
        until_dt = _parse_iso_to_naive(until)
        stmt = stmt.where(ActivityLog.timestamp < until_dt)
    if project:
        stmt = stmt.where(ActivityLog.project == project)

    stmt = stmt.order_by(desc(ActivityLog.timestamp)).limit(limit)
    rows = db.execute(stmt).scalars().all()

    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "app_name": r.app_name,
            "window_title": r.window_title,
            "project": r.project,
            "user_id": r.user_id,
        }
        for r in rows
    ]

