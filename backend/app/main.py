from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, receipts, user, analytics, export


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Billsight API",
    description="API for managing receipts and analyzing spending.",
    version="1.0.0"
)


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers endpoints
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(receipts.router, prefix="/api/receipts", tags=["Receipts"])
app.include_router(user.router, prefix="/api", tags=["User"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])
app.include_router(export.router, prefix="/api", tags=["Export"])

# Root Endpoint 
@app.get("/", tags=["Root"])
async def read_root():
    """
    A simple endpoint to confirm the API is running.
    """
    return {"message": "Welcome to the Billsight API!"}