import os
import requests
import json
from typing import Annotated, TypedDict, List
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver

# Load environment variables
load_dotenv()

# --- Configuration ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_URL = "https://prod-1-data.ke.pinecone.io/assistant/chat/cbam"

SYSTEM_PROMPT = """# CBAM Professional Assistant
You are an AI specialized in the Carbon Border Adjustment Mechanism (CBAM). Your role is to provide precise, factual, and explanatory assistance on CBAM compliance.

Leverage your capabilities to analyze CBAM regulations, interpret data points (e.g., emissions, CN codes), perform necessary calculations, and present accurate facts regarding reporting and obligations.

Always cite relevant CBAM legal texts, official guidance, or specific provided data sources for all factual statements and calculations.
You have access to a tool 'retrieve_cbam_info' which queries a Pinecone knowledge base. USE IT for any CBAM related questions."""

# --- Tools ---
@tool
def retrieve_cbam_info(query: str) -> str:
    """
    Queries the Pinecone Assistant for information related to CBAM (Carbon Border Adjustment Mechanism).
    Use this tool to get factual answers, legal text references, and official guidance.
    """
    if not PINECONE_API_KEY:
        return "Error: PINECONE_API_KEY not configured."

    headers = {
        "Api-Key": PINECONE_API_KEY,
        "X-Pinecone-API-Version": "2025-01",
        "Content-Type": "application/json"
    }
    
    payload = {
        "messages": [
            {
                "role": "user",
                "content": query
            }
        ],
        "stream": False,
        "model": "gpt-4o",
        "include_highlights": True
    }

    try:
        response = requests.post(PINECONE_URL, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # Extract the assistant's reply from the Pinecone response
        # The structure depends on Pinecone's API, assuming standard chat completion-like or specific structure
        # Based on n8n node, it seems to return a JSON that n8n parses. 
        # Let's try to extract the content from the first choice/message.
        # If the structure is unknown, we return the whole JSON text for the LLM to parse, 
        # but ideally we extract the 'content'.
        
        # Common structure check (adjust if Pinecone Assistant differs)
        if "choices" in data and len(data["choices"]) > 0:
             return data["choices"][0]["message"]["content"]
        elif "message" in data:
            return data["message"]["content"]
        else:
            return json.dumps(data) # Fallback: return raw JSON

    except Exception as e:
        return f"Error querying Pinecone: {str(e)}"

from langgraph.graph.message import add_messages

# --- State ---
class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]

# --- Graph Construction ---
def create_agent_graph():
    # Initialize Model
    llm = ChatGoogleGenerativeAI(model="gemini-flash-latest", temperature=0)
    
    # Bind tools
    tools = [retrieve_cbam_info]
    llm_with_tools = llm.bind_tools(tools)

    # Define Nodes
    def chatbot(state: AgentState):
        print("--- Chatbot Node ---")
        print(f"Messages count: {len(state['messages'])}")
        # print(f"Messages: {state['messages']}")
        try:
            response = llm_with_tools.invoke(state["messages"])
            return {"messages": [response]}
        except Exception as e:
            print(f"LLM Invocation Error: {e}")
            raise e

    # Build Graph
    graph_builder = StateGraph(AgentState)
    
    graph_builder.add_node("chatbot", chatbot)
    graph_builder.add_node("tools", ToolNode(tools))
    
    graph_builder.set_entry_point("chatbot")
    
    graph_builder.add_conditional_edges(
        "chatbot",
        tools_condition,
    )
    graph_builder.add_edge("tools", "chatbot")

    # Add memory for persistence (optional, useful for threaded webhooks)
    memory = MemorySaver()
    
    return graph_builder.compile(checkpointer=memory)

# Global instance
agent_app = create_agent_graph()
