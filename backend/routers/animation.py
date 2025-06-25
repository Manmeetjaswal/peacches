import os
import requests
import base64
import time
from fastapi import APIRouter, HTTPException, Body, UploadFile, File
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

D_ID_API_KEY = os.getenv("D_ID_API_KEY")
if not D_ID_API_KEY:
    raise RuntimeError("D_ID_API_KEY environment variable not set.")

# Prepare the auth header
auth_string = f"{D_ID_API_KEY}".encode('utf-8')
b64_auth_string = base64.b64encode(auth_string).decode('utf-8')
headers = {
    "accept": "application/json",
    "content-type": "application/json",
    "authorization": f"Basic {b64_auth_string}"
}

# Helper to upload files to a public URL
def upload_to_public_url(file_bytes, content_type):
    try:
        upload_response = requests.post(
            'https://tmpfiles.org/api/v1/upload',
            files={'file': ('file', file_bytes, content_type)}
        )
        upload_response.raise_for_status()
        # The URL is in the format: https://tmpfiles.org/dl/{id}/{filename}
        # We need the direct file URL, which is usually at a different path.
        # Let's construct it from the data part of the URL.
        url_data = upload_response.json()['data']['url']
        file_id = url_data.split('/')[-2]
        file_name = url_data.split('/')[-1]
        direct_url = f"https://tmpfiles.org/dl/{file_id}/{file_name}"
        # A small hack: let's reformat the URL for direct access if tmpfiles' format is tricky
        direct_url = url_data.replace('/dl/', '/files/')
        return direct_url
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file for public URL: {str(e)}")


@router.post("/upload-for-animation")
async def upload_for_animation(avatar: UploadFile = File(...), audio: UploadFile = File(...)):
    """
    Uploads avatar and audio files and returns public URLs.
    """
    try:
        avatar_bytes = await avatar.read()
        audio_bytes = await audio.read()

        avatar_url = upload_to_public_url(avatar_bytes, avatar.content_type)
        audio_url = upload_to_public_url(audio_bytes, audio.content_type)

        return {"avatar_url": avatar_url, "audio_url": audio_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.post("/animate")
async def create_animation(payload: dict = Body(...)):
    """
    Creates a new D-ID talk from an avatar image and an audio file.
    """
    avatar_url = payload.get("avatar_url")
    audio_url = payload.get("audio_url")

    if not avatar_url or not audio_url:
        raise HTTPException(status_code=400, detail="Missing 'avatar_url' or 'audio_url' in request body.")

    try:
        # Create a talk
        talk_payload = {
            "source_url": avatar_url,
            "script": {
                "type": "audio",
                "audio_url": audio_url
            }
        }
        
        create_talk_response = requests.post("https://api.d-id.com/talks", headers=headers, json=talk_payload)
        create_talk_response.raise_for_status()
        talk_data = create_talk_response.json()

        return {"talk_id": talk_data.get("id")}

    except requests.exceptions.RequestException as e:
        # Log the error response from D-ID if available
        error_detail = e.response.json() if e.response else str(e)
        raise HTTPException(status_code=500, detail=f"Failed to create D-ID talk: {error_detail}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/talks/{talk_id}")
async def get_animation_status(talk_id: str):
    """
    Checks the status of a D-ID talk.
    """
    try:
        status_response = requests.get(f"https://api.d-id.com/talks/{talk_id}", headers=headers)
        status_response.raise_for_status()
        return status_response.json()

    except requests.exceptions.RequestException as e:
        error_detail = e.response.json() if e.response else str(e)
        raise HTTPException(status_code=500, detail=f"Failed to get D-ID talk status: {error_detail}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}") 