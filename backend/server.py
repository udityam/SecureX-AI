import json
import tempfile
import os
from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from xhtml2pdf import pisa
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import ollama
import pymupdf
import easyocr
import io
import cv2
import numpy as np
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from datetime import datetime, timezone

load_dotenv()

app = FastAPI(title="SecureX AI API")
reader = easyocr.Reader(['en'], gpu=False)

SQLALCHEMY_DATABASE_URL = "sqlite:///./securex.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ScanRecord(Base):
    __tablename__ = "scan_history"
    id = Column(Integer, primary_key=True, index=True)
    content_scanned = Column(Text)
    threat_level = Column(String)
    risk_score = Column(Integer)
    threat_type = Column(String)
    indicators = Column(Text)
    recommended_action = Column(Text)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class AnalyzeRequest(BaseModel):
    content: str = Field(..., description="The suspicious email, text message, or URL to analyze.")

class BaitRequest(BaseModel):
    original_threat: str = Field(..., description="The original threat text to generate bait for.")

class ThreatAnalysis(BaseModel):
    target: str = Field(..., description="The analyzed content or its primary subject.")
    threat_level: str = Field(..., description="Threat level: LOW, MEDIUM, HIGH, or CRITICAL.")
    risk_score: int = Field(..., description="Risk score from 0 to 100.")
    threat_type: str = Field(..., description="Type of threat (e.g., Phishing, Malware, Spam, None).")
    indicators: list[str] = Field(..., description="List of reasons or indicators explaining the score.")
    recommended_action: str = Field(..., description="Action recommended for the user to take.")

def apply_security_guardrails(content: str, analysis: dict) -> dict:
    content_lower = content.lower()
    
    suspicious_tlds = [".xyz", ".cc", ".top", ".buzz", ".work", ".tk"]
    has_suspicious_tld = any(tld in content_lower for tld in suspicious_tlds)
    has_qr_payload = "[hidden qr code payload detected]" in content_lower
    
    invoice_keywords = ["geeksquad", "norton", "mcafee", "subscription auto-renewal", "refund-portal"]
    money_triggers = ["$", "refund", "charge", "cancellation department", "deducted"]
    has_invoice_keyword = any(kw in content_lower for kw in invoice_keywords)
    has_money_trigger = any(mt in content_lower for mt in money_triggers)
    
    indicators = analysis.get("indicators", [])
    if not isinstance(indicators, list):
        indicators = []
        
    if has_suspicious_tld or has_qr_payload:
        analysis["threat_level"] = "CRITICAL"
        analysis["risk_score"] = max(analysis.get("risk_score", 0) if isinstance(analysis.get("risk_score", 0), int) else 0, 90)
        indicators.append("SYSTEM OVERRIDE: Deterministic Critical Threat Detected (Suspicious TLD or QR Payload)")
        analysis["indicators"] = indicators
    elif has_invoice_keyword and has_money_trigger:
        analysis["threat_level"] = "HIGH"
        analysis["risk_score"] = max(analysis.get("risk_score", 0) if isinstance(analysis.get("risk_score", 0), int) else 0, 85)
        indicators.append("SYSTEM OVERRIDE: Deterministic High Threat Detected (Fake Invoice Pattern)")
        analysis["indicators"] = indicators
        
    return analysis

@app.post("/api/analyze", response_model=ThreatAnalysis)
async def analyze_threat(request: AnalyzeRequest, db: Session = Depends(get_db)):
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty.")

    # Upgraded instruction with strict Rule-Based Mapping to fix the False Lows
    system_instruction = """
You are the core intelligence engine for SecureX AI, an expert Tier-3 Cybersecurity SOC Analyst.
Evaluate the input for cyber threats. You must return a strictly formatted JSON response.

CRITICAL LOGIC MAPPING (YOU MUST STRICTLY FOLLOW THESE RULES FOR "threat_level"):
1. SUSPICIOUS DOMAINS: If the input contains a suspicious TLD (.xyz, .cc, .top) OR a domain that mismatches the claimed sender, you MUST output "threat_level": "CRITICAL".
2. FAKE INVOICES: If the input is a subscription renewal (GeekSquad, Norton, etc.) with a refund link or phone number, you MUST output "threat_level": "HIGH".
3. QUISHING: If the input contains "[HIDDEN QR CODE PAYLOAD DETECTED]", you MUST output "threat_level": "CRITICAL".
4. SAFE DATA: If the input is ONLY a standalone email address or normal text with NO links, NO domains, and NO urgency, you MUST output "threat_level": "LOW".

Do not contradict yourself. If you identify typosquatting or a fake invoice in the indicators, the threat_level CANNOT be LOW.
"""

    try:
        response = ollama.chat(
            model='deepseek-r1:7b',
            messages=[
                {'role': 'system', 'content': system_instruction},
                {'role': 'user', 'content': request.content}
            ],
            format=ThreatAnalysis.model_json_schema(),
            options={'temperature': 0.0}
        )
        
        # The response is guaranteed to be a JSON string matching the schema
        analysis_data = json.loads(response['message']['content'])
        
        # Apply deterministic hybrid guardrails
        analysis_data = apply_security_guardrails(request.content, analysis_data)
        
        # Save to DB
        new_record = ScanRecord(
            content_scanned=request.content,
            threat_level=analysis_data.get("threat_level"),
            risk_score=analysis_data.get("risk_score"),
            threat_type=analysis_data.get("threat_type"),
            indicators=json.dumps(analysis_data.get("indicators", [])),
            recommended_action=analysis_data.get("recommended_action")
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return analysis_data

    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))
