import { OpenAI } from "openai";
import formidable from "formidable";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false, // لازم علشان Formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const form = formidable({ multiples: false });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    const imgFile = files.image;
    if (!imgFile) {
      return res.status(400).json({ error: "Image is required" });
    }

    // اقرأ الصورة من temporary path
    const fileBuffer = await sharp(imgFile.filepath)
      .jpeg({ quality: 45 })
      .toBuffer();

    const base64Image = fileBuffer.toString("base64");

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
    console.error("Error:", error);
    return res.status(500).json({ error: error.message });
  }
}
