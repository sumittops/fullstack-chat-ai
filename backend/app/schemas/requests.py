from typing import Any, Optional
from pydantic import BaseModel, EmailStr


class BaseRequest(BaseModel):
    # may define additional fields or config shared across requests
    pass


class RefreshTokenRequest(BaseRequest):
    refresh_token: str


class UserUpdatePasswordRequest(BaseRequest):
    password: str


class UserCreateRequest(BaseRequest):
    display_name: str
    email: EmailStr
    password: str


class NewThreadWithPromptRequest(BaseRequest):
    prompt: str
    attachments: Optional[list[Any]] = []