def extract_text_with_ocr(file_bytes: bytes, filename: str) -> str:
    extracted_text = ""
    lower_filename = filename.lower()
    detector = cv2.QRCodeDetector()
    
    if lower_filename.endswith(".pdf"):
        doc = pymupdf.open(stream=file_bytes, filetype='pdf')
        for page in doc:
            text = page.get_text()
            if text and text.strip():
                extracted_text += text + "\n"
            
            # If native text is sparse or images exist, run OCR
            if len(text.strip()) < 50 or page.get_image_info():
                pix = page.get_pixmap()
                img_bytes = pix.tobytes("png")
                
                # Check for QR Code
                np_arr = np.frombuffer(img_bytes, np.uint8)
                cv2_image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
                if cv2_image is not None:
                    data, bbox, straight_qrcode = detector.detectAndDecode(cv2_image)
                    if data:
                        extracted_text += f"[HIDDEN QR CODE PAYLOAD DETECTED]: {data}\n"

                ocr_results = reader.readtext(img_bytes, detail=0)
                extracted_text += " ".join(ocr_results) + "\n"
    elif lower_filename.endswith((".png", ".jpg", ".jpeg")):
        # Check for QR Code
        np_arr = np.frombuffer(file_bytes, np.uint8)
        cv2_image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if cv2_image is not None:
            data, bbox, straight_qrcode = detector.detectAndDecode(cv2_image)
            if data:
                extracted_text += f"[HIDDEN QR CODE PAYLOAD DETECTED]: {data}\n"

        ocr_results = reader.readtext(file_bytes, detail=0)
        extracted_text += " ".join(ocr_results) + "\n"
        
    return extracted_text

