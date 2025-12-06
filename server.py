from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
import uvicorn
import os
from langchain_core.messages import HumanMessage, SystemMessage

from agent import agent_app, SYSTEM_PROMPT

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="CBAM Agent Webhook")

# Add CORS Middleware to allow requests from any origin (including local files)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=False, # Must be False when using wildcard origin
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

class WebhookInput(BaseModel):
    input: str
    sessionId: Optional[str] = "default"

@app.options("/webhook")
async def options_webhook():
    return {}

@app.post("/webhook")
async def webhook(payload: WebhookInput):
    """
    Webhook endpoint compatible with n8n structure.
    Expects JSON: {"input": "User query", "sessionId": "optional-id"}
    """
    try:
        user_input = payload.input
        thread_id = payload.sessionId
        
        config = {"configurable": {"thread_id": thread_id}}
        
        # Prepare initial state
        # We check if this is a new conversation (no history in memory) to add system prompt
        # For simplicity in this stateless-like webhook, we can just prepend system prompt if it's the first message
        # Or we can rely on the agent to always have it. 
        # LangGraph memory persists state.
        
        # We'll just pass the user message. If the graph has history, it appends.
        # To ensure System Prompt is always respected, we can check history or just rely on the model instructions if we were using a system-message-enabled model class directly.
        # Here we construct the input messages.
        
        # Check if history exists for this thread (mock check, or just send System+User for safety if we want to enforce it every time, 
        # but LangGraph memory handles history. Let's just send User message, 
        # BUT we need to ensure the System Prompt is part of the context. 
        # A common pattern is to initialize the state with SystemMessage if it's empty.
        
        # We can't easily peek into checkpointer here without internal access, 
        # so we'll define a specialized input handling.
        
        # Actually, let's just send the user message. 
        # If we want to force the system prompt, we can modify the agent.py to always prepend it if missing, 
        # or just send it as the first message of the conversation.
        
        messages = [HumanMessage(content=user_input)]
        
        # If it's a fresh thread, we might want to prepend SystemMessage.
        # For now, let's assume the agent needs the system prompt.
        # We'll fetch the state first to see if it's empty.
        snapshot = agent_app.get_state(config)
        if not snapshot.values:
             messages.insert(0, SystemMessage(content=SYSTEM_PROMPT))

        # Run the agent
        final_state = agent_app.invoke(
            {"messages": messages},
            config=config
        )
        
        # Extract the last AI message
        last_message = final_state["messages"][-1]
        response_text = last_message.content
        
        return {
            "output": response_text,
            "thread_id": thread_id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8080, reload=True)

# Force Update: 12/06/2025 14:51:32
