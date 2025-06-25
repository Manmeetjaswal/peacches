import os
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse

from routers.voice import generate_speech
from routers.animation import create_animation, get_animation_status
from routers.storage import upload_video
from services.supabase import save_job

router = APIRouter()

TEMP_DIR = os.path.join(os.path.dirname(__file__), '..', 'temp')
os.makedirs(TEMP_DIR, exist_ok=True)

@router.post("/api/generate")
async def generate(
    avatar: UploadFile = File(...),
    script: str = Form(...),
    dry_run: bool = Form(False)
):
    job_id = str(uuid.uuid4())
    avatar_path = os.path.abspath(os.path.join(TEMP_DIR, f"{job_id}_avatar.jpg"))

    # Save avatar file
    with open(avatar_path, "wb") as f:
        f.write(await avatar.read())

    if dry_run:
        return {"job_id": job_id, "video_url": f"https://mock.cdn/video/{job_id}.mp4"}

    # 1. Generate speech (returns StreamingResponse, so we need to save to file)
    try:
        speech_resp = await generate_speech({"text": script, "voice_id": job_id})
        voice_path = os.path.abspath(os.path.join(TEMP_DIR, f"{job_id}_voice.mp3"))
        with open(voice_path, "wb") as vf:
            async for chunk in speech_resp.body_iterator:
                if isinstance(chunk, str):
                    vf.write(chunk.encode())
                else:
                    vf.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech generation failed: {e}")

    # 2. Create animation (returns talk_id)
    try:
        anim_resp = await create_animation({"avatar_url": avatar_path, "audio_url": voice_path})
        talk_id = anim_resp.get("talk_id")
        if not talk_id:
            raise Exception("No talk_id returned from animation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Animation creation failed: {e}")

    # 3. Poll for animation status and get video URL
    try:
        status = await get_animation_status(talk_id)
        video_url = status.get("result", {}).get("url")
        if not video_url:
            raise Exception("No video URL in animation status")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Animation status failed: {e}")

    # 4. Upload video to storage
    try:
        storage_resp = await upload_video({"video_url": video_url})
        final_url = storage_resp.get("url", video_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    # Save job to Supabase
    # If you have a public URL for the avatar, use it. Otherwise, store the local path or a placeholder.
    save_job(job_id, script, avatar_path, final_url, prompt="", model="manual")

    return {"job_id": job_id, "video_url": final_url} 