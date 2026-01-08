const axios = require("axios");

/**
 * OpenRouter API Service
 * Handles AI-generated mental wellbeing suggestions
 */

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * System prompt for mental wellbeing suggestions
 * Pre-defined and approved for assessment-based suggestions
 */
let SYSTEM_PROMPT = `You are a mental wellbeing assistant integrated into a mental health assessment application. Context: 
- The user has completed a mental health assessment. - 
Results are already stored in the database. - 
You may receive: - Assessment type - Score - Severity level (optional) -
 Recent trend (optional) 
 Your task: Generate a short, supportive suggestion to promote mental wellbeing. 
 Strict rules (must follow): 
 1. Keep the response SHORT (10 sentences maximum).
  2. NO dramatic or emotional language. 
  3. Do NOT make the user feel broken, weak, sick, or abnormal. 
  4. Explicitly normalize the experience when relevant (e.g., stress, low mood, mental load are common).
   5. Avoid medical diagnoses or labels. 
   6. Suggestions must feel optional, not mandatory. 
   7. always suggest: - Specific books - Music styles or artists - Simple habits (sleep, walks, journaling, breathing)
    8. If difficulty is indicated: - Reassure the user that this does NOT mean they are “sick”. 
    - Keep the tone calm and grounded. 
    9. Add a gentle note that consulting a healthcare professional is an option if things feel overwhelming. 
    10. Do NOT use: - Closing endings (“take care”, “stay strong”, “you’ve got this”) 
    - Emojis - Exclamation marks 
    11. Do NOT mention test names, scores, or numbers. 
    12. Do NOT sound urgent or alarming.
     Style guide: - Calm - Respectful - Non-clinical - Everyday language - Supportive but neutral Examples of acceptable 
     `
// Build user prompt from assessment context
const buildSuggestionPrompt = (context) => {
  const {
    assessmentType,
    score,
    severity,
    age,
  } = context;

  SYSTEM_PROMPT += `Based on the user's assessment, please provide a brief, supportive suggestion tailored to their situation. Keep it 1–3 sentences.`;
  SYSTEM_PROMPT += `\n\nUser age: ${age ?? "unknown"}\n`;
  SYSTEM_PROMPT += `Assessment: ${assessmentType}\n`;
  SYSTEM_PROMPT += `Most recent value: ${score}\n`;
  SYSTEM_PROMPT += `Severity level: ${severity}\n`;

  return SYSTEM_PROMPT;
}
const callOpenRouter = async (context) => {
    if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
}

try {
    const userPrompt = buildSuggestionPrompt(context);
    console.log("Calling OpenRouter with prompt:", userPrompt);

    const response = await axios.post(
      OPENROUTER_BASE_URL,
      {
        model: "openai/gpt-3.5-turbo", // Lightweight, reliable model
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          }
        ],
        temperature: 0.7,
        max_tokens: 150, // Keep response concise
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://equilife.app"
        },
        timeout: 100000, 
      }
    );

    // Extract text from response
    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content.trim();
    }

    throw new Error("Invalid response format from OpenRouter");
  } catch (error) {
    // Log error for debugging (but not the API key)
    console.error("OpenRouter API error:", {
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
    });

    // Re-throw with safe message
    throw new Error("Failed to generate suggestion. Please try again.");
  }
};

module.exports = {
  buildSuggestionPrompt,
  callOpenRouter,
};
