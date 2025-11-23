from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI

from io import BytesIO
from PIL import Image
import base64
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

app = FastAPI(title="Food Analyzer API", version="1.5")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# --------------------------------------------------
# Compress image → reduce token usage
# --------------------------------------------------
def compress_image(image_bytes: bytes, quality=45):
    img = Image.open(BytesIO(image_bytes))
    rgb = img.convert("RGB")
    buffer = BytesIO()
    rgb.save(buffer, format="JPEG", optimize=True, quality=quality)
    return buffer.getvalue()


@app.get("/")
async def home():
    return {"status": "Food Analyzer API Running ⚡"}


# --------------------------------------------------
# Main endpoint (NO CACHE)
# --------------------------------------------------
@app.post("/analyze-food")
async def analyze_food(image: UploadFile = File(...)):
    try:
        if image.content_type not in ["image/jpeg", "image/png"]:
            return JSONResponse(
                status_code=400,
                content={"error": "Only JPEG or PNG allowed"}
            )

        # Read & compress
        image_bytes = await image.read()
        compressed = compress_image(image_bytes)

        # Convert to base64
        b64_image = base64.b64encode(compressed).decode()

        # --------------------------------------------
        # LOW COST Vision Processing (Responses API)
        # --------------------------------------------
        response = client.responses.create(
            model="gpt-4o-mini",
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": "حلل الطعام الموجود في الصورة: السعرات، المكونات، وهل مناسب للدايت؟ باختصار."
                        },
                        {
                            "type": "input_image",
                            "image_url": f"data:image/jpeg;base64,{b64_image}"
                        }
                    ]
                }
            ]
        )

        analysis = response.output_text

        return {"analysis": analysis}

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
