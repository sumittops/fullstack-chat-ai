import uuid
from typing import Any
from sqlalchemy import String, ForeignKey, Uuid, JSON
from sqlalchemy.orm import mapped_column, Mapped, relationship

from app.models.base_model import Base
from app.models.user import User
from app.models.chat_message import ChatMessage


class Thread(Base):
    __tablename__ = "threads"

    id: Mapped[str] = mapped_column(
        Uuid(as_uuid=False), primary_key=True, default=lambda _: str(uuid.uuid4())
    )
    title: Mapped[str] = mapped_column(String(100), nullable=True)
    config: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    user: Mapped[User] = relationship("User", lazy="selectin")
    chat_messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="thread", lazy="selectin", uselist=True
    )

    def __repr__(self) -> str:
        return f"<Thread {self.title}>"

    def __str__(self) -> str:
        return self.title
