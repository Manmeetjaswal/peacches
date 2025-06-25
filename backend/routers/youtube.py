import os
import tempfile
import requests
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

router = APIRouter()

class YouTubeUploadRequest(BaseModel):
    video_url: str
    title: str
    description: str
    access_token: str
    dry_run: bool = False

@router.post("/youtube/upload")
async def youtube_upload(payload: YouTubeUploadRequest = Body(...)):
    if payload.dry_run:
        return {"youtube_url": "https://youtube.com/watch?v=abc123", "dry_run": True}

    # Download video to temp file
    try:
        resp = requests.get(payload.video_url, stream=True)
        resp.raise_for_status()
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            for chunk in resp.iter_content(chunk_size=8192):
                tmp.write(chunk)
            temp_video_path = tmp.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download video: {e}")

    # Upload to YouTube
    try:
        credentials = type('Creds', (), {'token': payload.access_token, 'valid': True, 'expired': False, 'refresh_token': None})()
        youtube = build('youtube', 'v3', credentials=credentials)
        body = {
            'snippet': {
                'title': payload.title,
                'description': payload.description,
                'categoryId': '22',  # People & Blogs
            },
            'status': {
                'privacyStatus': 'unlisted',
            }
        }
        media = MediaFileUpload(temp_video_path, mimetype='video/mp4', resumable=True)
        request = youtube.videos().insert(part=','.join(body.keys()), body=body, media_body=media)
        response = request.execute()
        youtube_url = f"https://youtube.com/watch?v={response['id']}"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"YouTube upload failed: {e}")
    finally:
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

    return {"youtube_url": youtube_url, "dry_run": False} 