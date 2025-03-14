from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from pydantic_ai import Agent
from pydantic_ai.exceptions import UnexpectedModelBehavior
from pydantic_ai.messages import (
    ModelMessage,
    ModelRequest,
    ModelResponse,
    TextPart,
    UserPromptPart,
)
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider
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


@router.get("/{thread_id}", response_model=ThreadListResponse)
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
    return result_thread


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

        model = OpenAIModel(
            model_name="gpt-4o-mini",
            provider=OpenAIProvider(
                api_key=get_settings().appconfig.openai_api_key.get_secret_value()
            ),
        )
        agent = Agent(model=model, instrument=True)

        async with agent.run_stream(
            message_history[0].parts[0].content if body.is_new_chat else body.prompt,
            message_history=[] if body.is_new_chat else message_history,
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
    new_thread = Thread(
        user_id=user.id,
        config={"provider": "openai", "model": "gpt-4o-mini"},
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
