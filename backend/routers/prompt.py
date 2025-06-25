import os
import uuid
import requests
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from routers.voice import generate_speech
from routers.animation import create_animation, get_animation_status
from routers.storage import upload_video
from services.supabase import save_job

load_dotenv()

router = APIRouter()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
HUGGING_FACE_API_KEY = os.getenv("HUGGING_FACE_API_KEY")

class PromptRequest(BaseModel):
    prompt: str
    dry_run: bool = False

@router.post("/api/prompt-to-video")
async def prompt_to_video(payload: PromptRequest = Body(...)):
    job_id = str(uuid.uuid4())
    prompt = payload.prompt
    dry_run = payload.dry_run

    # 1. Use OpenAI GPT to generate script and avatar_description
    if dry_run:
        script = f"This is a mock script for: {prompt}"
        avatar_description = f"A mock avatar for: {prompt}"
        image_url = f"https://mock.cdn/image/{job_id}.jpg"
        video_url = f"https://mock.cdn/video/{job_id}.mp4"
        return {
            "job_id": job_id,
            "script": script,
            "image_url": image_url,
            "video_url": video_url
        }

    # OpenAI GPT call
    try:
        openai_url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        system_prompt = (
            "You are an AI assistant that generates a short video script and a visual description for an avatar image, "
            "based on a user's prompt. Respond in JSON with 'script' and 'avatar_description'."
        )
        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ],
            "max_tokens": 400,
            "temperature": 0.7
        }
        resp = requests.post(openai_url, headers=headers, json=data, timeout=30)
        resp.raise_for_status()
        gpt_content = resp.json()["choices"][0]["message"]["content"]
        # Try to parse as JSON
        import json as pyjson
        try:
            gpt_json = pyjson.loads(gpt_content)
            script = gpt_json["script"]
            avatar_description = gpt_json["avatar_description"]
        except Exception:
            # Fallback: try to extract script and description from text
            script = gpt_content
            avatar_description = prompt
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI GPT failed: {e}")

    # 2. Use Stable Diffusion (Hugging Face) to generate avatar image
    try:
        sd_url = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
        sd_headers = {"Authorization": f"Bearer {HUGGING_FACE_API_KEY}"}
        sd_resp = requests.post(sd_url, headers=sd_headers, json={"inputs": avatar_description}, timeout=60)
        sd_resp.raise_for_status()
        # Save image to temp and get a URL (mock: save to disk, in prod: upload to S3/CDN)
        image_path = f"temp/{job_id}_avatar.jpg"
        with open(image_path, "wb") as f:
            f.write(sd_resp.content)
        image_url = image_path  # In real use, upload to CDN and get URL
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stable Diffusion failed: {e}")

    # 3. Use Fish.audio to generate voice from script
    try:
        speech_resp = await generate_speech({"text": script, "voice_id": job_id})
        voice_path = f"temp/{job_id}_voice.mp3"
        with open(voice_path, "wb") as vf:
            async for chunk in speech_resp.body_iterator:
                if isinstance(chunk, str):
                    vf.write(chunk.encode())
                else:
                    vf.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech generation failed: {e}")

    # 4. Use D-ID to animate avatar with voice
    try:
        anim_resp = await create_animation({"avatar_url": image_url, "audio_url": voice_path})
        talk_id = anim_resp.get("talk_id")
        if not talk_id:
            raise Exception("No talk_id returned from animation")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Animation creation failed: {e}")

    # 5. Poll for animation status and get video URL
    try:
        status = await get_animation_status(talk_id)
        video_url = status.get("result", {}).get("url")
        if not video_url:
            raise Exception("No video URL in animation status")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Animation status failed: {e}")

    # 6. Upload video to Cloudinary
    try:
        storage_resp = await upload_video({"video_url": video_url})
        final_url = storage_resp.get("url", video_url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    # Save job to Supabase
    save_job(job_id, script, image_url, final_url, prompt, model="prompt")

    return {
        "job_id": job_id,
        "script": script,
        "image_url": image_url,
        "video_url": final_url
    } 