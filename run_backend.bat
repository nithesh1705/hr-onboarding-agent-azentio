@echo off
title HR Onboarding Agent - FastAPI Backend
echo ========================================================
echo Starting HR Onboarding Agent - FastAPI Backend (Port 8000)
echo ========================================================
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause

