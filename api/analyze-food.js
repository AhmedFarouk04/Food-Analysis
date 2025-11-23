import { OpenAI } from "openai";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    try {
      if (err) return res.status(400).json({ error: "Form parsing error" });

      const imageFile = files.image;

      if (!imageFile)
        return res.status(400).json({ error: "image field is required" });

      // Read uploaded image
      const fileData = fs.readFileSync(imageFile.filepath);
      const base64Image = fileData.toString("base64");

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
                text: "حلل الطعام الموجود في الصورة بالتفصيل.",
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
        analysis: response.output_text,
      });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
}
