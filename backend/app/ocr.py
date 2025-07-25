import re
from datetime import datetime
from pathlib import Path
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
from .database import SessionLocal 

def extract_text_from_file(file_path: Path) -> str:
    """
    Extracts text from an image or PDF file using Tesseract OCR.
    """
    text = ""
    try:
        if file_path.suffix.lower() in ['.jpg', '.jpeg', '.png']:
            text = pytesseract.image_to_string(Image.open(file_path))
        elif file_path.suffix.lower() == '.pdf':
            pages = convert_from_path(file_path)
            for page in pages:
                text += pytesseract.image_to_string(page) + '\n'
    except Exception as e:
        print(f"Error processing file {file_path}: {e}")
    return text

def parse_receipt_text(text: str) -> dict:
    
    data = {"vendor": None, "transaction_date": None, "amount": None}
    lines = text.split('\n')
    
    # Find Vendor 
    for line in lines:
        if line.strip():
            data['vendor'] = line.strip()
            break
            
    # Find Total Amount 
    amount_pattern = r'(\d+\.\d{2})'
    possible_amounts = []
    for line in text.split('\n'):
        if any(keyword in line.lower() for keyword in ['total', 'amount', 'subtotal', 'due', 'balance']):
            matches = re.findall(amount_pattern, line)
            possible_amounts.extend([float(m) for m in matches])
    
    
    if not possible_amounts: 
        possible_amounts = [float(m) for m in re.findall(amount_pattern, text)]

    if possible_amounts:
        data['amount'] = max(possible_amounts)

    # Find Transaction Date 
    date_pattern = r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})'
    date_matches = re.findall(date_pattern, text)
    if date_matches:
        for date_str in date_matches:
            try:
                # parse format MM/DD/YYYY
                data['transaction_date'] = datetime.strptime(date_str, '%m/%d/%Y').date()
                break # Stop after finding the first valid date
            except ValueError:
                try:
                    # parse format MM-DD-YYYY
                    data['transaction_date'] = datetime.strptime(date_str, '%m-%d-%Y').date()
                    break # Stop after finding the first valid date
                except ValueError:
                    continue
    return data

def process_receipt_file(receipt_id: int, file_path_str: str):
    db = SessionLocal() 
    try:
        from . import crud 
        print(f"BACKGROUND TASK: Processing receipt ID: {receipt_id}")
        file_path = Path(file_path_str)
        
        # 1. Extract raw text from the file
        raw_text = extract_text_from_file(file_path)
        
        if not raw_text or not raw_text.strip():
            crud.update_receipt_status(db, receipt_id, status="failed")
            print(f"BACKGROUND TASK: Failed to extract any text from {file_path.name}")
            return

        # 2. Parse the text to get structured data
        parsed_data = parse_receipt_text(raw_text)
        
        # 3. Update the database with the extracted details
        # If an amount was found, mark as processed. Otherwise, mark as failed.
        status_to_set = "processed" if parsed_data.get("amount") is not None else "failed"
        
        crud.update_receipt_details(
            db=db,
            receipt_id=receipt_id,
            vendor=parsed_data.get("vendor"),
            transaction_date=parsed_data.get("transaction_date"),
            amount=parsed_data.get("amount"),
            status=status_to_set
        )
        print(f"BACKGROUND TASK: Finished processing receipt ID: {receipt_id}. Status: {status_to_set}, Amount: {parsed_data.get('amount')}")
    finally:
        db.close() 
