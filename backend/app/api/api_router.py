from fastapi import APIRouter
from app.api.endpoints import auth, threads, users

api_router = APIRouter()

api_router.include_router(auth.router, tags=["auth"], prefix="/auth")
api_router.include_router(threads.router, tags=["threads"], prefix="/threads")
api_router.include_router(users.router, tags=["users"], prefix="/users")
