import multer from "multer";
import sharp from "sharp";
import { OpenAI } from "openai";

// Vercel serverless: we need a multer instance
const upload = multer().single("image");

export const config = {
  api: {
    bodyParser: false, // مهم جداً لفورم داتا
  },
};

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(500).json({ error: "Upload error" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "Image is required" });
      }

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

      return res.json({
        result: response.output_text,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  });
}
