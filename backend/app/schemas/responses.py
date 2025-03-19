from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class BaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class AccessTokenResponse(BaseResponse):
    token_type: str = "Bearer"
    access_token: str
    expires_at: int
    refresh_token: str
    refresh_token_expires_at: int


class UserResponse(BaseResponse):
    id: str
    display_name: str
    email: EmailStr


class ChatMessageResponse(BaseResponse):
    content: str
    content_type: str
    role: str
    create_time: datetime
    update_time: datetime


class ThreadListResponse(BaseResponse):
    id: str
    title: Optional[str] = None
    create_time: datetime
    update_time: datetime


class ThreadDetailResponse(BaseResponse):
    id: str
    model_code: str
    title: Optional[str] = None
    create_time: datetime
    update_time: datetime


class ChatMessageResponse(BaseResponse):
    content: str
    content_type: str
    role: str
    create_time: datetime


class CreateThreadResponse(BaseResponse):
    thread_id: str
    create_time: datetime
    chat_history: list[ChatMessageResponse]
