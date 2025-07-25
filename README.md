# Billsight - Intelligent Receipt Management

Billsight is a full-stack web application designed to simplify expense tracking through intelligent receipt processing. Users can upload receipt files (images, PDFs, or text), and the application automatically extracts key information like vendor, date, and total amount using Optical Character Recognition (OCR). It provides a comprehensive dashboard, detailed analytics, and data export functionalities to help users gain clarity on their spending habits.

## Features

-   **Dashboard**: An at-a-glance overview of total spending, receipts processed, monthly spending against a user-defined goal, and a list of recent transactions.
-   **Intelligent Receipt Upload**: Supports JPG, PNG, PDF, and TXT files. A background OCR process automatically extracts and populates receipt data.
-   **Receipt Management**: A central hub to view, filter, sort, and manage all uploaded receipts. Users can manually edit receipt details like category and transaction date.
-   **Spending Analytics**: Visual charts and KPIs, including a monthly spending trend, spending breakdown by category, and top vendors.
-   **Data Export**: Allows users to export their financial data in CSV or JSON format, with options to filter by specific receipts.
-   **Secure Authentication**: User accounts are secured with JWT-based authentication to ensure data privacy.

## Screenshots

<table>
  <tr>
    <td align="center"><strong>Login & Register</strong></td>
    <td align="center"><strong>Dashboard</strong></td>
  </tr>
  <tr>
    <td><img src="http://googleusercontent.com/file_content/5" alt="Login and Register Pages" width="100%"></td>
    <td><img src="http://googleusercontent.com/file_content/3" alt="Dashboard View" width="100%"></td>
  </tr>
  <tr>
    <td align="center"><strong>Receipt Management</strong></td>
    <td align="center"><strong>Analytics</strong></td>
  </tr>
  <tr>
    <td><img src="http://googleusercontent.com/file_content/4" alt="Receipt Management Page" width="100%"></td>
    <td><img src="http://googleusercontent.com/file_content/2" alt="Analytics Page" width="100%"></td>
  </tr>
   <tr>
    <td align="center"><strong>Export Data</strong></td>
  </tr>
   <tr>
    <td><img src="http://googleusercontent.com/file_content/1" alt="Export Page" width="100%"></td>
  </tr>
</table>

## Architecture & Design Choices

The project is structured as a monorepo containing two separate applications: a Python/FastAPI backend and a React frontend. This separation allows for independent development, scaling, and deployment.

### Backend Architecture

The backend is a modern API built with **FastAPI**, chosen for its high performance, asynchronous capabilities, and automatic data validation with Pydantic. It follows a layered, modular architecture.

-   **Core Technologies**: FastAPI, SQLAlchemy (ORM), PostgreSQL, Pydantic, JWT Authentication, Tesseract (OCR).
-   **Structure**:
    -   **Routers (`/routers`)**: Each file (`receipts.py`, `auth.py`, etc.) defines the API endpoints for a specific feature.
    -   **CRUD Layer (`crud.py`)**: Contains all the database interaction logic (Create, Read, Update, Delete).
    -   **Models & Schemas (`models.py`, `schemas.py`)**: Defines the database tables and the Pydantic models for API data validation.
    -   **Dependencies (`dependencies.py`)**: Manages reusable dependencies, most importantly the `get_current_user` function for securing endpoints.
    -   **OCR (`ocr.py`)**: Runs as a background task to process uploaded files, ensuring the API remains responsive.

### Frontend Architecture

The frontend is a responsive Single-Page Application (SPA) built with **React**, chosen for its component-based architecture and robust ecosystem.

-   **Core Technologies**: React, React Router, Axios, Recharts, React Dropzone.
-   **Structure**:
    -   **Components (`/components`)**: Small, reusable UI elements like buttons, modals, and the navigation bar.
    -   **Pages (`/pages`)**: Top-level components that represent a full view of the application (e.g., Dashboard, ReceiptsPage).
    -   **Context (`/context`)**: The `AuthContext` provides global state for user authentication.
    -   **API Layer (`/api`)**: A centralized Axios instance is configured with the backend URL and an interceptor to automatically attach the JWT token to every request.

## User Journeys

1.  **Registration & Login**: A new user creates an account. Upon successful login, a JWT token is generated and stored in the browser's local storage.
2.  **Uploading a Receipt**: The user navigates to the "Receipts" page, where they can drag and drop a file. The API creates a database entry with a "processing" status and starts a background OCR task.
3.  **Managing Receipts**: The user can view all their receipts in a table. By clicking the "Edit" icon, they can manually update the category and transaction date for any receipt.
4.  **Analyzing Spending**: On the "Analytics" page, the user can view charts of their spending trends and breakdowns by category.

## Setup and Installation

Follow these steps to set up and run the project locally.

### Prerequisites

-   Python 3.8+
-   Node.js v16+ and npm
-   PostgreSQL
-   Tesseract OCR Engine

### Backend Setup

1.  **Navigate to the `backend` directory:**
    ```bash
    cd backend
    ```
2.  **Create and activate a virtual environment:**
    ```bash
    python -m venv venv
    source venv/bin/activate  # On macOS/Linux
    .\venv\Scripts\activate    # On Windows
    ```
3.  **Install Python dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
4.  **Set up environment variables:**
    -   Create a file named `.env` in the `backend` directory.
    -   Copy the content from `.env.example` and fill in your actual database URL and a secret key.
5.  **Run the database migrations (if using Alembic):**
    ```bash
    alembic upgrade head
    ```
6.  **Start the backend server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The backend will be running at `http://localhost:8000`.

### Frontend Setup

1.  **Navigate to the `billsight-frontend` directory:**
    ```bash
    cd billsight-frontend
    ```
2.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    -   Create a file named `.env` in the `billsight-frontend` directory.
    -   Copy the content from `.env.example`. The default `REACT_APP_API_URL` should work for local development.
4.  **Start the frontend development server:**
    ```bash
    npm start
    ```
    The frontend will be running at `http://localhost:3000`.

## Limitations and Assumptions

-   **OCR Accuracy**: The accuracy of the data extraction depends on the Tesseract OCR engine. Low-quality images or unconventional receipt layouts may result in errors. The inline editing feature is provided to mitigate this.
-   **Security**: The current CORS configuration is set to `allow_origins=["*"]` for development. In a production environment, this **must** be restricted to the specific domain of the frontend application.
-   **Single File Upload**: The receipt uploader is currently configured to handle one file at a time.
-   **Database**: The application is configured for PostgreSQL. Using a different SQL database would require changes to the `DATABASE_URL`.
