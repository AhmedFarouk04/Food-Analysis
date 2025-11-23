import { OpenAI } from "openai";
import sharp from "sharp";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    let imageBuffer = Buffer.from([]);

    await new Promise((resolve) => {
      req.on("data", (chunk) => {
        imageBuffer = Buffer.concat([imageBuffer, chunk]);
      });
      req.on("end", resolve);
    });

    const compressed = await sharp(imageBuffer)
      .jpeg({ quality: 55 })
      .toBuffer();

    const base64Image = compressed.toString("base64");

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const aiResp = await client.responses.create({
      model: "gpt-4o-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: "حلل الطعام الموجود في الصورة بدقة. استخرج: اسم الطبق، المكونات، السعرات، مناسب للدايت أم لا، تحليل الماكروز. قدم النتيجة بصيغة JSON.",
            },
            {
              type: "input_image",
              image_url: `data:image/jpeg;base64,${base64Image}`,
            },
          ],
        },
      ],
    });

    return res.status(200).json({
      success: true,
      result: aiResp.output_text,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}
