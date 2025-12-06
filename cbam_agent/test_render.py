import requests
import json
import time

WEBHOOK_URL = "https://cbam-agent.onrender.com/webhook"

print(f"Testing connection to: {WEBHOOK_URL}")
print("Sending request... (This might take ~50s if the server is sleeping)")

payload = {
    "input": "Hello, are you online?",
    "sessionId": "test-diagnostic"
}

try:
    start_time = time.time()
    response = requests.post(WEBHOOK_URL, json=payload, timeout=120)
    end_time = time.time()
    
    print(f"\nResponse Status: {response.status_code}")
    print(f"Time taken: {end_time - start_time:.2f} seconds")
    
    if response.status_code == 200:
        print("\nSuccess! Server Response:")
        print(response.json())
    else:
        print(f"\nError: Server returned status {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"\nConnection Failed: {e}")