@app.post("/api/analyze-file", response_model=ThreatAnalysis)
async def analyze_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.lower().endswith((".pdf", ".png", ".jpg", ".jpeg")):
        raise HTTPException(status_code=400, detail="Only PDF and Image files are supported.")
        
    try:
        file_bytes = await file.read()
        extracted_text = extract_text_with_ocr(file_bytes, file.filename)
                
        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the file.")
            
        SYSTEM_INSTRUCTION = """
You are the core intelligence engine for SecureX AI, an expert Tier-3 Cybersecurity SOC Analyst.
Evaluate the input for cyber threats. You must return a strictly formatted JSON response.

CRITICAL LOGIC MAPPING (YOU MUST STRICTLY FOLLOW THESE RULES FOR "threat_level"):
1. SUSPICIOUS DOMAINS: If the input contains a suspicious TLD (.xyz, .cc, .top) OR a domain that mismatches the claimed sender, you MUST output "threat_level": "CRITICAL".
2. FAKE INVOICES: If the input is a subscription renewal (GeekSquad, Norton, etc.) with a refund link or phone number, you MUST output "threat_level": "HIGH".
3. QUISHING: If the input contains "[HIDDEN QR CODE PAYLOAD DETECTED]", you MUST output "threat_level": "CRITICAL".
4. SAFE DATA: If the input is ONLY a standalone email address or normal text with NO links, NO domains, and NO urgency, you MUST output "threat_level": "LOW".

Do not contradict yourself. If you identify typosquatting or a fake invoice in the indicators, the threat_level CANNOT be LOW.
"""

        response = ollama.chat(
            model='deepseek-r1:7b',
            messages=[
                {'role': 'system', 'content': SYSTEM_INSTRUCTION},
                {'role': 'user', 'content': extracted_text}
            ],
            format=ThreatAnalysis.model_json_schema(),
            options={'temperature': 0.0}
        )
        
        analysis_data = json.loads(response['message']['content'])
        
        # Apply deterministic hybrid guardrails
        analysis_data = apply_security_guardrails(extracted_text, analysis_data)
        
        new_record = ScanRecord(
            content_scanned=f"[File: {file.filename}] {extracted_text}",
            threat_level=analysis_data.get("threat_level"),
            risk_score=analysis_data.get("risk_score"),
            threat_type=analysis_data.get("threat_type"),
            indicators=json.dumps(analysis_data.get("indicators", [])),
            recommended_action=analysis_data.get("recommended_action")
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)
        
        return analysis_data

    except Exception as e:
        print(f"Error during file analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

BAIT_SYSTEM_INSTRUCTION = """
You are to waste a scammer's time by acting as bait.
RULES:
1. Pretend to be a naive, vulnerable user who is easily confused.
2. Ask a mildly confused technical question to keep the attacker on the hook (e.g., asking how to find a button, or what a word means).
3. Do NOT reveal you are an AI. Act completely human.
4. Keep the response under 150 words.
"""

@app.post("/api/generate-bait")
async def generate_bait(request: BaitRequest):
    try:
        response = ollama.chat(
            model='deepseek-r1:7b',
            messages=[
                {'role': 'system', 'content': BAIT_SYSTEM_INSTRUCTION},
                {'role': 'user', 'content': request.original_threat}
            ],
            options={'temperature': 0.7}
        )
        return {"bait_response": response['message']['content']}
    except Exception as e:
        print(f"Error generating bait: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    records = db.query(ScanRecord).order_by(ScanRecord.timestamp.desc()).limit(50).all()
    history = []
    for r in records:
        history.append({
            "id": r.id,
            "content_scanned": r.content_scanned,
            "threat_level": r.threat_level,
            "risk_score": r.risk_score,
            "threat_type": r.threat_type,
            "indicators": json.loads(r.indicators) if r.indicators else [],
            "recommended_action": r.recommended_action,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None
        })
    return history

@app.get("/api/report/{scan_id}")
def generate_report(scan_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    record = db.query(ScanRecord).filter(ScanRecord.id == scan_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Scan record not found.")

    indicators_list = json.loads(record.indicators) if record.indicators else []
    indicators_html = "".join([f"<li>{ind}</li>" for ind in indicators_list])
    
    import html
    safe_content = html.escape(record.content_scanned or "")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @page {{ margin: 1cm; background-color: #ffffff; }}
            body {{ font-family: Courier, monospace; color: #000000; background-color: #ffffff; }}
            .header {{ background-color: #000000; padding: 15px; border-bottom: 3px solid #00f0ff; text-align: center; }}
            .header h1 {{ margin: 0; color: #ffffff; font-weight: bold; letter-spacing: 2px; }}
            .header p {{ margin: 5px 0 0 0; color: #00f0ff; }}
            .section {{ margin-top: 20px; padding: 15px; border: 1px solid #000000; background-color: #f8f8f8; }}
            table {{ width: 100%; border-collapse: collapse; background-color: #ffffff; }}
            td {{ padding: 8px; border: 1px solid #000000; }}
            .key {{ color: #000000; font-weight: bold; width: 30%; background-color: #e0e0e0; }}
            .val {{ color: #000000; font-weight: bold; }}
            .highlight {{ background-color: #ffffff; border: 1px solid #000000; border-left: 5px solid #00f0ff; padding: 10px; margin-top: 10px; color: #000000; font-weight: bold; }}
            h2 {{ color: #ffffff; background-color: #000000; padding: 8px; margin-top: 0; font-size: 16px; }}
            ul {{ padding-left: 20px; color: #000000; margin-top: 10px; }}
            li {{ margin-bottom: 5px; }}
            .scanned-content {{ white-space: pre-wrap; background-color: #ffffff; padding: 10px; border: 1px dashed #000000; font-size: 12px; color: #000000; word-break: break-all; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>SECUREX_AI THREAT REPORT</h1>
            <p>Automated Cyber-Ops Analysis</p>
        </div>
        
        <div class="section">
            <h2>&gt; INCIDENT SUMMARY</h2>
            <table>
                <tr><td class="key">REPORT ID:</td><td class="val">#{record.id}</td></tr>
                <tr><td class="key">DATE:</td><td class="val">{record.timestamp.strftime('%Y-%m-%d %H:%M:%S') if record.timestamp else 'N/A'}</td></tr>
                <tr><td class="key">SEVERITY:</td><td class="val">{record.threat_level}</td></tr>
                <tr><td class="key">TARGET TYPE:</td><td class="val">{record.threat_type}</td></tr>
                <tr><td class="key">RISK SCORE:</td><td class="val">{record.risk_score}/100</td></tr>
            </table>
        </div>
        
        <div class="section">
            <h2>&gt; SCANNED PAYLOAD</h2>
            <div class="scanned-content">{safe_content}</div>
        </div>
        
        <div class="section">
            <h2>&gt; INDICATORS OF COMPROMISE</h2>
            <ul>
                {indicators_html}
            </ul>
        </div>
        
        <div class="section">
            <h2>&gt; RECOMMENDED ACTIONS</h2>
            <div class="highlight">{record.recommended_action}</div>
        </div>
    </body>
    </html>
    """
    
    fd, temp_path = tempfile.mkstemp(suffix=".pdf")
    os.close(fd)
    
    with open(temp_path, "w+b") as result_file:
        pisa.CreatePDF(html_content, dest=result_file)
    
    background_tasks.add_task(os.remove, temp_path)
    
    return FileResponse(
        temp_path, 
        media_type='application/pdf', 
        filename=f'SecureX_Report_{scan_id}.pdf'
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
