from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi.responses import FileResponse
import os
from .. import crud, schemas, dependencies, models
from ..database import get_db

router = APIRouter(
    prefix="/export",
    tags=["Export"]
)


class ExportRequest(schemas.BaseModel):
    format: str
    receipt_ids: Optional[List[int]] = []

"""
Creates an export file and saves a record of it to the database.
"""
@router.post("/", response_model=schemas.Export, status_code=201)
def create_export_job(
    export_request: ExportRequest,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(dependencies.get_current_user)
):
  
    try:
        new_export = crud.create_export(
            db=db,
            user_id=current_user.id,
            format=export_request.format,
            receipt_ids=export_request.receipt_ids
        )
        return new_export
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create export: {str(e)}")

"""
Returns a list of all past exports for the current user.
"""
@router.get("/history", response_model=List[schemas.Export])
def get_export_history(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(dependencies.get_current_user)
):

    return crud.get_export_history(db=db, user_id=current_user.id)

"""
Returns the total number of exports and the date of the last one.
"""
@router.get("/summary", response_model=schemas.ExportSummary)
def get_export_summary(
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(dependencies.get_current_user)
):

    return crud.get_export_summary(db=db, user_id=current_user.id)

"""
Lets suers to download a specific export file they own.
"""
@router.get("/file", response_class=FileResponse)
def download_export_file(
    file_path: str, 
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(dependencies.get_current_user)
):
   
    
    export_record = db.query(models.Export).filter(
        models.Export.file_path == file_path,
        models.Export.owner_id == current_user.id
    ).first()
    
    if not export_record or not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found or access denied.")

    filename = os.path.basename(file_path)
    media_type = "text/csv" if filename.endswith(".csv") else "application/json"
    
    return FileResponse(path=file_path, filename=filename, media_type=media_type)