import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

# CORS (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers (to be implemented)
from routers import clone, video, voice, animation, storage, generate, prompt, youtube
app.include_router(clone.router)
app.include_router(video.router, prefix="/video", tags=["video"])
app.include_router(voice.router, prefix="/voice", tags=["voice"])
app.include_router(animation.router, prefix="/animation", tags=["animation"])
app.include_router(storage.router, prefix="/storage", tags=["storage"])
app.include_router(generate.router)
app.include_router(prompt.router)
app.include_router(youtube.router)

# Celery config stub (to be implemented)
# from worker import celery_app
# app.celery_app = celery_app