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
  <div id="chatbot-container" class="fixed bottom-6 right-6 z-[9999] font-sans">
    <button id="chatbot-trigger"
      class="liquid-glass-strong w-16 h-16 rounded-full text-white text-2xl flex items-center justify-center shadow-[0_10px_40px_rgba(150,50,255,0.4)] hover:bg-white/20 transition-all hover:scale-105">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
    </button>

    <div id="chatbot-window"
      class="hidden w-[380px] max-w-[calc(100vw-32px)] h-[600px] bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.8)] rounded-[32px] overflow-hidden flex-col transition-all duration-300 origin-bottom-right scale-95 opacity-0">

      <!-- Header -->
      <div class="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-b from-white/10 to-transparent">
        <div>
          <h3 class="font-heading italic text-3xl text-white drop-shadow-md">Alphintra AI</h3>
          <p class="text-[11px] text-white/60 flex items-center gap-2 mt-1.5 font-medium tracking-widest uppercase">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Online
          </p>
        </div>
        <button id="chatbot-close" class="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all text-xl pb-0.5">&times;</button>
      </div>

      <!-- Messages -->
      <div id="chatbot-messages" class="flex-1 p-5 overflow-y-auto flex flex-col gap-4 scroll-smooth">
        <div class="message-assistant rounded-2xl rounded-tl-sm px-5 py-3.5 text-[15px] bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white/90 max-w-[85%] self-start shadow-lg leading-relaxed">
          Welcome to Alphintra. How can I help you architect your next digital product?
        </div>
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-white/10 bg-black/20">
        <div class="relative flex items-center">
          <input id="chatbot-input"
            maxlength="500"
            placeholder="Ask anything..."
            class="w-full rounded-full bg-white/5 hover:bg-white/10 focus:bg-white/10 text-white placeholder-white/40 pl-5 pr-12 py-3.5 text-[15px] outline-none border border-white/10 focus:border-white/30 transition-all shadow-inner">

          <button id="chatbot-send"
            class="absolute right-1.5 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-md">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="translate-x-[-1px] translate-y-[1px]"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
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
  
  // Trigger entry animation
  setTimeout(() => {
    windowEl.classList.remove("scale-95", "opacity-0");
    windowEl.classList.add("scale-100", "opacity-100");
  }, 10);
  
  if (initialMessage && typeof initialMessage === 'string') {
    inputField.value = initialMessage;
    handleSend();
  } else {
    inputField.focus();
  }
}

function closeChatbot() {
  // Trigger exit animation
  windowEl.classList.remove("scale-100", "opacity-100");
  windowEl.classList.add("scale-95", "opacity-0");
  
  setTimeout(() => {
    windowEl.classList.add("hidden");
    windowEl.classList.remove("flex");
    trigger.classList.remove("hidden");
  }, 300);
}

window.openChatbot = openChatbot;

trigger.addEventListener("click", openChatbot);
closeBtn.addEventListener("click", closeChatbot);

// Close chatbot when clicking outside of it
document.addEventListener("click", (e) => {
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: text,
        session_id: sessionId,
        history: historyPayload
      })
    });

    typingIndicator.remove();

    if (!response.ok) throw new Error(\`HTTP error: \${response.status}\`);

    const data = await response.json();
    appendMessage("assistant", data.answer || "I could not find an answer.", data.sources);

    conversationHistory.push({ role: "user", content: text });
    conversationHistory.push({ role: "assistant", content: data.answer || "" });

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }
  } catch (error) {
    typingIndicator.remove();
    appendMessage("assistant", "Sorry, I am having trouble connecting right now. Please try again shortly.");
    console.error("Chatbot request failed:", error);
  }
}

sendBtn.addEventListener("click", handleSend);

inputField.addEventListener("keydown", function(event) {
  if (event.key === "Enter") handleSend();
});

function appendMessage(role, content, sources = null) {
  const bubble = document.createElement("div");

  bubble.className = role === "user"
    ? "rounded-2xl rounded-tr-sm px-5 py-3.5 text-[15px] max-w-[85%] self-end bg-white text-black shadow-lg leading-relaxed"
    : "rounded-2xl rounded-tl-sm px-5 py-3.5 text-[15px] max-w-[85%] self-start bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white/90 shadow-lg leading-relaxed";

  bubble.textContent = content;

  if (sources && sources.length > 0) {
    const badges = document.createElement("div");
    badges.className = "mt-3 flex flex-wrap gap-1.5";

    sources.forEach(function(src) {
      const badge = document.createElement("span");
      badge.className = "text-[10px] uppercase tracking-wider font-semibold rounded-full px-2.5 py-1 bg-white/10 text-white/70 border border-white/10";
      badge.textContent = src;
      badges.appendChild(badge);
    });

    bubble.appendChild(badges);
  }

  messageContainer.appendChild(bubble);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

function appendTypingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "rounded-2xl rounded-tl-sm px-5 py-3.5 text-[15px] max-w-[85%] self-start bg-gradient-to-br from-white/10 to-white/5 border border-white/10 text-white/70 shadow-lg flex items-center gap-1.5";
  
  // Modern typing dots animation
  indicator.innerHTML = \`
    <span class="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style="animation-delay: 0ms"></span>
    <span class="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style="animation-delay: 150ms"></span>
    <span class="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style="animation-delay: 300ms"></span>
  \`;

  messageContainer.appendChild(indicator);
  messageContainer.scrollTop = messageContainer.scrollHeight;
  return indicator;
}
