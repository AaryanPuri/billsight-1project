from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, dependencies, crud
from ..database import get_db

router = APIRouter()

@router.post("/user/goal", response_model=schemas.GoalRead, status_code=status.HTTP_200_OK)
def set_goal(
    goal: schemas.GoalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    user = crud.set_user_goal(db, current_user.id, goal.monthly_goal)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return {"monthly_goal": user.monthly_goal}

@router.get("/user/goal", response_model=schemas.GoalRead, status_code=status.HTTP_200_OK)
def get_goal(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    goal = crud.get_user_goal(db, current_user.id)
    return {"monthly_goal": goal}

@router.get("/dashboard/summary", response_model=schemas.DashboardSummary)
async def dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    return crud.get_dashboard_summary(db, current_user.id)