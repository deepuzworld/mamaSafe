from textblob import TextBlob # pyre-ignore
import re # pyre-ignore
from typing import List, Dict, Any, cast

RED_FLAGS: Dict[str, List[str]] = {
    "command_thoughts": ["kill", "hurt", "die", "end it", "harm"],
    "delusions": ["they are watching", "someone else", "not my baby"],
    "insomnia": ["can't sleep", "no sleep", "awake for days", "haven't slept"]
}

def analyze_text(text: str) -> Dict[str, Any]:
    blob = TextBlob(text)
    sentiment: float = float(blob.sentiment.polarity) # -1 to 1

    # Map sentiment to risk score 0 to 100 (Negative sentiment = higher risk)
    # -1.0 -> 100, 1.0 -> 0
    base_score: float = 50.0 - (sentiment * 50.0) 
    
    flags: List[str] = []
    lower_text = text.lower()
    
    for flag_type, keywords in RED_FLAGS.items():
        for kw in keywords:
            if re.search(r'\b' + re.escape(kw) + r'\b', lower_text):
                flags.append(flag_type)
                # Escalate risk heavily if red flags are found
                base_score = float(base_score) + 30.0 # pyre-ignore
                break
                
    final_score = cast(float, min(max(base_score, 0.0), 100.0))
    
    return {
        "riskScore": float(int(final_score * 100) / 100.0), # Manual rounding to avoid round() issues
        "detectedFlags": list(set(flags))
    }
