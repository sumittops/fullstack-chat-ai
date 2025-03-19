from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.usage import UsageLimits
from pydantic_ai.exceptions import UnexpectedModelBehavior
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.models.gemini import GeminiModel
from pydantic_ai.providers.openai import OpenAIProvider
from pydantic_ai.providers.google_gla import GoogleGLAProvider
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.logger import get_logger
from app.api.deps import get_session, get_current_user
from app.core.config import get_settings
from app.core.database_session import get_async_session
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.models.thread import Thread
from app.schemas.requests import ThreadChatMessageRequest
from app.schemas.responses import (
    ChatMessageResponse,
    CreateThreadResponse,
    ThreadDetailResponse,
    ThreadListResponse,
)

router = APIRouter()
_logger = get_logger(__name__)


@router.get("", response_model=list[ThreadListResponse])
async def get_threads(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    threads = await session.execute(
        select(Thread)
        .where(Thread.user_id == user.id)
        .order_by(Thread.create_time.desc())
    )
    threads = threads.scalars().all()
    if not threads or len(threads) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has no threads",
        )
    return threads


def to_chat_message_response(message: ModelMessage) -> ChatMessageResponse:
    first_part = message.parts[0]
    if isinstance(message, ModelRequest):
        if isinstance(first_part, UserPromptPart):
            return ChatMessageResponse(
                role="user",
                content_type="text",
                content=first_part.content,
                create_time=first_part.timestamp.isoformat(),
            )
    elif isinstance(message, ModelResponse):
        if isinstance(first_part, TextPart):
            return ChatMessageResponse(
                role="assistant",
                content_type="text",
                content=first_part.content,
                create_time=message.timestamp.isoformat(),
            )
    raise UnexpectedModelBehavior(
        f"Unexpected message type from chat model or user: {message}"
    )


def to_model_chat_message(message: ChatMessage) -> ModelMessage:
    if message.role == "user":
        return ModelRequest(
            parts=[
                UserPromptPart(content=message.content, timestamp=message.create_time)
            ]
        )
    elif message.role == "assistant":
        return ModelResponse(
            parts=[TextPart(message.content)], timestamp=message.create_time
        )


@router.get("/{thread_id}", response_model=ThreadDetailResponse)
async def get_thead_details(
    thread_id: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    result_thread = await session.scalar(
        select(Thread).where(Thread.user_id == user.id).where(Thread.id == thread_id)
    )
    if not result_thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found.",
        )
    return {
        "id": result_thread.id,
        "model_code": result_thread.config.get("model_code", "GPT_4O_MINI"),
        "title": result_thread.title,
        "create_time": result_thread.create_time,
        "update_time": result_thread.update_time,
    }


@router.get("/{thread_id}/chat", response_model=list[ChatMessageResponse])
async def get_chat(
    thread_id: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    result_thread = await session.scalar(
        select(Thread).where(Thread.user_id == user.id).where(Thread.id == thread_id)
    )
    if not result_thread:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Thread {thread_id} not found.",
        )
    results = await session.execute(
        select(ChatMessage)
        .where(ChatMessage.thread_id == thread_id)
        .order_by(ChatMessage.create_time.asc())
    )
    all_messages = results.scalars().all()
    return all_messages


def get_model_config(model_name: str) -> dict | None:
    model_code_config = {
        "GPT_4O": {
            "provider": "openai",
            "name": "gpt-4o",
        },
        "GPT_4O_MINI": {
            "provider": "openai",
            "name": "gpt-4o-mini",
        },
        "O3_MINI": {
            "provider": "openai",
            "name": "o3-mini",
        },
        "GROQ_LLAMA_3_3_70B": {
            "provider": "groq",
            "name": "llama-3.3-70b-versatile",
            "base_url": "https://api.groq.com/openai/v1",
        },
        "GROQ_DEEPSEEK_R1_DISTILL_LLAMA_3.3_70B": {
            "provider": "groq",
            "name": "deepseek-r1-distill-llama-70b",
            "base_url": "https://api.groq.com/openai/v1",
        },
        "GEMINI_2.0_FLASH": {"provder": "google", "name": "gemini-2.0-flash"},
        "GEMINI_2.0_FLASH_LITE": {"provder": "google", "name": "gemini-2.0-flash-lite"},
    }
    if model_name in model_code_config:
        return model_code_config.get(model_name)
    return None


