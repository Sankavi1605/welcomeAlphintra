const API_URL = "/api/chat/";

// Clear any previously stored session that might be invalid
(function() {
  const stored = sessionStorage.getItem("chatbot_session_id");
  const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (stored && !uuidV4Regex.test(stored)) {
    sessionStorage.removeItem("chatbot_session_id");
  }
})();

function getOrInitializeSession() {
  let sessionId = sessionStorage.getItem("chatbot_session_id");
  if (!sessionId) {
    try {
      sessionId = crypto.randomUUID();
    } catch (e) {
      // Fallback for older browsers
      sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    sessionStorage.setItem("chatbot_session_id", sessionId);
  }
  return sessionId;
}

const sessionId = getOrInitializeSession();
let conversationHistory = [];

const styleEl = document.createElement('style');
styleEl.textContent = `
  #chatbot-window {
    background: rgba(10, 10, 10, 0.45);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 32px;
    box-shadow: 0 30px 80px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05);
    transform-origin: bottom right;
    transition: transform 0.35s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
    background: rgba(10, 10, 10, 0.4);
    backdrop-filter: blur(30px);
    -webkit-backdrop-filter: blur(30px);
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  }
  #chatbot-trigger:hover {
    transform: scale(1.05);
    background: rgba(20, 20, 20, 0.5);
    box-shadow: 0 15px 50px rgba(0,0,0,0.4);
  }
  
  /* Orb Animation */
  .model-orb {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: radial-gradient(circle at 30% 30%, #4f46e5 0%, #7c3aed 40%, #0ea5e9 80%, #38bdf8 100%);
    box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4), inset 0 0 20px rgba(255,255,255,0.5);
    animation: orbFloat 4s ease-in-out infinite, orbPulse 3s ease-in-out infinite alternate;
    filter: contrast(1.2);
    position: relative;
  }
  .model-orb::after {
    content: '';
    position: absolute;
    top: 15%; left: 15%;
    width: 30%; height: 30%;
    background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%);
    border-radius: 50%;
    transform: rotate(-45deg);
  }
  @keyframes orbFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes orbPulse {
    0% { transform: scale(1); filter: contrast(1.2) hue-rotate(0deg); }
    100% { transform: scale(1.05); filter: contrast(1.4) hue-rotate(15deg); }
  }

  .cb-icon-btn {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: none;
    background: transparent;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: rgba(255,255,255,0.5);
    transition: background 0.2s, color 0.2s;
  }
  .cb-icon-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  
  .cb-send-btn {
    width: 32px; height: 32px;
    border-radius: 50%;
    border: none;
    background: #ffffff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    color: #000000;
    transition: transform 0.15s, background 0.2s;
  }
  .cb-send-btn:hover { transform: scale(1.08); background: #f0f0f0; }
  .cb-send-btn:active { transform: scale(0.95); }

  #chatbot-messages {
    scrollbar-width: none;
  }
  #chatbot-messages::-webkit-scrollbar { display: none; }
  
  .msg-bubble {
    max-width: 85%;
    padding: 12px 16px;
    border-radius: 20px;
    font-size: 14.5px;
    line-height: 1.5;
    word-wrap: break-word;
    margin-bottom: 12px;
  }
  .msg-user {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.05);
    color: #ffffff;
    align-self: flex-end;
    border-bottom-right-radius: 4px;
  }
  .msg-bot {
    background: transparent;
    color: #ffffff;
    align-self: flex-start;
    padding-left: 0;
  }
  
  .msg-slide-in {
    animation: msgSlideIn 0.3s cubic-bezier(0.2, 1, 0.3, 1) both;
  }
  @keyframes msgSlideIn {
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .typing-dot {
    width: 5px; height: 5px;
    background: rgba(255,255,255,0.5);
    border-radius: 50%;
    display: inline-block;
    animation: typingBounce 1.4s infinite ease-in-out both;
  }
  .typing-dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dot:nth-child(2) { animation-delay: -0.16s; }
  @keyframes typingBounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;
document.head.appendChild(styleEl);

const chatbotRoot = document.getElementById("chatbot-root");
chatbotRoot.innerHTML = `
  <div id="chatbot-container" style="position:fixed;bottom:24px;right:24px;z-index:9999;">

    <!-- Trigger FAB (Glassy) -->
    <button id="chatbot-trigger" style="height:60px;padding:0 24px;border-radius:30px;display:flex;align-items:center;justify-content:center;gap:10px;cursor:pointer;font-weight:600;font-size:16px;color:white;letter-spacing:0.5px;">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>
      </svg>
      Connect with Alphintra
    </button>

    <!-- Chat Window (Glassy) -->
    <div id="chatbot-window" class="cb-closed" style="position:absolute;bottom:70px;right:0;width:400px;max-width:calc(100vw - 32px);height:520px;max-height:calc(100vh - 100px);display:flex;flex-direction:column;overflow:hidden;">

      <!-- Header (Close Button) -->
      <div style="display:flex;justify-content:flex-end;padding:16px 16px 0;flex-shrink:0;">
        <button id="chatbot-close" class="cb-icon-btn" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.05);width:30px;height:30px;color:white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Home View (Orb & Text) -->
      <div id="cb-home-view" style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;padding:20px 32px 0;">
        <div class="model-orb"></div>
        <p style="text-align:center;color:rgba(255,255,255,0.8);font-size:15px;margin-top:40px;line-height:1.5;font-weight:400;">
          Alphintra's intelligent receptionist is ready to help you explore services and architect next-generation platforms.
        </p>
      </div>

      <!-- Chat View (Hidden initially) -->
      <div id="cb-chat-view" style="display:none;flex-direction:column;flex:1;overflow:hidden;padding-top:10px;">
        <div id="chatbot-messages" style="flex:1;overflow-y:auto;padding:0 20px;display:flex;flex-direction:column;mask-image:linear-gradient(to bottom, transparent 0%, black 5%, black 100%);-webkit-mask-image:linear-gradient(to bottom, transparent 0%, black 5%, black 100%);">
          <div style="height:20px;flex-shrink:0;"></div> <!-- Spacing at top -->
          <!-- Messages go here -->
        </div>
      </div>

      <!-- Input Area -->
      <div id="chatbot-input-area" style="padding:16px 20px 24px;">
        <div style="display:flex;align-items:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:6px 6px 6px 16px;box-shadow:inset 0 1px 4px rgba(0,0,0,0.2);">
          
          <button class="cb-icon-btn" style="width:28px;height:28px;margin-right:8px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </button>

          <input id="chatbot-input" maxlength="500" placeholder="Search..." style="flex:1;background:transparent;border:none;outline:none;font-size:15px;color:#ffffff;margin-right:8px;" />
          
          <button id="chatbot-send" class="cb-send-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
          </button>

        </div>
      </div>

    </div>
  </div>
