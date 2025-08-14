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
from fastapi import FastAPI, Depends
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
def get_logs(limit: int = 50, db: Session = Depends(get_db)) -> List[dict]:
    stmt = (
        select(ActivityLog)
        .order_by(desc(ActivityLog.timestamp))
        .limit(limit)
    )
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
