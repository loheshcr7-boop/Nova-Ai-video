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
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({
        error: "Please enter a video prompt"
      });
    }

    const apiKey = process.env.PIXAZO_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "PIXAZO_API_KEY is missing"
      });
    }

    // Start video generation
    const generateResponse = await fetch(
      "https://gateway.pixazo.ai/ltx-video/v1/text-to-video",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": apiKey
        },
        body: JSON.stringify({
          prompt: prompt
        })
      }
    );

    const generateData = await generateResponse.json();

    if (!generateResponse.ok) {
      console.error("Pixazo error:", generateData);

      return res.status(generateResponse.status).json({
        error: generateData.error || "Video generation request failed"
      });
    }

    const requestId = generateData.request_id;

    if (!requestId) {
      return res.status(500).json({
        error: "No request ID returned by Pixazo"
      });
    }

    // Poll video status
    for (let i = 0; i < 60; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const statusResponse = await fetch(
        `https://gateway.pixazo.ai/v2/requests/status/${requestId}`,
        {
          headers: {
            "Ocp-Apim-Subscription-Key": apiKey
          }
        }
      );

      const statusData = await statusResponse.json();

      console.log("Video status:", statusData.status);

      if (statusData.status === "COMPLETED") {
        const videoUrl =
          statusData.output?.media_url?.[0];

        if (!videoUrl) {
          return res.status(500).json({
            error: "Video completed but no video URL was returned"
          });
        }

        return res.json({
          status: "completed",
          videoUrl: videoUrl
        });
      }

      if (
        statusData.status === "ERROR" ||
        statusData.status === "FAILED"
      ) {
        return res.status(500).json({
          error:
            statusData.error ||
            "Video generation failed"
        });
      }
    }

    return res.status(408).json({
      error: "Video generation is taking too long"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Server error while generating video"
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `NOVA AI VIDEO server running on port ${PORT}`
  );
});
