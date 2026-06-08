from fastapi import FastAPI, File, UploadFile
from faster_whisper import WhisperModel
import os
import tempfile

# Create web app
app = FastAPI()

# Load whisper model
model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")

# Healthcheck
@app.get("/health")
def health():
    return {"status": "ok"}

# Transcribing endpoint
@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Retrieve segments
        segments, info = model.transcribe(tmp_path, beam_size=5)

        # Compound segments
        text = "".join(segment.text for segment in segments).strip()

        # Return JSON response
        return {
            "text": text,
            "language": info.language,
        }
    finally:
        # Delete the temporary file
        os.unlink(tmp_path)