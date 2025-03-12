from datetime import datetime, timezone
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
from langgraph.graph import StateGraph, END, START
from langchain_core.messages import AIMessage
from app.core.config import get_settings

# from .tools import tools
from .state import AgentState

model = OpenAIModel(
    "gpt-4o-mini-2024-07-18",
    provider=OpenAIProvider(
        api_key=get_settings().appconfig.openai_api_key.get_secret_value()
    ),
)
pydantic_agent = Agent(model=model)


def should_continue(state):
    messages = state["messages"]
    last_message = messages[-1]
    if not last_message.tool_calls:
        return END
    else:
        return "tools"


class AnyArgsSchema(BaseModel):
    # By not defining any fields and allowing extras,
    # this schema will accept any input passed in.
    class Config:
        extra = "allow"


@pydantic_agent.tool_plain
def get_stock_price(stock: str):
    return {
        "AAPL": {
            "symbol": "AAPL",
            "company_name": "Apple Inc.",
            "current_price": 173.50,
            "change": 2.35,
            "change_percent": 1.37,
            "volume": 52436789,
            "market_cap": "2.73T",
            "pe_ratio": 28.5,
            "fifty_two_week_high": 198.23,
            "fifty_two_week_low": 124.17,
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        }
    }


async def agent(state: AgentState):
    query = state["messages"][-1].content
    q = " ".join(q["text"] for q in query)
    print(f"Query: {q}")
    result = await pydantic_agent.run(q)
    # We return a list, because this will get added to the existing list
    return {"messages": [AIMessage(content=result.data)]}


def create_workflow():
    # Define a new graph
    workflow = StateGraph(AgentState)

    workflow.add_node("agent", agent)

    workflow.add_edge(START, "agent")
    workflow.add_edge("agent", END)
    return workflow.compile()


assistant_ui_graph = create_workflow()
