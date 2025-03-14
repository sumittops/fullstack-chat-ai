from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.api.api_router import api_router
from app.core.config import get_settings

app_settings = get_settings()
app = FastAPI(
    docs_url="/docs", title="MeowwChat API", description="Makes you 'meowwwwww'"
)
# cors
app.add_middleware(
    CORSMiddleware,
    allow_origins=app_settings.security.backend_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
