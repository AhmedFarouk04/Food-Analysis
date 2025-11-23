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

app.post("/analyze-food", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "image field is required" });
    }

    const compressed = await sharp(req.file.buffer)
      .jpeg({ quality: 55 })
      .toBuffer();

    const base64Image = compressed.toString("base64");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await client.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "حلل الطعام الموجود في الصورة بدقة. استخرج: 1) اسم الطبق، 2) المكونات، 3) السعرات، 4) مناسب للدايت أم لا، 5) تحليل الماكروز. أعد الرد بصيغة JSON منظمة.",
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    return res.json({
      success: true,
      result: response.output_text,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Food Analyzer API Running ✔️");
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
