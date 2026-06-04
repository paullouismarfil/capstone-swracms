import { useMemo, useState } from "react";
import { Bot, Send, X, MessageCircle, Loader2 } from "lucide-react";

const CHAT_HISTORY_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getDefaultMessages(botName) {
  return [
    {
      sender: "bot",
      text: `Hi! I am ${botName}, your SWRaCMS AI assistant. You can ask me about waste segregation, collection requests, schedules, tracking, reports, and other waste-related system concerns.`,
    },
  ];
}

function loadSavedMessages(storageKey, botName) {
  const defaultMessages = getDefaultMessages(botName);

  try {
    const savedChat = localStorage.getItem(storageKey);

    if (!savedChat) {
      return defaultMessages;
    }

    const parsedChat = JSON.parse(savedChat);
    const savedAt = parsedChat?.savedAt || 0;
    const savedMessages = parsedChat?.messages || [];

    const isExpired = Date.now() - savedAt > CHAT_HISTORY_DURATION;

    if (isExpired) {
      localStorage.removeItem(storageKey);
      return defaultMessages;
    }

    if (Array.isArray(savedMessages) && savedMessages.length > 0) {
      return savedMessages;
    }

    return defaultMessages;
  } catch (error) {
    console.error("Failed to load Smart Assist chat history:", error);
    localStorage.removeItem(storageKey);
    return defaultMessages;
  }
}

export default function EcoBot({ role = "User", botName = "Smart Assist" }) {
  const storageKey = useMemo(
    () => `swracms_smart_assist_history_${role}`,
    [role]
  );

  const defaultMessages = useMemo(() => getDefaultMessages(botName), [botName]);

  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const [messages, setMessages] = useState(() =>
    loadSavedMessages(storageKey, botName)
  );

  const saveMessages = (newMessages) => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        savedAt: Date.now(),
        messages: newMessages,
      })
    );
  };

  const updateMessages = (newMessages) => {
    setMessages(newMessages);
    saveMessages(newMessages);
  };

  const sendMessage = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage || isSending) return;

    const userMessage = {
      sender: "user",
      text: cleanMessage,
    };

    const messagesWithUser = [...messages, userMessage];

    updateMessages(messagesWithUser);
    setMessage("");
    setIsSending(true);

    try {
      const apiUrl =
        window.location.hostname === "localhost"
          ? "http://localhost:3001/api/chat"
          : "/api/chat";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanMessage,
          role,
          botName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message.");
      }

      const botMessage = {
        sender: "bot",
        text:
          data.reply ||
          "Sorry, I could not generate a response at the moment.",
      };

      updateMessages([...messagesWithUser, botMessage]);
    } catch (error) {
      console.error(`${botName} Error:`, error);

      const errorMessage = {
        sender: "bot",
        text: `Sorry, ${botName} cannot respond right now. Please check the AI server, API key, or internet connection.`,
      };

      updateMessages([...messagesWithUser, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const clearChat = () => {
    localStorage.removeItem(storageKey);
    setMessages(defaultMessages);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-3 text-white shadow-lg transition hover:bg-emerald-800"
        >
          <MessageCircle size={20} />
          {botName}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[360px] flex-col overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-emerald-700 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <Bot size={20} />
              </div>

              <div>
                <h3 className="text-sm font-semibold">{botName}</h3>
                <p className="text-xs text-emerald-50">
                  SWRaCMS AI Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearChat}
                className="rounded-full px-2 py-1 text-[11px] hover:bg-white/20"
                title="Clear chat history"
              >
                Clear
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="rounded-full p-1 hover:bg-white/20"
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-emerald-50/50 p-4">
            {messages.map((item, index) => (
              <div
                key={index}
                className={`flex ${
                  item.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                    item.sender === "user"
                      ? "bg-emerald-700 text-white"
                      : "border border-emerald-100 bg-white text-gray-700"
                  }`}
                >
                  {item.text}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-white px-4 py-2 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  {botName} is typing...
                </div>
              </div>
            )}
          </div>

          <div className="border-t bg-white p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about SWRaCMS..."
                className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-600"
              />

              <button
                onClick={sendMessage}
                disabled={isSending}
                className="rounded-xl bg-emerald-700 p-2 text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                title="Send message"
              >
                {isSending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>

            <p className="mt-2 text-center text-[11px] text-gray-400">
              Chat history is saved for 24 hours. Final decisions remain with
              LGU/MENRO.
            </p>
          </div>
        </div>
      )}
    </>
  );
}