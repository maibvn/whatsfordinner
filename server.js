import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { parseRecipe } from "./recipeParser.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Helper function to delay execution
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to make API call with retries
async function makeHuggingFaceRequest(prompt, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Attempt ${attempt} of ${maxRetries} to call Hugging Face API...`
      );
      const response = await fetch(
        "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_length: 1000,
              temperature: 0.3,
              top_p: 0.95,
              do_sample: true,
              num_return_sequences: 1,
              repetition_penalty: 1.2,
              return_full_text: false,
            },
          }),
        }
      );

      if (response.status === 503) {
        console.log("Model is loading, waiting before retry...");
        await delay(20000); // Wait 20 seconds before retrying
        continue;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || response.statusText);
      }

      return await response.json();
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        throw error;
      }
      await delay(5000); // Wait 5 seconds between retries
    }
  }
}

// Add this new function at the top with other imports/functions
async function generateRecipeImage(recipeName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Generating image for recipe: ${recipeName} (Attempt ${attempt}/${maxRetries})`
      );

      const response = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          },
          body: JSON.stringify({
            inputs: `High quality photo of Vietnamese dish ${recipeName}, professional food photography, appetizing presentation, clear lighting, restaurant quality plating`,
            parameters: {
              negative_prompt: "text, watermark, low quality, blurry",
              num_inference_steps: 30,
              guidance_scale: 7.5,
              width: 768,
              height: 512,
            },
          }),
        }
      );

      console.log("Stable Diffusion API response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Image generation failed: ${response.statusText}. Details: ${errorText}`
        );
      }

      const imageBuffer = await response.buffer();
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString(
        "base64"
      )}`;
      console.log("Successfully generated image");
      return base64Image;
    } catch (error) {
      console.error(
        `Image generation attempt ${attempt} failed:`,
        error.message
      );
      if (attempt === maxRetries) {
        throw error;
      }
      console.log(`Waiting 5 seconds before retry ${attempt + 1}...`);
      await delay(5000);
    }
  }
  return null;
}

// API endpoint for getting dish suggestions
app.post("/api/suggest-dish", async (req, res) => {
  try {
    const { ingredients } = req.body;
    console.log("Received ingredients:", ingredients);

    const prompt = `[INST] You are a Vietnamese cooking expert. Create a Vietnamese recipe using these ingredients: "${ingredients}".
Your response must be in valid JSON format like this example:
{
  "name": "Bun Bo Hue",
  "ingredients": [
    "500g beef brisket",
    "2 lemongrass stalks",
    "3 tablespoons fish sauce"
  ],
  "instructions": [
    "1. Prepare the broth by simmering beef",
    "2. Add lemongrass and spices",
    "3. Cook the noodles separately",
    "4. Slice the cooked meat",
    "5. Assemble the bowls with broth"
  ]
}

Requirements:
- Name must be a real Vietnamese dish
- Include measurements for all ingredients
- Exactly 5 clear cooking steps
- Must use the provided ingredients: ${ingredients}
- Response must be valid JSON [/INST]`;

    const data = await makeHuggingFaceRequest(prompt);
    const generatedText = data[0].generated_text;
    const suggestion = await parseRecipe(generatedText);

    // Add debugging logs
    console.log("Recipe name for image generation:", suggestion.name);

    try {
      console.log("Starting image generation...");
      const recipeImage = await generateRecipeImage(suggestion.name);
      console.log("Image generation completed:", !!recipeImage);

      if (recipeImage) {
        suggestion.image = recipeImage;
        console.log("Image attached to suggestion object");
      }
    } catch (imageError) {
      console.error("Detailed image generation error:", imageError);
    }

    res.json(suggestion);
  } catch (error) {
    console.error("Detailed Error:", error);
    res.status(500).json({
      error: "Failed to generate recipe. Please try again later.",
      details: error.message,
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    error: "An unexpected error occurred. Please try again later.",
    details: err.message,
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
