@echo off
title HR Onboarding Agent Launcher
echo ========================================================
echo Launching HR Onboarding Agent (Backend + Frontend)
echo ========================================================
start "HR Onboarding - FastAPI Backend" cmd /k "run_backend.bat"
start "HR Onboarding - React Frontend" cmd /k "run_frontend.bat"
echo Both services are starting:
echo  - Backend:  http://127.0.0.1:8000 (Swagger docs at /docs)
echo  - Frontend: http://localhost:5173
echo.

