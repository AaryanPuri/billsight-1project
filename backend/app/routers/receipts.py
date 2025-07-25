import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, BackgroundTasks, Query
from sqlalchemy.orm import Session
from .. import ocr
from .. import crud, models, schemas, dependencies
from ..database import get_db
from fastapi.responses import FileResponse
import os 
import uuid

router = APIRouter()

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'pdf', 'txt'}
MAX_SIZE = 10 * 1024 * 1024  

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[-1].lower() in ALLOWED_EXTENSIONS

@router.post("/upload", response_model=schemas.Receipt, status_code=status.HTTP_201_CREATED)
async def upload_receipt(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
):
    if not allowed_file(file.filename):
        raise HTTPException(status_code=400, detail="Invalid file type.")
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large (max 10MB).")
    if ".." in file.filename or "/" in file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename.")

    # To avoid overwriting files -> Create Unique Path
    unique_filename = f"{current_user.id} {uuid.uuid4().hex}_{file.filename}"
    file_path = UPLOAD_DIR / unique_filename
    
    with file_path.open("wb") as buffer:
        buffer.write(contents)

    receipt = crud.create_user_receipt(
        db=db,
        user_id=current_user.id,
        filename=file.filename,
        file_path=str(file_path)
    )
    background_tasks.add_task(ocr.process_receipt_file, receipt.id, str(file_path)) 
    return receipt

@router.get("/", response_model=list[schemas.Receipt])
async def get_all_user_receipts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user),
    search: str = Query(None),
    category: str = Query(None),
    sort: str = Query("upload_date")
):
    receipts = crud.get_receipts_by_user(
        db=db, user_id=current_user.id, search=search, category=category, sort=sort
    )
    return receipts

@router.patch("/{receipt_id}", response_model=schemas.Receipt)
def update_receipt_details_endpoint(
    receipt_id: int,
    receipt_data: schemas.ReceiptUpdate, 
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(dependencies.get_current_user)
):
    updated_receipt = crud.update_receipt_details(
        db=db,
        receipt_id=receipt_id,
        user_id=current_user.id,
        update_data=receipt_data
    )
    if updated_receipt is None:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return updated_receipt

@router.get("/{receipt_id}", response_model=schemas.Receipt)
async def get_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    receipt = crud.get_receipt_by_id(db, receipt_id, current_user.id)
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt

@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    crud.delete_receipt(db, receipt_id, current_user.id)
    return

@router.get("/file/{receipt_id}", response_class=FileResponse)
async def get_receipt_file(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(dependencies.get_current_user)
):
    receipt = crud.get_receipt_by_id(db, receipt_id, current_user.id)
    if not receipt or not os.path.exists(receipt.file_path):
        raise HTTPException(status_code=404, detail="Receipt file not found")
    return FileResponse(receipt.file_path, filename=receipt.filename)