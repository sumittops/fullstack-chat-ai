from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_session, get_current_user
from app.models.chat_message import ChatMessage
from app.models.user import User
from app.models.thread import Thread
from app.schemas.requests import NewThreadWithPromptRequest
from app.schemas.responses import (
    ChatMessageResponse,
    CreateThreadResponse,
    ThreadListResponse,
)

router = APIRouter()


@router.get("", response_model=list[ThreadListResponse])
async def get_threads(
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    threads = await session.execute(select(Thread).where(Thread.user_id == user.id))
    threads = threads.scalars().all()
    if not threads or len(threads) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User has no threads",
        )
    return threads


@router.get("/{thread_id}/chat", response_model=list[ChatMessageResponse])
async def get_chat(
    thread_id: str,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    results = await session.execute(
        select(ChatMessage).where(ChatMessage.thread_id == thread_id)
    )
    all_messages = results.scalars().all()
    return all_messages


@router.post("/new", response_model=CreateThreadResponse)
async def create_thread(
    body: NewThreadWithPromptRequest,
    session: AsyncSession = Depends(get_session),
    user: User = Depends(get_current_user),
):
    new_thread = Thread(
        user_id=user.id,
        config={"provider": "openai", "model": "gpt-4o-mini-2024-07-18"},
    )
    session.add(new_thread)
    await session.commit()
    await session.refresh(new_thread)
    new_chat_message = ChatMessage(
        content=body.prompt,
        content_type="text",
        role="user",
        user_id=user.id,
        thread_id=new_thread.id,
    )
    session.add(new_chat_message)
    await session.commit()

    return CreateThreadResponse(
        thread_id=new_thread.id,
        create_time=new_thread.create_time,
        chat_history=[new_chat_message],
    )
