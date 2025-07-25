from datetime import date, datetime
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, extract 
from . import models, schemas
import csv
import json
import os
import uuid 

# USER CRUD
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    from .security import get_password_hash
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def set_user_goal(db: Session, user_id: int, monthly_goal: float):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return None
    user.monthly_goal = monthly_goal
    db.commit()
    db.refresh(user)
    return user

def get_user_goal(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user.monthly_goal if user else 0.0

# RECEIPT CRUD 
def create_user_receipt(db: Session, user_id: int, filename: str, file_path: str):
    db_receipt = models.Receipt(
        owner_id=user_id,
        filename=filename,
        file_path=file_path,
        status=models.StatusEnum.processing
    )
    db.add(db_receipt)
    db.commit()
    db.refresh(db_receipt)
    return db_receipt

def get_receipts_by_user(
    db: Session,
    user_id: int,
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort: Optional[str] = "upload_date"
):
    query = db.query(models.Receipt).filter(models.Receipt.owner_id == user_id)
    if search:
        query = query.filter(models.Receipt.vendor.ilike(f"%{search}%"))
    if category:
        query = query.filter(models.Receipt.category == category)
    if sort == "amount":
        query = query.order_by(models.Receipt.amount.desc())
    elif sort == "transaction_date":
        query = query.order_by(models.Receipt.transaction_date.desc())
    else:
        query = query.order_by(models.Receipt.upload_date.desc())
    return query.all()

def get_receipt_by_id(db: Session, receipt_id: int, user_id: int):
    return db.query(models.Receipt).filter(
        models.Receipt.id == receipt_id,
        models.Receipt.owner_id == user_id
    ).first()

def delete_receipt(db: Session, receipt_id: int, user_id: int):
    rec = db.query(models.Receipt).filter(
        models.Receipt.id == receipt_id,
        models.Receipt.owner_id == user_id
    ).first()
    if rec:
        db.delete(rec)
        db.commit()

def update_receipt_status(db: Session, receipt_id: int, status: models.StatusEnum):
    db_receipt = db.query(models.Receipt).filter(models.Receipt.id == receipt_id).first()
    if db_receipt:
        db_receipt.status = status
        db.commit()
        db.refresh(db_receipt)
    return db_receipt

def update_receipt_details(
    db: Session,
    receipt_id: int,
    user_id: int,
    update_data: schemas.ReceiptUpdate
):
    
    
    db_receipt = db.query(models.Receipt).filter(
        models.Receipt.id == receipt_id,
        models.Receipt.owner_id == user_id
    ).first()

    if not db_receipt:
        return None 

   
    update_data_dict = update_data.model_dump(exclude_unset=True)

    
    for key, value in update_data_dict.items():
        setattr(db_receipt, key, value)

    db.commit()
    db.refresh(db_receipt)
    return db_receipt

# DASHBOARD SUMMARY 
def get_dashboard_summary(db: Session, user_id: int):
    total_spent = db.query(func.sum(models.Receipt.amount)).filter(models.Receipt.owner_id == user_id, models.Receipt.amount != None).scalar() or 0
    receipts_processed = db.query(models.Receipt).filter(models.Receipt.owner_id == user_id).count()
    average_amount = db.query(func.avg(models.Receipt.amount)).filter(models.Receipt.owner_id == user_id, models.Receipt.amount != None).scalar() or 0
    amounts = [r.amount for r in db.query(models.Receipt).filter(models.Receipt.owner_id == user_id, models.Receipt.amount != None)]
    median_amount = 0
    if amounts:
        amounts.sort()
        mid = len(amounts) // 2
        median_amount = amounts[mid] if len(amounts) % 2 else (amounts[mid - 1] + amounts[mid]) / 2
    now = datetime.utcnow()
    effective_date = func.coalesce(models.Receipt.transaction_date, func.date(models.Receipt.upload_date))
    
    this_month_spent = db.query(func.sum(models.Receipt.amount)).filter(
        models.Receipt.owner_id == user_id,
        models.Receipt.amount != None,
        extract('year', effective_date) == now.year,
        extract('month', effective_date) == now.month
    ).scalar() or 0
    user = db.query(models.User).filter(models.User.id == user_id).first()
    monthly_goal = user.monthly_goal if user and hasattr(user, "monthly_goal") else 0
    recent = db.query(models.Receipt).filter(models.Receipt.owner_id == user_id).order_by(models.Receipt.upload_date.desc()).limit(5).all()
    return {
        "total_spent": total_spent, "receipts_processed": receipts_processed, "average_amount": average_amount,
        "median_amount": median_amount, "this_month_spent": this_month_spent, "monthly_goal": monthly_goal,
        "recent_receipts": recent
    }

# ANALYTICS FUNCTIONS 
def get_category_spending(db: Session, user_id: int):
    return db.query(
        models.Receipt.category, func.sum(models.Receipt.amount)
    ).filter(models.Receipt.owner_id == user_id, models.Receipt.amount != None).group_by(models.Receipt.category).all()

def get_top_vendors(db: Session, user_id: int):
    return db.query(
        models.Receipt.vendor, func.sum(models.Receipt.amount)
    ).filter(models.Receipt.owner_id == user_id, models.Receipt.amount != None).group_by(models.Receipt.vendor).order_by(desc(func.sum(models.Receipt.amount))).limit(5).all()

def analytics_summary(db: Session, user_id: int):
    dash = get_dashboard_summary(db, user_id)
    cat_agg = db.query(models.Receipt.category, func.sum(models.Receipt.amount)).filter(
        models.Receipt.owner_id == user_id, models.Receipt.amount != None
    ).group_by(models.Receipt.category).order_by(desc(func.sum(models.Receipt.amount))).first()
    vendor_agg = db.query(models.Receipt.vendor, func.sum(models.Receipt.amount)).filter(
        models.Receipt.owner_id == user_id, models.Receipt.amount != None
    ).group_by(models.Receipt.vendor).order_by(desc(func.sum(models.Receipt.amount))).first()
    return {
        "monthly_average": dash["average_amount"], "monthly_median": dash["median_amount"], "processing_rate": 100,
        "top_category": cat_agg[0] if cat_agg else None, "top_vendor": vendor_agg[0] if vendor_agg else None
    }

def get_monthly_trends(db: Session, user_id: int):
    return db.query(
        extract('year', models.Receipt.transaction_date).label('year'),
        extract('month', models.Receipt.transaction_date).label('month'),
        func.sum(models.Receipt.amount).label('total')
    ).filter(
        models.Receipt.owner_id == user_id, models.Receipt.amount != None,
        models.Receipt.transaction_date != None
    ).group_by('year', 'month').order_by('year', 'month').all()

# NEW: EXPORT FUNCTIONS 
def create_export(db: Session, user_id: int, format: str, receipt_ids: List[int]):

    query = db.query(models.Receipt).filter(models.Receipt.owner_id == user_id)
    if receipt_ids:
        query = query.filter(models.Receipt.id.in_(receipt_ids))
    receipts_to_export = query.all()
    rows = [
        {
            "id": r.id, "vendor": r.vendor, "amount": r.amount, "category": r.category,
            "transaction_date": r.transaction_date.isoformat() if r.transaction_date else "",
            "upload_date": r.upload_date.isoformat() if r.upload_date else ""
        }
        for r in receipts_to_export
    ]
    export_dir = "exports"
    os.makedirs(export_dir, exist_ok=True)
    unique_filename = f"{user_id}_{uuid.uuid4()}.{format}"
    file_path = os.path.join(export_dir, unique_filename)
    with open(file_path, "w", newline='', encoding="utf-8") as f:
        if format == "json":
            json.dump(rows, f, indent=2)
        else:
            if not rows:
                f.write("")
            else:
                fieldnames = ["id", "vendor", "amount", "category", "transaction_date", "upload_date"]
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(rows)
    db_export = models.Export(
        owner_id=user_id,
        format=format,
        file_path=file_path,
        status=models.ExportStatusEnum.COMPLETED
    )
    db.add(db_export)
    db.commit()
    db.refresh(db_export)
    return db_export

def get_export_history(db: Session, user_id: int):
    return db.query(models.Export).filter(models.Export.owner_id == user_id).order_by(desc(models.Export.created_at)).all()

def get_export_summary(db: Session, user_id: int):
    total_exports = db.query(models.Export).filter(models.Export.owner_id == user_id).count()
    last_export_date = db.query(func.max(models.Export.created_at)).filter(models.Export.owner_id == user_id).scalar()
    return schemas.ExportSummary(total_exports=total_exports, last_export_date=last_export_date)