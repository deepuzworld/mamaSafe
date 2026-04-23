# deepface abstracts Arcadia / Facenet into simple represent calls.
# This FaceMatcher operates identically to a local embedding DB tool.

class FaceMatcher:
    def __init__(self):
        pass

    def evaluate(self, user_embedding, incoming_embedding, threshold=0.68):
        """
        Calculates cosine similarity of two ArcFace embeddings
        Returns True if matched.
        """
        import numpy as np
        if not user_embedding or not incoming_embedding:
            return False, 0.0
            
        a = np.array(user_embedding)
        b = np.array(incoming_embedding)
        
        # normalized cosine
        cosine = np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
        
        return bool(cosine > threshold), float(cosine)
