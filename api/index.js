export default function handler(req, res) {
  res.status(200).json({
    status: "Food Analyzer API Running on Vercel ",
  });
}
