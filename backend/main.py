import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from routers.auth import router as auth_router
from routers.selfcare import router as selfcare_router
from routers.fitforge import router as fitforge_router
from routers.shared import router as shared_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"[rift-apps-api] Starting up — environment: {os.environ.get('ENVIRONMENT', 'production')}")
    yield
    print("[rift-apps-api] Shutting down")


app = FastAPI(
    title="Rift Apps API",
    description="Backend API for SelfCare Pup and FitForge apps",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(shared_router)
app.include_router(auth_router)
app.include_router(selfcare_router)
app.include_router(fitforge_router)


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=os.environ.get("ENVIRONMENT") == "development")
