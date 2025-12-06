import requests
import json
import uuid

# Configuration
WEBHOOK_URL = "https://cbam-agent.onrender.com/webhook"

def test_agent():
    print(f"Querying CBAg at {WEBHOOK_URL}...")
    
    # Sample question
    question = "When is the next reporting deadline for 2025?"
    print(f"\nQuestion: {question}")
    
    payload = {
        "input": question,
        "sessionId": f"test_user_{uuid.uuid4()}"
    }
    
    try:
        response = requests.post(WEBHOOK_URL, json=payload, timeout=60)
        response.raise_for_status()
        
        data = response.json()
        print("\n--- CBAg Response ---")
        print(data.get("output", "No output field found"))
        print("---------------------")
        
    except Exception as e:
        print(f"\nError: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"Status Code: {e.response.status_code}")
            print(f"Response Content: {e.response.text}")

if __name__ == "__main__":
    test_agent()
