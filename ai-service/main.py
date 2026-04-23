from fastapi import FastAPI, BackgroundTasks # pyre-ignore
from pydantic import BaseModel # pyre-ignore
import sqlite3
import uuid
import json
import os
from analyzer import analyze_text # pyre-ignore

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Welcome to the MamaSafe AI Service. Server is running."}

# Point to the SQLite DB
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'backend', 'dev.db')

class AnalysisRequest(BaseModel):
    requestId: str
    userId: str
    sourceType: str
    sourceId: str

def process_analysis(req: AnalysisRequest) -> None:
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # 1. Fetch content based on source type
        content = ""
        if req.sourceType == 'journal':
            cursor.execute("SELECT content FROM JournalEntry WHERE journalId = ?", (req.sourceId,))
            row = cursor.fetchone()
            if row: content = row[0]
        elif req.sourceType == 'mood':
            cursor.execute("SELECT notes FROM MoodLog WHERE moodId = ?", (req.sourceId,))
            row = cursor.fetchone()
            if row and row[0]: content = row[0]
        
        if not content:
            # Mark as completed if no content to analyze
            cursor.execute("UPDATE AnalysisRequest SET status = 'completed' WHERE requestId = ?", (req.requestId,))
            conn.commit()
            conn.close()
            return
            
        # 2. Analyze
        result = analyze_text(content)
        
        # 3. Save result
        analysis_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO AnalysisResult (analysisId, requestId, riskScore, detectedFlags, createdAt)
            VALUES (?, ?, ?, ?, datetime('now'))
        """, (analysis_id, req.requestId, result['riskScore'], json.dumps(result['detectedFlags'])))
        
        # 4. Update request status
        cursor.execute("UPDATE AnalysisRequest SET status = 'completed' WHERE requestId = ?", (req.requestId,))
        
        # 5. Create alert if risk is critical
        if result['riskScore'] >= 80 or 'command_thoughts' in result['detectedFlags']:
            alert_id = str(uuid.uuid4())
            msg = f"Critical risk detected from your {req.sourceType}. Please consult a professional or use the Red Button if you are in crisis."
            cursor.execute("""
                INSERT INTO Alert (alertId, userId, riskLevel, message, resolved, createdAt)
                VALUES (?, ?, 'critical', ?, 0, datetime('now'))
            """, (alert_id, req.userId, msg))

        conn.commit()
        conn.close()
        print(f"Processed request {req.requestId}: Score {result['riskScore']}")
    except Exception as e:
        print(f"Error processing analysis {req.requestId}: {e}")

@app.post("/trigger")
def trigger_analysis(request: AnalysisRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(process_analysis, request)
    return {"success": True, "message": "Analysis processing in background"}

@app.get("/health")
def health():
    return {"status": "ok", "service": "MamaSafe AI Service"}
