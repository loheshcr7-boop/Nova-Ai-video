import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(process.cwd() + "/index.html");
});

app.post("/api/generate-video", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: "Please enter a video prompt"
    });
  }

  console.log("Video prompt:", prompt);

  res.json({
    status: "received",
    message: "Prompt received successfully",
    prompt: prompt
  });
});

app.listen(PORT, () => {
  console.log(`NOVA AI VIDEO server running on port ${PORT}`);
});
