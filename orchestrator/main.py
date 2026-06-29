from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from faster_whisper import WhisperModel
from pydantic import BaseModel
from pymongo import MongoClient
from typing import Any, List, Optional
import logging
import os
import tempfile

from pipeline import run_create_page, PipelineError

logger = logging.getLogger("vlp.orchestrator")
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter("%(asctime)s [orchestrator] %(message)s", "%H:%M:%S"))
    logger.addHandler(_handler)
    logger.setLevel(logging.INFO)
    logger.propagate = False

# Create web app
app = FastAPI()

# Allow the frontend (dev server) to call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
MONGO_DB = os.environ.get("MONGO_DB", "vlp-local")
mongo_client = MongoClient(MONGO_URL)
pages_collection = mongo_client[MONGO_DB]["pages"]

# Load whisper model
model = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")

# Healthcheck
@app.get("/health")
def health():
    return {"status": "ok"}

# Command endpoint
@app.post("/command")
async def execute_command(file: UploadFile = File(...)):
    # Save uploaded file to a temporary location
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # Retrieve segments. vad_filter drops non-speech so silence doesn't get
        # hallucinated into filler like "Thank you"; condition_on_previous_text
        # off avoids repetition loops.
        segments, info = model.transcribe(
            tmp_path,
            beam_size=5,
            vad_filter=True,
            condition_on_previous_text=False,
        )

        # Compound segments
        text = "".join(segment.text for segment in segments).strip()
    finally:
        # Delete the temporary file
        os.unlink(tmp_path)

    logger.info("/command transcribed (lang=%s): %r", info.language, text)

    # Run the validated createPage pipeline (Gates 1-3)
    try:
        result = run_create_page(text, info.language)
    except PipelineError as e:
        # Gate 1 (intent) or Gate 2 (schema) failure — surfaced to the user,
        # nothing persisted (E-1 / E-3 / A-3)
        logger.warning("/command rejected at %s gate: %s", e.stage, e.message)
        return JSONResponse(
            status_code=422,
            content={
                "recognizedCommand": text,
                "error": {"stage": e.stage, "message": e.message},
                "validation": {"valid": False},
            },
        )

    # F-10 persist ONLY the validated page (as an unpublished draft)
    page = result["page"]
    pages_collection.update_one(
        {"url": page["url"]},
        {"$set": {**page, "publish": False}},
        upsert=True,
    )
    logger.info("/command persisted draft %s (publish=false)", page["url"])

    return result


# Body for the publish endpoint
class PublishRequest(BaseModel):
    url: str
    sections: Optional[List[Any]] = None


# Publish endpoint — marks a page as published in the DB
@app.post("/publish")
def publish(req: PublishRequest):
    update: dict[str, Any] = {"publish": True}
    if req.sections is not None:
        update["sections"] = req.sections

    result = pages_collection.update_one(
        {"url": req.url},
        {"$set": update},
        upsert=True,
    )

    return {
        "url": req.url,
        "published": True,
        "matched": result.matched_count,
        "modified": result.modified_count,
        "upserted_id": str(result.upserted_id) if result.upserted_id else None,
    }