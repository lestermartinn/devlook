# devlook/backend/models.py
from sqlalchemy import Column, Integer, String, DateTime
from db import Base  # <-- absolute import

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True, nullable=False)
    app_name = Column(String, nullable=True)
    window_title = Column(String, nullable=True)
    project = Column(String, nullable=True)
    user_id = Column(String, nullable=True)
