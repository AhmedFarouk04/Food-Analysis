import express from "express";
import multer from "multer";
import sharp from "sharp";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import cors from "cors";

dotenv.config();

const app = express();
const upload = multer();
app.use(cors());

// ----------- ROUTES -------------
app.get("/", (req, res) => {
  res.send("Food Analyzer API Running ✔️");
});

app.post("/api/analyze-food", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "image field is required" });
    }

    // Compress image
    const compressed = await sharp(req.file.buffer)
      .jpeg({ quality: 45 })
      .toBuffer();

    const base64Image = compressed.toString("base64");

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "حلل الطعام الموجود في الصورة: السعرات، المكونات، وهل مناسب للدايت؟ باختصار.",
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      result: response.output_text,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ----------- LISTEN (Local only) -------------
if (process.env.VERCEL !== "1") {
  app.listen(3000, () => {
    console.log("Local server running → http://localhost:3000");
  });
}

export default app;