`;

const trigger = document.getElementById("chatbot-trigger");
const closeBtn = document.getElementById("chatbot-close");
const windowEl = document.getElementById("chatbot-window");
const inputField = document.getElementById("chatbot-input");
const sendBtn = document.getElementById("chatbot-send");
const homeView = document.getElementById("cb-home-view");
const chatView = document.getElementById("cb-chat-view");
const messageContainer = document.getElementById("chatbot-messages");

// Dynamic placeholder color
const styleSheet = document.createElement("style");
styleSheet.innerText = "#chatbot-input::placeholder { color: rgba(255,255,255,0.4); }";
document.head.appendChild(styleSheet);

let isOpen = false;
let hasStartedChat = false;

function openChatbot(initialMessage = null) {
  if (!isOpen && window.uiAudio) window.uiAudio.playChatOpen();
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
  if (isOpen && window.uiAudio) window.uiAudio.playChatClose();
  isOpen = false;
  windowEl.classList.remove("cb-open");
  windowEl.classList.add("cb-closed");
  trigger.style.opacity = "1";
  trigger.style.pointerEvents = "all";
}

window.openChatbot = openChatbot;

trigger.addEventListener("click", openChatbot);
closeBtn.addEventListener("click", closeChatbot);

document.addEventListener("click", (e) => {
  const container = document.getElementById("chatbot-container");
  if (e.target.closest('[onclick*="openChatbot"]')) return;
  if (isOpen && !container.contains(e.target)) closeChatbot();
});

async function handleSend() {
  const text = inputField.value.trim();
  if (!text) return;

  if (!hasStartedChat) {
    hasStartedChat = true;
    homeView.style.display = 'none';
    chatView.style.display = 'flex';
  }

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

    if (!response.ok) throw new Error("HTTP error " + response.status);

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
  bubble.className = "msg-bubble msg-slide-in " + (role === "user" ? "msg-user" : "msg-bot");

  if (role === "assistant") {
    bubble.innerHTML = "<div style='display:flex;gap:12px;'>" +
      "<div style='width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 30% 30%, #4f46e5, #38bdf8);flex-shrink:0;box-shadow:0 2px 8px rgba(79,70,229,0.3);'></div>" +
      "<div class='msg-content' style='padding-top:2px;'></div>" +
      "</div>";
    bubble.querySelector('.msg-content').textContent = content;
  } else {
    bubble.textContent = content;
  }

  if (sources && sources.length > 0) {
    const badges = document.createElement("div");
    badges.style.cssText = "margin-top:10px;margin-left:36px;display:flex;flex-wrap:wrap;gap:6px;";
    sources.forEach(src => {
      const badge = document.createElement("span");
      badge.style.cssText = "font-size:11px;padding:4px 10px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.7);font-weight:500;";
      badge.textContent = `📚 ${src}`;
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
  indicator.innerHTML = "<div style='display:flex;gap:12px;align-items:center;height:24px;'>" +
    "<div style='width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 30% 30%, #4f46e5, #38bdf8);flex-shrink:0;box-shadow:0 2px 8px rgba(79,70,229,0.3);'></div>" +
    "<div style='display:flex;gap:4px;margin-left:4px;'><span class='typing-dot'></span><span class='typing-dot'></span><span class='typing-dot'></span></div>" +
    "</div>";
  messageContainer.appendChild(indicator);
  messageContainer.scrollTop = messageContainer.scrollHeight;
  return indicator;
}
