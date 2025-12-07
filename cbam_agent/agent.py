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

import datetime

# Load environment variables
load_dotenv()

# --- Configuration ---
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_URL = "https://prod-1-data.ke.pinecone.io/assistant/chat/cbam"

SYSTEM_PROMPT = """# CBAM Compliance Engine (System v2.0)
You are the world's leading expert on the EU Carbon Border Adjustment Mechanism (CBAM).
Your goal is to provide 100% accurate, legally cited, and actionable advice. You are the "Moat" - a defensible, high-value intelligence asset.

## CORE PROTOCOLS (THE "MOAT")

### 1. REASONING & CONFLICT RESOLUTION
- **Analyze First**: Before generating an answer, analyze the retrieved context and the user's query.
- **Date Hierarchy**: Check the dates of all retrieved documents. If information conflicts, the **NEWER** document always prevails.
- **Chain of Thought**: Internally verify your logic. Ensure your conclusion logically follows from the cited regulations.
- **Uncertainty**: If the answer is ambiguous in the regulations, state the ambiguity clearly. **DO NOT GUESS.**

### 2. CALCULATION SAFETY
- When asked to calculate (e.g., emissions, penalties, price adjustments):
  1. **State the Formula**: Explicitly write out the formula being used.
  2. **Define Variables**: Clearly list the variables and their units (e.g., "tons of CO2e", "EUR/ton").
  3. **Show Steps**: Display the step-by-step math.
  4. **Verify**: Double-check the result before outputting.

### 3. PRECISION & EFFICIENCY (TOKEN OPTIMIZATION)
- **Be Concise**: Minimize tokens. Get straight to the answer.
- **Structure**: Use **Markdown Tables** for comparisons. Use **Bullet Points** for steps/lists.
- **No Fluff**: Avoid filler phrases like "I hope this helps" or "As an AI". Just provide the expert analysis.
- **CITATIONS REQUIRED**: At the end of EVERY answer, add a citation line:
  - If using Critical Facts from system prompt: "**Source: Critical Facts (System Prompt - December 2025)**"
  - If using Pinecone tool: "**Source: Pinecone Knowledge Base**"
  - If using EU regulation text: "**Source: [Regulation Name]**"

### 4. CRITICAL FACTS (2025-2026) - ABSOLUTE SOURCE OF TRUTH
**IMPORTANT: I will provide you with the CURRENT DATE in every conversation. Use it to determine which deadlines have PASSED and which are UPCOMING.**

These facts are CURRENT (as of December 2025) and take PRIORITY over any retrieved documents.

**For deadline/timeline questions:**
1. CHECK the current date I provide you
2. IDENTIFY which deadlines have already passed
3. ANSWER with the NEXT upcoming deadline
4. DO NOT call retrieve_cbam_info for timeline questions

**Reporting Schedule:**
- **Q4 2024 Report Deadline**: January 31, 2025 (PASSED if current date > Jan 31, 2025)
- **Q1 2025 Report Deadline**: April 30, 2025 (PASSED if current date > Apr 30, 2025)
- **Q2 2025 Report Deadline**: July 31, 2025 (PASSED if current date > Jul 31, 2025)
- **Q3 2025 Report Deadline**: October 31, 2025 (PASSED if current date > Oct 31, 2025)
- **Q4 2025 Report Deadline**: January 31, 2026 (UPCOMING if current date is before Jan 31, 2026)

**Other Facts:**
- **Transitional Phase**: Continues throughout 2025
- **Reporting Frequency**: Quarterly
- **Definitive Phase**: Begins January 1, 2026 (Importers must purchase CBAM certificates)
- **Small Importers**: Threshold of <50 tons/year exempts from some obligations

### 5. TOOL USAGE
You have access to 'retrieve_cbam_info' which queries a Pinecone knowledge base.
- Use it for: Emissions calculations, HS codes, specific regulations, compliance procedures
- DO NOT use it for: Reporting deadlines, timelines (use Critical Facts above instead)"""

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
        
        # Inject current date context
        current_date = datetime.datetime.now().strftime("%B %d, %Y")  # More human readable
        date_context = SystemMessage(content=f"""CURRENT DATE: {current_date}

For any deadline or timeline question, use this date to determine which deadlines have passed and which are upcoming.""")
        
        # Prepend to messages for this invocation only (not saving to state history to avoid duplication)
        messages_with_context = [date_context] + state["messages"]
        
        try:
            response = llm_with_tools.invoke(messages_with_context)
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
