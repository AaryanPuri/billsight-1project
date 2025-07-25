import enum
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base
from .enums import StatusEnum


class ExportStatusEnum(str, enum.Enum):
    COMPLETED = "Completed"
    FAILED = "Failed"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    monthly_goal = Column(Float, default=1000.00)

    receipts = relationship("Receipt", back_populates="owner")
    exports = relationship("Export", back_populates="owner", cascade="all, delete-orphan")

class Receipt(Base):
    __tablename__ = "receipts"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    vendor = Column(String, index=True, nullable=True)
    transaction_date = Column(Date, nullable=True)
    amount = Column(Float, nullable=True)
    category = Column(String, index=True, default="Uncategorized")
    status = Column(Enum(StatusEnum), default=StatusEnum.processing)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="receipts")


class Export(Base):
    __tablename__ = "exports"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String, nullable=False, unique=True)
    format = Column(String, nullable=False) # "csv" or "json"
    status = Column(Enum(ExportStatusEnum), default=ExportStatusEnum.COMPLETED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="exports")