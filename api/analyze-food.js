import { OpenAI } from "openai";
import formidable from "formidable";
import sharp from "sharp";
import fs from "fs";
import path from "path";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
    // أهم جزء: نحدد فولدر tmp بنفسنا عشان Vercel
    const uploadDir = "/tmp";
    const form = formidable({
      uploadDir,
      keepExtensions: true,
      multiples: false,
      maxFileSize: 20 * 1024 * 1024,
      filter: (part) => part.mimetype?.startsWith("image/"), // قبول صور فقط
    });
    // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const imgFile = files.image?.[0];
    if (!imgFile) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    // الملف دلوقتي محفوظ في /tmp
    const filePath = imgFile.filepath;

    // 🔥 Sharp هنا هيشتغل بدون Invalid Input
    const buffer = await sharp(filePath).jpeg({ quality: 45 }).toBuffer();

    const base64Image = buffer.toString("base64");

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
    console.error("ERROR", error);
    return res.status(500).json({ error: error.message });
  }
}
