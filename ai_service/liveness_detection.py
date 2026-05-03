import cv2
import numpy as np
from deepface import DeepFace

class LivenessDetector:
    def __init__(self):
        # DeepFace handles the model loading internally when anti_spoofing=True is passed to analyze or extract_faces
        pass

    def predict(self, frame):
        """
        Takes a BGR image (OpenCV format) and runs Passive Liveness Detection using DeepFace (Silent-Face-Anti-Spoofing).
        Returns: (liveness_score, is_live_boolean)
        """
        try:
            # We use extract_faces with anti_spoofing=True
            # This will use the Silent-Face-Anti-Spoofing model internally
            results = DeepFace.extract_faces(
                img_path=frame, 
                enforce_detection=False, 
                anti_spoofing=True
            )
            
            if not results:
                return 0.0, False
            
            # DeepFace returns is_real boolean in the results
            is_live = results[0].get("is_real", False)
            # Use antispoof_score if available for a moving percentage, otherwise default to boolean mapping
            score = results[0].get("antispoof_score", 1.0 if is_live else 0.0)
            
            return score, is_live

        except Exception as e:
            print(f"Liveness detection error: {e}")
            return 0.0, False
