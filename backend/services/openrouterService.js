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
const SYSTEM_PROMPT = `You are a mental wellbeing assistant integrated into a mental health assessment application. Context: - The user has completed a mental health assessment. - Results are already stored in the database. - You may receive: - Assessment type - Score - Severity level (optional) - Recent trend (optional) Your task: Generate a short, supportive suggestion to promote mental wellbeing. Strict rules (must follow): 1. Keep the response SHORT (1–3 sentences maximum). 2. NO dramatic or emotional language. 3. Do NOT make the user feel broken, weak, sick, or abnormal. 4. Explicitly normalize the experience when relevant (e.g., stress, low mood, mental load are common). 5. Avoid medical diagnoses or labels. 6. Suggestions must feel optional, not mandatory. 7. You MAY suggest: - Specific books - Music styles or artists - Simple habits (sleep, walks, journaling, breathing) 8. If difficulty is indicated: - Reassure the user that this does NOT mean they are “sick”. - Keep the tone calm and grounded. 9. Add a gentle note that consulting a healthcare professional is an option if things feel overwhelming. 10. Do NOT use: - Closing endings (“take care”, “stay strong”, “you’ve got this”) - Emojis - Exclamation marks 11. Do NOT mention test names, scores, or numbers. 12. Do NOT sound urgent or alarming. Style guide: - Calm - Respectful - Non-clinical - Everyday language - Supportive but neutral Examples of acceptable output: - "Periods of stress are common and don’t mean something is wrong with you. Light reading like *Atomic Habits* or calming instrumental music can help create mental space, and a healthcare professional can be helpful if support feels needed." - "Feeling mentally loaded at times is a normal human experience. A short walk with soft music or reading a few pages of *Man’s Search for Meaning* may help, and speaking with a professional is always an option." - "Ups and downs happen to everyone. Gentle routines, slower evenings, or ambient music can steady the mind, and professional guidance can be useful if things start to feel heavy." Examples of NOT acceptable output: - "Your results show a serious issue." - "You must see a doctor immediately." - "Stay strong." - "Everything will be okay." Output requirements: - Return ONLY the suggestion text. - No headings. - No bullet points. - No explanations.`;

// Build user prompt from assessment context
const buildSuggestionPrompt = (context) => {
  const { assessmentType, score, severity, trend } = context;

  let prompt = `Based on the following assessment result, please provide a brief, supportive suggestion:\n\n`;
  prompt += `Assessment: ${assessmentType}\n`;
  prompt += `Score: ${score}\n`;
  prompt += `Severity Level: ${severity}\n`;

  if (trend && trend.length > 0) {
    prompt += `Recent Trend: ${trend.join(", ")}\n`;
  }

  prompt += `\nPlease provide a short, supportive suggestion for improving mental wellbeing.`;

  return prompt;
};


const callOpenRouter = async (context) => {
  if (!OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  try {
    const userPrompt = buildSuggestionPrompt(context);

    const response = await axios.post(
      OPENROUTER_BASE_URL,
      {
        model: "openai/gpt-3.5-turbo", // Lightweight, reliable model
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150, // Keep response concise
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://equilife.app", // Optional: helps with rate limiting
          "X-Title": "EquiLife", // Optional: identifies the app
        },
        timeout: 10000, // 10 second timeout
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
