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

// Inject global chatbot styles
const styleEl = document.createElement('style');
styleEl.textContent = `
  #chatbot-window {
    background: linear-gradient(160deg, rgba(15,10,30,0.97) 0%, rgba(8,6,20,0.99) 100%);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 30px 80px -10px rgba(0,0,0,0.9), 0 0 0 1px rgba(150,80,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06);
    transform-origin: bottom right;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
  }
  #chatbot-window.cb-open {
    transform: scale(1) translateY(0);
    opacity: 1;
    pointer-events: all;
  }
  #chatbot-window.cb-closed {
    transform: scale(0.88) translateY(16px);
    opacity: 0;
    pointer-events: none;
  }
  #chatbot-trigger {
    background: linear-gradient(135deg, #6c2bd9, #3b0fa0);
    border: 1px solid rgba(255,255,255,0.15);
    box-shadow: 0 8px 32px rgba(108,43,217,0.6), 0 2px 8px rgba(0,0,0,0.4);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  #chatbot-trigger:hover {
    transform: scale(1.08);
    box-shadow: 0 12px 40px rgba(108,43,217,0.8), 0 2px 8px rgba(0,0,0,0.4);
  }
  #chatbot-header {
    background: linear-gradient(180deg, rgba(108,43,217,0.18) 0%, transparent 100%);
    border-bottom: 1px solid rgba(255,255,255,0.07);
  }
  #chatbot-messages {
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.1) transparent;
  }
  #chatbot-messages::-webkit-scrollbar { width: 4px; }
  #chatbot-messages::-webkit-scrollbar-track { background: transparent; }
  #chatbot-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
  .msg-user {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    border: 1px solid rgba(255,255,255,0.12);
    box-shadow: 0 4px 16px rgba(109,40,217,0.35);
    color: #fff;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }
  .msg-bot {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 2px 12px rgba(0,0,0,0.2);
    color: rgba(255,255,255,0.88);
    align-self: flex-start;
    border-bottom-left-radius: 4px;
  }
  .msg-bubble {
    max-width: 82%;
    padding: 12px 16px;
    border-radius: 18px;
    font-size: 14px;
    line-height: 1.6;
    letter-spacing: 0.01em;
  }
  #chatbot-input-area {
    background: rgba(255,255,255,0.03);
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  #chatbot-input {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: #fff;
    font-size: 14px;
    transition: border-color 0.2s, background 0.2s;
    outline: none;
  }
  #chatbot-input::placeholder { color: rgba(255,255,255,0.3); }
  #chatbot-input:focus {
    background: rgba(255,255,255,0.09);
    border-color: rgba(124,58,237,0.7);
    box-shadow: 0 0 0 3px rgba(124,58,237,0.12);
  }
  #chatbot-send {
    background: linear-gradient(135deg, #7c3aed, #4f46e5);
    border: none;
    transition: transform 0.15s, box-shadow 0.15s;
    box-shadow: 0 4px 16px rgba(109,40,217,0.5);
  }
  #chatbot-send:hover {
    transform: scale(1.06);
    box-shadow: 0 6px 20px rgba(109,40,217,0.7);
  }
  #chatbot-send:active { transform: scale(0.97); }
  .typing-dot {
    width: 6px; height: 6px;
    background: rgba(255,255,255,0.5);
    border-radius: 50%;
    animation: typingBounce 1.2s infinite ease-in-out;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.18s; }
  .typing-dot:nth-child(3) { animation-delay: 0.36s; }
  @keyframes typingBounce {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-6px); opacity: 1; }
  }
  .msg-slide-in {
    animation: msgSlideIn 0.28s cubic-bezier(0.34,1.2,0.64,1) both;
  }
  @keyframes msgSlideIn {
    from { opacity: 0; transform: translateY(10px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
`;
document.head.appendChild(styleEl);

