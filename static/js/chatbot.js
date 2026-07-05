const API_URL = "https://chatbot-backend-452555374554.us-central1.run.app/api/v1/chat";

function getOrInitializeSession() {
  let sessionId = sessionStorage.getItem("chatbot_session_id");

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("chatbot_session_id", sessionId);
  }

  return sessionId;
}

const sessionId = getOrInitializeSession();
let conversationHistory = [];

const chatbotRoot = document.getElementById("chatbot-root");

chatbotRoot.innerHTML = `
  <div id="chatbot-container" class="fixed bottom-6 right-6 z-[9999] font-body">
    <button id="chatbot-trigger"
      class="liquid-glass-strong w-16 h-16 rounded-full text-white text-2xl flex items-center justify-center shadow-2xl hover:bg-white/10 transition-colors">
      ✦
    </button>

    <div id="chatbot-window"
      class="hidden w-[360px] max-w-[calc(100vw-32px)] h-[520px] liquid-glass rounded-[32px] overflow-hidden flex-col">

      <div class="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-black/20">
        <div>
          <h3 class="font-heading italic text-2xl text-white">Alphintra Assistant</h3>
          <p class="text-xs text-green-300 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
            Online receptionist
          </p>
        </div>
        <button id="chatbot-close" class="text-white/70 hover:text-white text-2xl transition-colors">&times;</button>
      </div>

      <div id="chatbot-messages" class="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
        <div class="message-assistant liquid-glass rounded-[24px] px-4 py-3 text-sm text-white/80 max-w-[85%] self-start">
          Welcome to Alphintra. How can I help you today?
        </div>
      </div>

      <div class="p-3 border-t border-white/10 flex gap-2 bg-black/20">
        <input id="chatbot-input"
          maxlength="500"
          placeholder="Ask anything..."
          class="flex-1 rounded-full bg-black/40 text-white placeholder-white/40 px-4 py-3 text-sm outline-none border border-white/10 focus:border-white/30 transition-colors">

        <button id="chatbot-send"
          class="liquid-glass-strong rounded-full px-5 py-3 text-white text-sm hover:bg-white/10 transition-colors">
          Send
        </button>
      </div>
    </div>
  </div>
`;

const container = document.getElementById("chatbot-container");
const trigger = document.getElementById("chatbot-trigger");
const closeBtn = document.getElementById("chatbot-close");
const windowEl = document.getElementById("chatbot-window");
const inputField = document.getElementById("chatbot-input");
const sendBtn = document.getElementById("chatbot-send");
const messageContainer = document.getElementById("chatbot-messages");

function openChatbot(initialMessage = null) {
  windowEl.classList.remove("hidden");
  windowEl.classList.add("flex");
  trigger.classList.add("hidden");
  
  if (initialMessage && typeof initialMessage === 'string') {
    inputField.value = initialMessage;
    handleSend();
  } else {
    inputField.focus();
  }
}

function closeChatbot() {
  windowEl.classList.add("hidden");
  windowEl.classList.remove("flex");
  trigger.classList.remove("hidden");
}

window.openChatbot = openChatbot;

trigger.addEventListener("click", openChatbot);
closeBtn.addEventListener("click", closeChatbot);

// Close chatbot when clicking outside of it
document.addEventListener("click", (e) => {
  // Ignore clicks on buttons that explicitly open the chatbot
  if (e.target.closest('[onclick*="openChatbot"]')) return;

  if (!windowEl.classList.contains("hidden") && !container.contains(e.target)) {
    closeChatbot();
  }
});

async function handleSend() {
  const text = inputField.value.trim();

  if (!text) return;

  appendMessage("user", text);
  inputField.value = "";

  const typingIndicator = appendTypingIndicator();

  const historyPayload = conversationHistory.slice(-10);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
        history: historyPayload
      })
    });

    typingIndicator.remove();

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();

    appendMessage("assistant", data.answer || "I could not find an answer.", data.sources);

    conversationHistory.push({
      role: "user",
      content: text
    });

    conversationHistory.push({
      role: "assistant",
      content: data.answer || ""
    });

    // Keep history at a reasonable limit locally
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

  } catch (error) {
    typingIndicator.remove();

    appendMessage(
      "assistant",
      "Sorry, I am having trouble connecting right now. Please try again shortly."
    );

    console.error("Chatbot request failed:", error);
  }
}

sendBtn.addEventListener("click", handleSend);

inputField.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    handleSend();
  }
});

function appendMessage(role, content, sources = null) {
  const bubble = document.createElement("div");

  bubble.className = role === "user"
    ? "rounded-[24px] px-4 py-3 text-sm max-w-[85%] self-end bg-white text-black"
    : "rounded-[24px] px-4 py-3 text-sm max-w-[85%] self-start liquid-glass text-white/85";

  bubble.textContent = content;

  if (sources && sources.length > 0) {
    const badges = document.createElement("div");
    badges.className = "mt-2 flex flex-wrap gap-1";

    sources.forEach(function(src) {
      const badge = document.createElement("span");
      badge.className = "text-[10px] rounded-full px-2 py-1 bg-white/10 text-white/70";
      badge.textContent = "Source: " + src;
      badges.appendChild(badge);
    });

    bubble.appendChild(badges);
  }

  messageContainer.appendChild(bubble);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function appendTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "rounded-[24px] px-4 py-3 text-sm max-w-[85%] self-start liquid-glass text-white/70";
  indicator.textContent = "Typing...";
  messageContainer.appendChild(indicator);
  messageContainer.scrollTop = messageContainer.scrollHeight;
  return indicator;
}
