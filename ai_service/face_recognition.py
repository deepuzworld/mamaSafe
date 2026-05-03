from deepface import DeepFace
import numpy as np

class FaceMatcher:
    def __init__(self, model_name='VGG-Face', distance_metric='cosine'):
        self.model_name = model_name
        self.distance_metric = distance_metric

    def evaluate(self, user_embedding, incoming_embedding, threshold=None):
        """
        Compares two embeddings.
        If threshold is None, uses default deepface thresholds.
        """
        if not user_embedding or not incoming_embedding:
            return False, 0.0
            
        a = np.array(user_embedding)
        b = np.array(incoming_embedding)
        
        # normalized cosine
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return False, 0.0
            
        cosine = np.dot(a, b) / (norm_a * norm_b)
        
        # DeepFace default threshold for VGG-Face with cosine is ~0.4
        # Note: DeepFace.verify returns 'verified' based on its own internal thresholds.
        # Here we are comparing embeddings directly.
        
        if threshold is None:
            threshold = 0.4 # Default for VGG-Face cosine
            
        return bool(cosine > (1 - threshold)), float(cosine)

    def get_embedding(self, img_path):
        """
        Generates embedding for an image.
        """
        try:
            embeddings = DeepFace.represent(img_path=img_path, model_name=self.model_name, enforce_detection=False)
            if embeddings:
                return embeddings[0]["embedding"]
        except Exception as e:
            print(f"Error getting embedding: {e}")
        return None