const chatbotRoot = document.getElementById("chatbot-root");
chatbotRoot.innerHTML = `
  <div id="chatbot-container" style="position:fixed;bottom:24px;right:24px;z-index:9999;font-family:'Barlow', sans-serif;">

    <!-- Trigger FAB -->
    <button id="chatbot-trigger" style="width:60px;height:60px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    </button>

    <!-- Chat Window -->
    <div id="chatbot-window" class="cb-closed" style="position:absolute;bottom:72px;right:0;width:380px;max-width:calc(100vw - 32px);height:580px;border-radius:28px;display:flex;flex-direction:column;overflow:hidden;">

      <!-- Header -->
      <div id="chatbot-header" style="padding:20px 20px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="width:40px;height:40px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(109,40,217,0.5);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
          </div>
          <div>
            <div style="color:#fff;font-size:16px;font-weight:600;letter-spacing:-0.01em;">Alphintra AI</div>
            <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
              <span style="width:7px;height:7px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px #22c55e;display:inline-block;"></span>
              <span style="font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.04em;">Online · Ready to help</span>
            </div>
          </div>
        </div>
        <button id="chatbot-close" style="width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);color:rgba(255,255,255,0.5);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.06)'">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Messages -->
      <div id="chatbot-messages" style="flex:1;overflow-y:auto;padding:12px 16px;display:flex;flex-direction:column;gap:10px;">
        <div class="msg-bubble msg-bot msg-slide-in">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <div style="width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            </div>
            <span style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:500;letter-spacing:0.04em;">ALPHINTRA AI</span>
          </div>
          Welcome to Alphintra! I'm your AI receptionist. How can I help you today?
        </div>
      </div>

      <!-- Suggested prompts -->
      <div id="suggested-prompts" style="padding:0 16px 10px;display:flex;gap:6px;flex-wrap:wrap;flex-shrink:0;">
        <button onclick="useSuggestion('What services do you offer?')" style="font-size:12px;padding:6px 12px;border-radius:20px;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);color:rgba(255,255,255,0.65);cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='rgba(124,58,237,0.25)'" onmouseout="this.style.background='rgba(124,58,237,0.12)'">Our services</button>
        <button onclick="useSuggestion('How can I contact Alphintra?')" style="font-size:12px;padding:6px 12px;border-radius:20px;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);color:rgba(255,255,255,0.65);cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='rgba(124,58,237,0.25)'" onmouseout="this.style.background='rgba(124,58,237,0.12)'">Contact us</button>
        <button onclick="useSuggestion('Tell me about Alphintra')" style="font-size:12px;padding:6px 12px;border-radius:20px;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);color:rgba(255,255,255,0.65);cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='rgba(124,58,237,0.25)'" onmouseout="this.style.background='rgba(124,58,237,0.12)'">About us</button>
      </div>

      <!-- Input Area -->
      <div id="chatbot-input-area" style="padding:12px 14px;display:flex;align-items:center;gap:10px;flex-shrink:0;">
        <input id="chatbot-input" maxlength="500" placeholder="Message Alphintra AI..." style="flex:1;border-radius:14px;padding:12px 16px;font-family:inherit;" />
        <button id="chatbot-send" style="width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
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
const suggestedPrompts = document.getElementById("suggested-prompts");

let isOpen = false;

function openChatbot(initialMessage = null) {
  isOpen = true;
  windowEl.classList.remove("cb-closed");
  windowEl.classList.add("cb-open");
  trigger.style.opacity = "0";
  trigger.style.pointerEvents = "none";

  if (initialMessage && typeof initialMessage === 'string') {
    inputField.value = initialMessage;
    handleSend();
  } else {
    setTimeout(() => inputField.focus(), 300);
  }
}

function closeChatbot() {
  isOpen = false;
  windowEl.classList.remove("cb-open");
  windowEl.classList.add("cb-closed");
  trigger.style.opacity = "1";
  trigger.style.pointerEvents = "all";
}

window.openChatbot = openChatbot;

window.useSuggestion = function(text) {
  inputField.value = text;
  handleSend();
};

trigger.addEventListener("click", openChatbot);
closeBtn.addEventListener("click", closeChatbot);

document.addEventListener("click", (e) => {
  if (e.target.closest('[onclick*="openChatbot"]')) return;
  if (isOpen && !container.contains(e.target)) closeChatbot();
});

async function handleSend() {
  const text = inputField.value.trim();
  if (!text) return;

  // Hide suggestion prompts after first message
  if (suggestedPrompts) suggestedPrompts.style.display = 'none';

  appendMessage("user", text);
  inputField.value = "";
  const typingIndicator = appendTypingIndicator();

  const historyPayload = conversationHistory.slice(-10);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, session_id: sessionId, history: historyPayload })
    });

    typingIndicator.remove();

    if (!response.ok) throw new Error(\`HTTP error: \${response.status}\`);

    const data = await response.json();
    appendMessage("assistant", data.answer || "I could not find an answer.", data.sources);

    conversationHistory.push({ role: "user", content: text });
    conversationHistory.push({ role: "assistant", content: data.answer || "" });

    if (conversationHistory.length > 20) conversationHistory = conversationHistory.slice(-20);

  } catch (error) {
    typingIndicator.remove();
    appendMessage("assistant", "Sorry, I'm having trouble connecting right now. Please try again shortly.");
    console.error("Chatbot request failed:", error);
  }
}

sendBtn.addEventListener("click", handleSend);
inputField.addEventListener("keydown", (e) => { if (e.key === "Enter") handleSend(); });

function appendMessage(role, content, sources = null) {
  const bubble = document.createElement("div");
  bubble.className = \`msg-bubble msg-slide-in \${role === "user" ? "msg-user" : "msg-bot"}\`;

  if (role === "assistant") {
    bubble.innerHTML = \`
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <div style="width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#7c3aed,#4f46e5);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        </div>
        <span style="font-size:11px;color:rgba(255,255,255,0.35);font-weight:500;letter-spacing:0.04em;">ALPHINTRA AI</span>
      </div>
      <span class="msg-content"></span>
    \`;
    bubble.querySelector('.msg-content').textContent = content;
  } else {
    bubble.textContent = content;
  }

  if (sources && sources.length > 0) {
    const badges = document.createElement("div");
    badges.style.cssText = "margin-top:10px;display:flex;flex-wrap:wrap;gap:5px;";
    sources.forEach(src => {
      const badge = document.createElement("span");
      badge.style.cssText = "font-size:10px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.5);letter-spacing:0.04em;text-transform:uppercase;";
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
  indicator.className = "msg-bubble msg-bot";
  indicator.innerHTML = \`<div style="display:flex;align-items:center;gap:5px;height:20px;"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>\`;
  messageContainer.appendChild(indicator);
  messageContainer.scrollTop = messageContainer.scrollHeight;
  return indicator;
}
