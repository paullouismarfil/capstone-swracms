import { ecobotKnowledge } from "./ecobotKnowledge.js";

export async function POST(request) {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return Response.json(
        { error: "Missing OPENROUTER_API_KEY in environment variables." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { message, role, botName } = body;

    if (!message || typeof message !== "string") {
      return Response.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    const systemPrompt = `
${ecobotKnowledge}

You are ${botName || "Smart Assist"}, a real AI assistant inside SWRaCMS.

Rules:
1. Only answer questions related to waste management, SWRaCMS, waste segregation, recyclable materials, biodegradable waste, residual waste, hazardous waste, collection requests, collection schedules, tracking, LGU/MENRO operations, collection staff tasks, reports, analytics, collection map, notifications, and leaderboard.
2. If the question is unrelated, politely say that you can only help with SWRaCMS and waste-related questions.
3. Do not approve users, edit records, delete data, or make official LGU decisions.
4. Answer in simple Taglish if the user uses Tagalog or Taglish.
5. Keep the answer helpful and natural, like a real AI assistant.
6. If the user asks about exact live records, remind them that final records should be checked inside the system.
`;

    const openRouterResponse = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://capstone-swracms.vercel.app",
          "X-Title": "SWRaCMS Smart Assist",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: `Current user role: ${
                role || "Unknown"
              }\n\nUser message: ${message}`,
            },
          ],
          temperature: 0.6,
          max_tokens: 500,
        }),
      }
    );

    const data = await openRouterResponse.json();

    if (!openRouterResponse.ok) {
      console.error("OpenRouter API Error:", data);

      return Response.json(
        {
          error:
            data?.error?.message ||
            "Smart Assist failed to respond. Please check your API key or free limit.",
        },
        { status: openRouterResponse.status }
      );
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I could not generate a response right now.";

    return Response.json({
      reply,
    });
  } catch (error) {
    console.error("Smart Assist API Error:", error);

    return Response.json(
      {
        error: "Smart Assist failed to respond. Please try again.",
      },
      { status: 500 }
    );
  }
}