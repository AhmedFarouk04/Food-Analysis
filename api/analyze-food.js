import { OpenAI } from "openai";
import formidable from "formidable";
import sharp from "sharp";

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
    const form = formidable({ multiples: false });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    // 🔥 الصور مع Formidable v3 بترجع Arrays
    const imgFile = files.image?.[0];

    if (!imgFile) {
      return res.status(400).json({ error: "Image is required" });
    }

    // 🔥 لازم ناخد imgFile.filepath
    const buffer = await sharp(imgFile.filepath)
      .jpeg({ quality: 45 })
      .toBuffer();

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
    console.error("ERROR:", error);
    return res.status(500).json({ error: error.message });
  }
}
