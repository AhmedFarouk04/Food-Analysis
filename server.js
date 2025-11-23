import express from "express";
import sharp from "sharp";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());

// نسمح باستقبال Multipart form-data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// نستخدم buffer مباشرة بدون multer
app.post("/analyze-food", async (req, res) => {
  try {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", async () => {
      const buffer = Buffer.concat(chunks);

      // check buffer
      if (!buffer || buffer.length < 50) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      const compressed = await sharp(buffer)
        .jpeg({ quality: 50 })
        .toBuffer();

      const base64 = compressed.toString("base64");

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
                text: "حلل الطعام الموجود في الصورة (السعرات – المكونات – مناسب للدايت؟)"
              },
              {
                type: "input_image",
                image_url: `data:image/jpeg;base64,${base64}`
              }
            ]
          }
        ]
      });

      return res.json({ result: response.output_text });
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Food Analyzer API Running ✔️");
});

export default app;
