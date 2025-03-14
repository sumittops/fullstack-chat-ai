from typing import Any
from sqlalchemy import BigInteger, Text, ForeignKey, JSON, String
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.models.base_model import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    content_type: Mapped[str] = mapped_column(String(16), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False)
    usage: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=True)
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    thread_id: Mapped[str] = mapped_column(
        ForeignKey("threads.id", ondelete="CASCADE"), nullable=False
    )
    thread: Mapped["Thread"] = relationship(
        "Thread", back_populates="chat_messages", foreign_keys=[thread_id]
    )
