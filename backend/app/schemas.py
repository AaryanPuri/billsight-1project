from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from .enums import StatusEnum
from .models import ExportStatusEnum

# User Schemas 
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class User(BaseModel):
    id: int
    username: str
    email: EmailStr
    monthly_goal: float
    class Config:
        from_attributes = True


class GoalUpdate(BaseModel):
    monthly_goal: float

class GoalRead(BaseModel):
    monthly_goal: float
    class Config:
        from_attributes = True

# Token Schemas 
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Receipt Schemas 
class Receipt(BaseModel):
    id: int
    filename: str
    status: StatusEnum
    upload_date: datetime
    owner_id: int
    vendor: Optional[str] = None
    transaction_date: Optional[date] = None
    amount: Optional[float] = None
    category: Optional[str] = "Uncategorized"
    class Config:
        from_attributes = True
        
# Dashboard Schemas 
class DashboardRecentReceipt(BaseModel):
    id: int
    filename: str
    vendor: Optional[str]
    amount: Optional[float]
    transaction_date: Optional[datetime]
    class Config:
        from_attributes = True

class DashboardSummary(BaseModel):
    total_spent: float
    receipts_processed: int
    average_amount: float
    median_amount: float
    this_month_spent: float
    monthly_goal: Optional[float]
    recent_receipts: List[DashboardRecentReceipt]

# Export Schemas 
class ExportBase(BaseModel):
    format: str
    status: ExportStatusEnum
    file_path: str

class Export(ExportBase):
    id: int
    created_at: datetime
    owner_id: int
    class Config:
        from_attributes = True

class ExportSummary(BaseModel):
    total_exports: int
    last_export_date: Optional[datetime] = None

class ReceiptUpdate(BaseModel):
    category: Optional[str] = None
    transaction_date: Optional[date] = None