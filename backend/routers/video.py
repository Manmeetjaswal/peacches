import os
import tempfile
import cloudconvert
import requests
import io
from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# It's recommended to move this to a central configuration file
CLOUDCONVERT_API_KEY = os.getenv("CLOUDCONVERT_API_KEY")

if not CLOUDCONVERT_API_KEY:
    raise RuntimeError("CLOUDCONVERT_API_KEY environment variable not set.")

HUGGING_FACE_API_KEY = os.getenv("HUGGING_FACE_API_KEY")
if not HUGGING_FACE_API_KEY:
    raise RuntimeError("HUGGING_FACE_API_KEY environment variable not set.")

cloudconvert.configure(api_key=CLOUDCONVERT_API_KEY, sandbox=False)

@router.post("/extract-frame")
async def extract_frame(file: UploadFile = File(...)):
    """
    Extracts the first frame from a video file and returns the URL to the frame.
    """
    if not file.content_type or not file.content_type.startswith('video/'):
        raise HTTPException(status_code=400, detail="File provided is not a video.")

    try:
        # The client is already configured and ready to use
        
        # 1. Create a job
        job_payload = {
            "tasks": {
                'import-file': {
                    'operation': 'import/upload'
                },
                'extract-frame': {
                    'operation': 'convert',
                    'input': 'import-file',
                    'output_format': 'jpg',
                    "engine": "ffmpeg",
                    "capture_mode": "time",
                    "capture_time": 1,
                    'filename': 'frame.jpg'
                },
                'export-frame': {
                    'operation': 'export/url',
                    'input': 'extract-frame',
                    'inline': False,
                    'archive_multiple_files': False
                }
            }
        }
        
        job = cloudconvert.Job.create(payload=job_payload)
        
        # 2. Upload the file by saving it to a temporary file first
        upload_task = next(task for task in job.get("tasks", []) if task.get('operation') == 'import/upload')
        
        with tempfile.NamedTemporaryFile(delete=False, suffix=file.filename) as temp_file:
            temp_file.write(await file.read())
            temp_file_path = temp_file.name

        cloudconvert.Task.upload(file_name=temp_file_path, task=upload_task)
        
        os.unlink(temp_file_path) # Clean up the temporary file

        # 3. Wait for the job to finish
        job = cloudconvert.Job.wait(id=job['id'])

        # 4. Get the URL of the exported file
        if job['status'] == 'finished':
            export_task = next(task for task in job['tasks'] if task['name'] == 'export-frame')
            if export_task and export_task['status'] == 'finished':
                file_info = export_task['result']['files'][0]
                return {"frame_url": file_info['url']}
            else:
                 raise HTTPException(status_code=500, detail="Frame export failed.")
        else:
            raise HTTPException(status_code=500, detail="CloudConvert job failed.")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-avatar")
async def generate_avatar(image_url: str):
    """
    Generates an avatar from an image URL using Stable Diffusion.
    """
    API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"
    headers = {"Authorization": f"Bearer {HUGGING_FACE_API_KEY}"}

    try:
        # Download the image from the provided URL
        image_response = requests.get(image_url, stream=True)
        image_response.raise_for_status()
        image_bytes = image_response.content

        # Call the Hugging Face API
        response = requests.post(API_URL, headers=headers, data=image_bytes)
        response.raise_for_status()

        # The response from the SDXL API is the image itself, return as a stream
        return StreamingResponse(io.BytesIO(response.content), media_type="image/jpeg")

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code=500, detail=f"Failed to call Hugging Face API: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 