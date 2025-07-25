from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import crud, dependencies
from ..database import get_db

router = APIRouter()

@router.get("/analytics/summary")
def summary(db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    return crud.analytics_summary(db, current_user.id)

@router.get("/analytics/categories")
def categories(db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    results = crud.get_category_spending(db, current_user.id)
    return [{"category": c, "total": t} for c, t in results]

@router.get("/analytics/vendors")
def vendors(db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    results = crud.get_top_vendors(db, current_user.id)
    return [{"vendor": v, "total": t} for v, t in results]

@router.get("/analytics/trends")
def trends(db: Session = Depends(get_db), current_user=Depends(dependencies.get_current_user)):
    results = crud.get_monthly_trends(db, current_user.id)
    
    return [
        {"year": int(y), "month": int(m), "total": float(t)}
        for y, m, t in results
    ]

