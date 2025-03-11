// DOM Elements
const ingredientsInput = document.getElementById("ingredientsInput");
const getSuggestionBtn = document.getElementById("getSuggestion");
const loadingElement = document.getElementById("loading");
const suggestionElement = document.getElementById("suggestion");
const recipeName = document.getElementById("recipeName");
const recipeIngredients = document.getElementById("recipeIngredients");
const recipeInstructions = document.getElementById("recipeInstructions");

// API Configuration
const API_URL = "http://localhost:3000/api/suggest-dish";

// Event Listeners
getSuggestionBtn.addEventListener("click", handleGetSuggestion);

async function handleGetSuggestion() {
  const ingredients = ingredientsInput.value.trim();

  if (!ingredients) {
    alert("Please list your available ingredients!");
    return;
  }

  // Show loading state and hide suggestion
  loadingElement.style.display = "block";
  suggestionElement.style.display = "none";
  getSuggestionBtn.disabled = true;

  try {
    const response = await fetch("http://localhost:3000/api/suggest-dish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ingredients }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get suggestion");
    }

    const data = await response.json();
    console.log("Received suggestion:", data);

    // Update the UI with the recipe
    recipeName.textContent = data.name || "Recipe Name Not Available";

    // Clear previous ingredients
    recipeIngredients.innerHTML = "";

    // Parse ingredients into array of strings
    let ingredientsList = [];

    if (typeof data.ingredients === "string") {
      // Handle string format (split by newlines)
      ingredientsList = data.ingredients
        .split("\n")
        .filter((item) => item.trim() !== "");
    } else if (Array.isArray(data.ingredients)) {
      // Handle array format
      ingredientsList = data.ingredients;
    } else if (
      typeof data.ingredients === "object" &&
      data.ingredients !== null
    ) {
      // Handle nested object format by extracting values
      ingredientsList = Object.values(data.ingredients)
        .map((item) => {
          if (typeof item === "string") return item;
          if (typeof item === "object" && item !== null) {
            // Try to extract meaningful information from object
            const amount = item.amount || item.quantity || "";
            const unit = item.unit || "";
            const name = item.name || item.ingredient || "";
            return [amount, unit, name].filter(Boolean).join(" ").trim();
          }
          return "";
        })
        .filter((item) => item !== "");
    }

    console.log("Parsed ingredients list:", ingredientsList);

    // Create grid items for each ingredient
    if (ingredientsList && ingredientsList.length > 0) {
      ingredientsList.forEach((ingredient) => {
        const div = document.createElement("div");
        div.textContent = ingredient.trim();
        recipeIngredients.appendChild(div);
      });
    } else {
      // Fallback if no ingredients
      const div = document.createElement("div");
      div.textContent = "No ingredients available";
      recipeIngredients.appendChild(div);
    }

    // Handle instructions array or string
    let instructionsList = [];
    if (typeof data.instructions === "string") {
      instructionsList = data.instructions
        .split("\n")
        .filter((item) => item.trim() !== "");
    } else if (Array.isArray(data.instructions)) {
      instructionsList = data.instructions;
    }

    recipeInstructions.textContent = instructionsList.join("\n");

    // Show the suggestion and scroll to it
    suggestionElement.style.display = "block";
    suggestionElement.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error details:", error);
    alert(`Error: ${error.message}`);
  } finally {
    loadingElement.style.display = "none";
    getSuggestionBtn.disabled = false;
  }
}

async function getDishSuggestion(ingredients) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ingredients }),
  });

  if (!response.ok) {
    throw new Error("Failed to get suggestion from server");
  }

  return await response.json();
}

function displaySuggestion(suggestion) {
  recipeName.textContent = suggestion.name;
  recipeIngredients.textContent = suggestion.ingredients;
  recipeInstructions.textContent = suggestion.instructions;

  suggestionElement.style.display = "block";
  suggestionElement.scrollIntoView({ behavior: "smooth" });
}
