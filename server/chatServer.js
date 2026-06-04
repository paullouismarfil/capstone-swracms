import http from "http";
import fs from "fs";
import path from "path";
import { ecobotKnowledge } from "../api/ecobotKnowledge.js";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) return;

  const envText = fs.readFileSync(envPath, "utf8");

  envText.split("\n").forEach((line) => {
    const cleanLine = line.trim();

    if (!cleanLine || cleanLine.startsWith("#")) return;

    const equalIndex = cleanLine.indexOf("=");

    if (equalIndex === -1) return;

    const key = cleanLine.slice(0, equalIndex).trim();
    const value = cleanLine.slice(equalIndex + 1).trim();

    if (key && value && !process.env[key]) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  });
}

loadEnvLocal();

const PORT = 3001;

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "http://localhost:5173",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });

  res.end(JSON.stringify(data));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.url !== "/api/chat" || req.method !== "POST") {
    return sendJson(res, 404, {
      error: "Route not found. Use POST /api/chat",
    });
  }

  try {
    const requestBody = await readRequestBody(req);
    const { message, role } = requestBody;

    if (!message || typeof message !== "string") {
      return sendJson(res, 400, {
        error: "Message is required.",
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return sendJson(res, 500, {
        error: "Missing OPENROUTER_API_KEY in .env.local",
      });
    }

    const systemPrompt = `
${ecobotKnowledge}

You are EcoBot, a real AI assistant inside SWRaCMS.

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
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "SWRaCMS EcoBot",
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
              content: `Current user role: ${role || "Unknown"}\n\nUser message: ${message}`,
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

      return sendJson(res, openRouterResponse.status, {
        error:
          data?.error?.message ||
          "OpenRouter failed to respond. Please check your API key or free limit.",
      });
    }

    const reply =
      data?.choices?.[0]?.message?.content ||
      "Sorry po, I could not generate a response right now.";

    return sendJson(res, 200, {
      reply,
    });
  } catch (error) {
    console.error("EcoBot OpenRouter Server Error:", error);

    return sendJson(res, 500, {
      error: "EcoBot failed to respond. Please check the local backend server.",
    });
  }
});

server.listen(PORT, () => {
  console.log(`EcoBot OpenRouter server running at http://localhost:${PORT}`);
});