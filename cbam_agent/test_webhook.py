import requests
import json
import time

def test_webhook():
    url = "http://localhost:8080/webhook"
    payload = {
        "input": "What is the purpose of CBAM?",
        "sessionId": "test-session-verification"
    }
    
    print(f"Sending request to {url}...")
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        print("Response Status:", response.status_code)
        print("Response Body:")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Request failed: {e}")
        if 'response' in locals():
            print("Response text:", response.text)

if __name__ == "__main__":
    # Wait a bit for server to start if running immediately after
    time.sleep(2) 
    test_webhook()
