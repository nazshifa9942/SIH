# SIH26006 Real Optimization Service

Python + FastAPI + OR-Tools CP-SAT.

## Folder

Place these files in:

ml/optimization/

- optimizer.py
- main.py
- requirements.txt

## Install

```powershell
cd "C:\Users\Nitin Kumar\Downloads\SIH2026-main (final)\SIH2026-main\ml\optimization"
python -m venv .venv-optimization
.\.venv-optimization\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Run

```powershell
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

Health:

GET http://localhost:8001/health

Optimization:

POST http://localhost:8001/optimize/vessel-plan

The optimizer does not invent route distance, transit time, fuel,
demurrage, port, or repositioning formulas. The current schema does not
contain enough information for those calculations.

`totalEstimatedCost` is therefore a transparent charter-cost score:
dailyCharterCost × used trips. It should not be presented as a complete
voyage-cost model until the project has an approved duration/distance/cost
formula.
