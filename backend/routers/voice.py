import os
import tempfile
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import StreamingResponse
from fish_audio_sdk import Session, TTSRequest, ReferenceAudio
from dotenv import load_dotenv
import io

load_dotenv()

router = APIRouter()

FISH_AUDIO_API_KEY = os.getenv("FISH_AUDIO_API_KEY")
if not FISH_AUDIO_API_KEY:
    raise RuntimeError("FISH_AUDIO_API_KEY environment variable not set.")

session = Session(FISH_AUDIO_API_KEY)

@router.post("/clone-voice")
async def clone_voice(file: UploadFile = File(...)):
    """
    Creates a new voice model from an audio file using Fish Audio.
    """
    if not file.content_type or not file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File provided is not an audio file.")

    try:
        audio_bytes = await file.read()
        
        # Using a temporary file as the SDK can work with file paths
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name

        # Create a voice model
        model = session.create_model(
            name="Generated User Voice",
            files=[temp_file_path]
        )
        
        os.unlink(temp_file_path) # Clean up the temp file

        return {"voice_id": model.id}

    except Exception as e:
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        raise HTTPException(status_code=500, detail=f"Failed to clone voice with Fish Audio: {str(e)}")


@router.post("/generate-speech")
async def generate_speech(payload: dict = Body(...)):
    """
    Generates speech from text using a specified voice ID with Fish Audio.
    """
    text = payload.get("text")
    voice_id = payload.get("voice_id")

    if not text or not voice_id:
        raise HTTPException(status_code=400, detail="Missing 'text' or 'voice_id' in request body.")

    try:
        # Generate audio stream
        audio_stream = session.tts(TTSRequest(
            reference_id=voice_id,
            text=text
        ))
        
        # Collect audio chunks and return as a stream
        audio_bytes = b"".join(chunk for chunk in audio_stream)
        return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/mpeg")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate speech with Fish Audio: {str(e)}") 