@router.post("/{thread_id}/chat")
async def post_chat_message(
    thread_id: str,
    body: ThreadChatMessageRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
) -> StreamingResponse:
    thread = await session.scalar(
        select(Thread).where(Thread.user_id == user.id).where(Thread.id == thread_id)
    )
    if thread is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Thread not found"
        )

    async def stream_response():
        relevant_messages = await session.execute(
            select(ChatMessage).where(ChatMessage.thread_id == thread_id).limit(10)
        )
        message_history: list[ModelMessage] = []
        if not body.is_new_chat:
            new_user_message = ChatMessage(
                thread_id=thread_id,
                user_id=user.id,
                role="user",
                content=body.prompt,
                content_type=body.content_type or "text",
            )
            session.add(new_user_message)
            await session.commit()

        for message in relevant_messages.scalars().all():
            message_history.append(to_model_chat_message(message))
        app_config = get_settings().appconfig
        provider_name = thread.config.get("provider", "openai")
        model_name = thread.config.get("name", "gpt-4o-mini")
        if provider_name == "google":
            api_key = app_config.gemini_api_key.get_secret_value()
            provider = GoogleGLAProvider(api_key)
            model = GeminiModel(model_name=model_name, provider=provider)
        elif provider_name in ["openai", "groq"]:
            api_key = (
                app_config.groq_api_key
                if provider_name == "groq"
                else app_config.openai_api_key
            ).get_secret_value()
            base_url = thread.config.get("base_url")
            provider = OpenAIProvider(api_key=api_key, base_url=base_url)
            model = OpenAIModel(
                model_name=model_name,
                provider=provider,
            )
        else:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported LLM provider")
        agent = Agent(model=model, instrument=True)
        usage_limits = UsageLimits(
            request_limit=5,
        )
        async with agent.run_stream(
            message_history[0].parts[0].content if body.is_new_chat else body.prompt,
            message_history=[] if body.is_new_chat else message_history,
            usage_limits=usage_limits,
        ) as result:
            async for text in result.stream():
                m = ModelResponse(parts=[TextPart(text)], timestamp=result.timestamp())
                chat_message = to_chat_message_response(m)
                yield (chat_message.model_dump_json()).encode("utf-8") + b"\n"
            # add response
            usage = result.usage()

            msg = result.new_messages()[-1]
            new_chat_message = ChatMessage(
                role="assistant",
                content=msg.parts[0].content,
                content_type="text",
                thread_id=thread_id,
                usage=usage.__dict__,
            )
            session.add(new_chat_message)
        await session.commit()

    return StreamingResponse(stream_response(), media_type="application/x-ndjson")


@router.post("/new", response_model=CreateThreadResponse)
async def create_thread(
    body: ThreadChatMessageRequest,
    background_tasks: BackgroundTasks,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    model_config = get_model_config(body.model_code)
    if not model_config:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported model code."
        )
    new_thread = Thread(
        user_id=user.id,
        config=dict(**model_config, model_code=body.model_code),
    )
    session.add(new_thread)
    await session.commit()
    await session.refresh(new_thread)
    new_chat_message = ChatMessage(
        content=body.prompt,
        content_type=body.content_type,
        role="user",
        user_id=user.id,
        thread_id=new_thread.id,
    )
    session.add(new_chat_message)
    await session.commit()
    background_tasks.add_task(set_title_for_thread, new_thread.id)
    return CreateThreadResponse(
        thread_id=new_thread.id,
        create_time=new_thread.create_time,
        chat_history=[new_chat_message],
    )


class ThreadTitleResult(BaseModel):
    title: str


async def set_title_for_thread(thread_id: str):
    async with get_async_session() as session:
        thread = await session.scalar(select(Thread).where(Thread.id == thread_id))
        if not thread:
            _logger.info(f"Thread {thread_id} not found")
            return
        if thread.title is None:
            model = OpenAIModel(
                model_name="o3-mini",
                provider=OpenAIProvider(
                    api_key=get_settings().appconfig.openai_api_key.get_secret_value()
                ),
            )
            agent = Agent(model=model, instrument=True, result_type=ThreadTitleResult)
            results = await session.execute(
                select(ChatMessage)
                .where(ChatMessage.thread_id == thread_id)
                .where(ChatMessage.role == "user")
                .order_by(ChatMessage.create_time.asc())
                .limit(1)
            )
            [first_msg] = results.scalars().all()
            prompt = f"""
                Here is the first message in a chat thread from a user.
                {first_msg.content}
                Write a title for this chat thread in under 10 words.
            """
            result = await agent.run(prompt)
            thread.title = result.data.title
            await session.commit()
        else:
            _logger.info(f"Thread {thread_id} was assigned a title already. Exiting.")
