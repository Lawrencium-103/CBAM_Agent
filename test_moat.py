import requests
import json
import uuid

# Configuration
WEBHOOK_URL = "https://cbam-agent.onrender.com/webhook"

def parse_output(output):
    """Parse the output which might be a string or array format"""
    if isinstance(output, str):
        return output
    elif isinstance(output, list):
        # Extract text from array of objects
        texts = []
        for item in output:
            if isinstance(item, dict) and 'text' in item:
                texts.append(item['text'])
        return '\n'.join(texts)
    return str(output)

def test_moat():
    print(f"Testing 'Moat' Protocols at {WEBHOOK_URL}...\n")
    print("="*80)
    
    # Test 1: Calculation Protocol
    query_calc = "Calculate the specific embedded emissions for 500 tons of steel with 1200 tons of CO2e total emissions."
    print(f"\n--- TEST 1: CALCULATION SAFETY ---")
    print(f"Q: {query_calc}\n")
    
    payload_calc = {
        "input": query_calc,
        "sessionId": f"test_moat_calc_{uuid.uuid4()}"
    }
    
    try:
        response = requests.post(WEBHOOK_URL, json=payload_calc, timeout=60)
        response.raise_for_status()
        data = response.json()
        output = parse_output(data.get('output', 'No output'))
        print(f"A:\n{output}\n")
        print("="*80)
    except Exception as e:
        print(f"Error: {e}\n")

    # Test 2: Comparison Protocol (Token Efficiency)
    query_compare = "Compare the reporting requirements for the transitional phase vs the definitive phase."
    print(f"\n--- TEST 2: TOKEN EFFICIENCY (TABLE) ---")
    print(f"Q: {query_compare}\n")
    
    payload_compare = {
        "input": query_compare,
        "sessionId": f"test_moat_compare_{uuid.uuid4()}"
    }
    
    try:
        response = requests.post(WEBHOOK_URL, json=payload_compare, timeout=60)
        response.raise_for_status()
        data = response.json()
        output = parse_output(data.get('output', 'No output'))
        print(f"A:\n{output}\n")
        print("="*80)
    except Exception as e:
        print(f"Error: {e}\n")

if __name__ == "__main__":
    test_moat()
