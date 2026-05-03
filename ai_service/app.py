from fastapi import FastAPI, UploadFile, File, Form
import cv2
import numpy as np
import os
from deepface import DeepFace
from liveness_detection import LivenessDetector

app = FastAPI(title="MamaSafe Pro AI Face Verification")

# Initialize Liveness Detector
liveness_detector = LivenessDetector()

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Pro AI Microservice (DeepFace + Silent-Face-Anti-Spoofing)"}

@app.post("/ai/face/analyze")
async def analyze_face(
    file: UploadFile = File(...), 
    expected_challenge: str = Form(None)
):
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Invalid image"}

        # 1. Face Analysis (Gender, Age, Emotion for Smile)
        try:
            analysis = DeepFace.analyze(
                img_path=img, 
                actions=['gender', 'emotion'], 
                enforce_detection=True,
                detector_backend='retinaface' 
            )
        except Exception as e:
            # Face not detected or other error
            return {"faceDetected": False, "verified": False, "error": str(e)}

        if not analysis:
            return {"faceDetected": False, "verified": False}

        # Analysis is a list in recent deepface versions
        face_data = analysis[0]
        is_female = face_data['dominant_gender'] == 'Woman'
        
        # 2. Liveness Check (Anti-Spoofing)
        liveness_score, is_live = liveness_detector.predict(img)

        # 3. Challenge Layer
        challenge_passed = True
        if expected_challenge == "smile":
            # Check if dominant emotion is 'happy' or if 'happy' score is high
            challenge_passed = face_data['dominant_emotion'] == 'happy' or face_data['emotion']['happy'] > 50
        
        # verified logic: face must be detected, must be live, and must be female
        verified = is_live and is_female and challenge_passed

        return {
            "faceDetected": True,
            "livenessScore": liveness_score,
            "isLive": is_live,
            "isFemale": is_female,
            "gender": face_data['dominant_gender'],
            "challengePassed": challenge_passed,
            "verified": verified
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
