import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    print("Warning: SUPABASE_URL or SUPABASE_KEY not set. Supabase will not be available.")

def save_job(job_id: str, script: str, image_url: str, video_url: str, prompt: str = "", model: str = "prompt") -> None:
    """
    Insert a job row into the jobs table in Supabase.
    """
    if not supabase:
        print("Supabase client not initialized. Skipping save_job.")
        return
    data = {
        "id": job_id,
        "script": script,
        "prompt": prompt,
        "image_url": image_url,
        "video_url": video_url,
        "model": model,
    }
    try:
        supabase.table("jobs").insert(data).execute()
    except Exception as e:
        print(f"Failed to save job to Supabase: {e}") 