import os
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, HTTPException, Body
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
    api_key=os.getenv("CLOUDINARY_API_KEY"),
    api_secret=os.getenv("CLOUDINARY_API_SECRET"),
    secure=True
)

@router.post("/upload-video")
async def upload_video(payload: dict = Body(...)):
    """
    Uploads a video to Cloudinary from a public URL.
    """
    video_url = payload.get("video_url")
    if not video_url:
        raise HTTPException(status_code=400, detail="Missing 'video_url' in request body.")

    try:
        # Upload the video to Cloudinary
        upload_result = cloudinary.uploader.upload(
            video_url,
            resource_type="video",
            folder="generated_content" # Optional: specify a folder in Cloudinary
        )
        return {"url": upload_result.get("secure_url")}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload video to Cloudinary: {str(e)}") 