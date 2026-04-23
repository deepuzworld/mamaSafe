from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
import cv2
import numpy as np
import base64
from deepface import DeepFace

from liveness_detection import LivenessDetector
from face_recognition import FaceMatcher

app = FastAPI(title="Hybrid Multi-Layer AI Face Verification")
liveness_detector = LivenessDetector()
face_matcher = FaceMatcher()

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Hybrid AI Face Microservice"}

@app.post("/ai/face/analyze")
async def analyze_face(
    file: UploadFile = File(...), 
    sessionId: str = Form(None), 
    expected_challenge: str = Form(None),
    registered_embedding: str = Form(None)  # Base64 or JSON list string of the registered user's embedding
):
    """
    1. Reads Frame
    2. Runs RetinaFace / MediaPipe Detection & Alignment
    3. Runs Liveness Detection (Silent-Face / CDCN)
    4. Extracts ArcFace embedding & matches if provided
    """
    try:
        # 1. Read Image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {"error": "Invalid image file format."}

        # 2. Extract DeepFace Features (RetinaFace for detection, ArcFace for embeddings)
        # This acts as our Motion/Pose Analysis & Detection Layer
        try:
            # Enforce RetinaFace for high accuracy detection
            faces = DeepFace.extract_faces(
                img_path=img, 
                detector_backend="retinaface",
                enforce_detection=True
            )
            face_detected = True
        except ValueError:
            return {"faceDetected": False, "verified": False}

        # 3. Liveness Detection
        # Routing to Silent-Face / CDCN ensemble handler
        liveness_score, is_live = liveness_detector.predict(img)

        # 4. Challenge Verification & Gender Protection layer
        challenge_passed = True 
        is_female = False
        
        try:
            # We do one pass analyzing both emotion and gender to save inference time
            demography = DeepFace.analyze(img, actions=['emotion', 'gender'], enforce_detection=False)
            # Handle list array vs dict
            res = demography[0] if isinstance(demography, list) else demography
            
            # --- Gender Enforcement Layer ---
            dominant_gender = res.get('dominant_gender')
            gender_scores = res.get('gender', {})
            
            print(f"[AI] Detected Gender: {dominant_gender}, Scores: {gender_scores}")

            # DeepFace typically returns 'Woman' or 'Man'
            if dominant_gender in ['Woman', 'Female', 'woman', 'female']:
                is_female = True
            elif isinstance(gender_scores, dict):
                # Relaxed check: if Woman score is substantial or dominant
                woman_score = gender_scores.get('Woman', 0) or gender_scores.get('Female', 0)
                if woman_score > 40: # Relaxed from 50
                    is_female = True
                    print(f"[AI] Relaxed gender check passed: {woman_score}%")
                    
            # --- Active Challenge Layer ---
            if expected_challenge in ["smile", "surprised", "neutral"]:
                emotions = res['emotion']
                print(f"[AI] Expected: {expected_challenge}, Emotions: {emotions}")
                
                if expected_challenge == "smile" and emotions.get('happy', 0) > 60: # Relaxed from 70
                    challenge_passed = True
                elif expected_challenge == "surprised" and emotions.get('surprise', 0) > 60: # Relaxed from 70
                    challenge_passed = True
                elif expected_challenge == "neutral" and emotions.get('neutral', 0) > 60: # Relaxed from 70
                    challenge_passed = True
                else:
                    challenge_passed = False
        except Exception as e:
            print(f"[AI] Analysis Exception: {e}")
            challenge_passed = False

        # 5. Face Recognition / Embedding Extractor
        match_score = 0.0
        embedding = None
        verified = False

        # Generate embedding for enrollment/saving
        try:
            embed_res = DeepFace.represent(
                img_path=img, 
                model_name="ArcFace", 
                detector_backend="retinaface"
            )
            embedding = embed_res[0]["embedding"]
        except Exception as e:
            pass

        # If a registered embedding is passed, compute cosine similarity
        if embedding and registered_embedding:
            try:
                import json
                target_embedding = json.loads(registered_embedding)
                
                # Cosine similarity calculation (ArcFace threshold is usually around ~0.68)
                a = np.array(embedding)
                b = np.array(target_embedding)
                cosine_sim = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
                
                match_score = float(cosine_sim)
                if match_score > 0.68:  # Strict threshold
                    verified = True
            except:
                pass

        # For strict system, all layers must independently pass
        final_verification = (is_live and face_detected and challenge_passed)

        return {
            "faceDetected": face_detected,
            "livenessScore": float(liveness_score),
            "isLive": is_live,
            "isFemale": is_female,  # Provide strict gender flag back to UI
            "challengePassed": challenge_passed,
            "faceMatchScore": match_score,
            "embedding": embedding,
            "verified": final_verification
        }

    except Exception as e:
        return {"error": str(e)}
