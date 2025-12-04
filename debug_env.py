import sys
import os

print("Python Executable:", sys.executable)
print("Sys Path:", sys.path)

try:
    import fastapi
    print("FastAPI File:", fastapi.__file__)
except ImportError as e:
    print("FastAPI Import Failed:", e)

try:
    import uvicorn
    print("Uvicorn File:", uvicorn.__file__)
except ImportError as e:
    print("Uvicorn Import Failed:", e)
