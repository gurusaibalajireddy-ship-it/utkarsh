/**
 * WE CARE — Patient AI Assistant Page
 * Full chat with Groq AI, Voice, Translation
 */

Router.register('patient-ai', () => {
  const session = Auth.requireAuth('patient');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderPatientPortal('patient-ai', user);
});

let _aiState = {
  sessionId: null,
  messages: [],
  language: 'en',
  isListening: false,
  isProcessing: false,
};

function PatientAIPage(user, container) {
  const session = Store.Session.get();
  const chatSessions = Store.AIChats.getForUser(session.id);

  // Load or create session
  if (chatSessions.length > 0) {
    _aiState.sessionId = chatSessions[0].id;
    _aiState.messages = [...chatSessions[0].messages];
    _aiState.language = chatSessions[0].language || 'en';
  } else {
    _aiState.sessionId = null;
    _aiState.messages = [];
  }

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">🤖 We Care AI</h1>
          <p class="section-desc">Your personal health assistant — available 24/7</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          <!-- Language Selector -->
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:13px;color:var(--text-muted)">🌐 Language:</span>
            <select id="ai-lang-select" class="form-control" style="width:auto;padding:7px 12px;font-size:13px" onchange="AIPage.setLanguage(this.value)">
              <option value="en" ${_aiState.language === 'en' ? 'selected' : ''}>English</option>
              <option value="te" ${_aiState.language === 'te' ? 'selected' : ''}>తెలుగు (Telugu)</option>
              <option value="hi" ${_aiState.language === 'hi' ? 'selected' : ''}>हिंदी (Hindi)</option>
              <option value="ta" ${_aiState.language === 'ta' ? 'selected' : ''}>தமிழ் (Tamil)</option>
              <option value="kn" ${_aiState.language === 'kn' ? 'selected' : ''}>ಕನ್ನಡ (Kannada)</option>
              <option value="ml" ${_aiState.language === 'ml' ? 'selected' : ''}>മലയാളം (Malayalam)</option>
            </select>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="AIPage.newSession()">+ New Chat</button>
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('patient-ai-history')" style="font-size:13px">📚 History</button>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 300px;gap:24px;height:calc(100vh - 220px)">
      <!-- MAIN CHAT -->
      <div class="ai-chat-wrap">
        <div class="ai-chat-header">
          <div class="ai-avatar">🤖</div>
          <div>
            <div class="ai-name">We Care AI</div>
            <div class="ai-status" id="ai-status-text">● Ready to help</div>
          </div>
          ${!AIService.getApiKey() ? `<div style="margin-left:auto;background:rgba(255,255,255,0.15);padding:4px 10px;border-radius:var(--radius-full);font-size:11px">🎯 Mock Mode</div>` : ''}
        </div>

        <div class="ai-chat-disclaimer">
          ℹ️ We Care AI provides assistance and general information. <strong>Always follow your doctor's instructions.</strong>
        </div>

        <div class="ai-messages" id="ai-messages">
          ${_aiState.messages.length === 0 ? renderWelcomeMsg(user) : ''}
          ${_aiState.messages.map(m => renderAIMessage(m)).join('')}
        </div>

        <div class="ai-chat-input-area">
          <div id="ai-voice-status" style="display:none" class="ai-voice-status">🎙️ Listening...</div>
          <div class="ai-input-row">
            <div class="ai-input-wrap">
              <textarea id="ai-input" placeholder="${getAIPlaceholder(_aiState.language)}" rows="1"
                onkeydown="AIPage.inputKeydown(event)"
                oninput="this.style.height='auto';this.style.height=Math.min(this.scrollHeight,120)+'px'"></textarea>
              <div class="ai-input-tools">
                <button class="ai-tool-btn" id="voice-btn" onclick="AIPage.toggleVoice()" title="Voice input">
                  🎙️ <span id="voice-btn-label">Voice</span>
                </button>
                <button class="ai-tool-btn" id="speak-btn" onclick="AIPage.speakLastResponse()" title="Read last response">
                  🔊 Read
                </button>
                <button class="ai-tool-btn" onclick="AIPage.clearChat()" title="Clear chat">
                  🗑️ Clear
                </button>
              </div>
            </div>
            <button class="ai-send-btn" onclick="AIPage.send()" title="Send message">➤</button>
          </div>
        </div>
      </div>

      <!-- SIDEBAR: Quick Prompts + History -->
      <div style="display:flex;flex-direction:column;gap:16px;overflow-y:auto">
        <div class="card">
          <div class="card-title" style="margin-bottom:14px">⚡ Quick Questions</div>
          ${getQuickPrompts(_aiState.language).map(q => `
            <button class="btn btn-ghost btn-sm" style="width:100%;text-align:left;justify-content:flex-start;margin-bottom:6px;font-size:12px;border:1px solid var(--border-light)" onclick="AIPage.quickAsk('${q.replace(/'/g, "\\'")}')">
              ${q}
            </button>
          `).join('')}
        </div>

        <div class="card">
          <div class="card-title" style="margin-bottom:14px">📚 Recent Chats</div>
          ${Store.AIChats.getForUser(Store.Session.get().id).slice(0, 5).map(s => `
            <div style="padding:10px;border-radius:var(--radius);cursor:pointer;border:1px solid var(--border-light);margin-bottom:6px;transition:var(--transition)" onmouseover="this.style.background='var(--teal-50)'" onmouseout="this.style.background=''" onclick="AIPage.loadSession('${s.id}')">
              <div style="font-size:13px;font-weight:600;color:var(--text-primary)">${Utils.esc(s.topic.substring(0,40))}...</div>
              <div style="font-size:11px;color:var(--text-muted);margin-top:3px">${Utils.timeAgo(s.updatedAt)}</div>
            </div>
          `).join('')}
          ${Store.AIChats.getForUser(Store.Session.get().id).length === 0 ? '<p style="font-size:13px;color:var(--text-muted)">No previous conversations</p>' : ''}
        </div>
      </div>
    </div>
  `;

  scrollAIMessages();
}

function renderWelcomeMsg(user) {
  const welcomes = {
    en: `Hello ${user.name.split(' ')[0]}! 👋 I'm **We Care AI**, your personal health assistant. How can I help you today?\n\nI can help with:\n• 💊 Your medication schedule\n• ℹ️ Health information & terminology\n• 🌐 Translation in Indian languages\n• 📅 Your appointments\n• 📱 Navigating WE CARE\n\n⚠️ *I provide information only. Always follow Dr. ${user.doctorAssigned ? Store.Users.getById(user.doctorAssigned)?.name || 'your doctor' : 'your doctor'}'s instructions.*`,
    te: `నమస్కారం ${user.name.split(' ')[0]}! 👋 నేను **వి కేర్ AI**, మీ వ్యక్తిగత ఆరోగ్య సహాయకుడిని. నేను మీకు ఈ రోజు ఏవిధంగా సహాయం చేయాలి?\n\nనేను సహాయం చేయగలను:\n• 💊 మీ మందుల షెడ్యూల్\n• ℹ️ ఆరోగ్య సమాచారం\n• 🌐 భాషా అనువాదం\n\n⚠️ *నేను సమాచారం మాత్రమే అందిస్తాను. ఎల్లప్పుడూ మీ డాక్టర్ సూచనలను అనుసరించండి.*`,
    hi: `नमस्ते ${user.name.split(' ')[0]}! 👋 मैं **We Care AI** हूं, आपका व्यक्तिगत स्वास्थ्य सहायक। आज मैं आपकी कैसे मदद कर सकता हूं?\n\nमैं इन चीजों में मदद कर सकता हूं:\n• 💊 आपकी दवाओं का शेड्यूल\n• ℹ️ स्वास्थ्य जानकारी\n• 🌐 भाषा अनुवाद\n\n⚠️ *मैं केवल जानकारी प्रदान करता हूं। हमेशा अपने डॉक्टर के निर्देशों का पालन करें।*`,
  };
  const msg = welcomes[_aiState.language] || welcomes.en;
  return renderAIMessage({ role: 'ai', text: msg, timestamp: new Date().toISOString() });
}

function renderAIMessage(msg) {
  const isUser = msg.role === 'user';
  const text = msg.text || msg.content || '';
  const formattedText = Utils.markdownToHtml(text);
  return `
    <div class="msg-bubble ${isUser ? 'user' : 'ai'}">
      <div class="msg-avatar ${isUser ? 'user' : 'ai'}">${isUser ? 'P' : '🤖'}</div>
      <div class="msg-content">
        ${!isUser ? '<div class="msg-ai-label">AI Generated</div>' : ''}
        <div class="msg-text">${formattedText}</div>
        <div class="msg-meta">${Utils.timeAgo(msg.timestamp || new Date().toISOString())}</div>
      </div>
    </div>
  `;
}

function scrollAIMessages() {
  const msgs = document.getElementById('ai-messages');
  if (msgs) setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 100);
}

function getAIPlaceholder(lang) {
  const placeholders = {
    en: 'Ask me anything about your health or medications...',
    te: 'మీ ఆరోగ్యం గురించి ఏదైనా అడగండి...',
    hi: 'अपने स्वास्थ्य के बारे में कुछ भी पूछें...',
    ta: 'உங்கள் உடல்நலம் பற்றி கேளுங்கள்...',
    kn: 'ನಿಮ್ಮ ಆರೋಗ್ಯದ ಬಗ್ಗೆ ಏನಾದರೂ ಕೇಳಿ...',
    ml: 'നിങ്ങളുടെ ആരോഗ്യത്തെ കുറിച്ച് ചോദിക്കൂ...',
  };
  return placeholders[lang] || placeholders.en;
}

function getQuickPrompts(lang) {
  const prompts = {
    en: ['When should I take my medicines?', 'What are side effects of Azithromycin?', 'Explain my prescription', 'When is my next appointment?', 'What foods should I avoid?'],
    te: ['నా మందులు ఎప్పుడు తీసుకోవాలి?', 'అజిత్రోమైసిన్ దుష్ప్రభావాలు ఏమిటి?', 'నా ప్రిస్క్రిప్షన్ వివరించండి', 'నా తదుపరి అపాయింట్‌మెంట్ ఎప్పుడు?'],
    hi: ['मुझे दवाएं कब लेनी चाहिए?', 'मेरी प्रिस्क्रिप्शन समझाएं', 'अगली appointment कब है?', 'किन खाद्य पदार्थों से बचें?'],
  };
  return prompts[lang] || prompts.en;
}

const AIPage = {
  async send() {
    const input = document.getElementById('ai-input');
    if (!input || _aiState.isProcessing) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    input.style.height = 'auto';

    const session = Store.Session.get();
    const userMsg = { role: 'user', text, timestamp: new Date().toISOString() };
    _aiState.messages.push(userMsg);

    // Add to UI
    const messagesEl = document.getElementById('ai-messages');
    if (messagesEl) {
      messagesEl.innerHTML += renderAIMessage(userMsg);
      // Show typing indicator
      const typingEl = document.createElement('div');
      typingEl.className = 'msg-bubble ai';
      typingEl.id = 'typing-indicator';
      typingEl.innerHTML = `
        <div class="msg-avatar ai">🤖</div>
        <div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>
      `;
      messagesEl.appendChild(typingEl);
      scrollAIMessages();
    }

    // Update status
    const statusEl = document.getElementById('ai-status-text');
    if (statusEl) statusEl.textContent = '⚙️ Processing...';
    _aiState.isProcessing = true;

    // Create or use session
    if (!_aiState.sessionId) {
      const chatSession = Store.AIChats.createSession(session.id, text);
      _aiState.sessionId = chatSession.id;
    }
    Store.AIChats.addMessage(_aiState.sessionId, { ...userMsg });

    // Call AI
    const historyForAPI = _aiState.messages.slice(-10).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));
    const result = await AIService.chat(historyForAPI, _aiState.language);

    _aiState.isProcessing = false;
    if (statusEl) statusEl.textContent = '● Ready to help';

    // Remove typing indicator
    document.getElementById('typing-indicator')?.remove();

    const aiMsg = { role: 'ai', text: result.text || 'I encountered an issue. Please try again.', timestamp: new Date().toISOString() };
    _aiState.messages.push(aiMsg);
    Store.AIChats.addMessage(_aiState.sessionId, { ...aiMsg });
    Store.AuditLog.add({ action: 'AI_CHAT', userId: session.id, language: _aiState.language });
    Store.Timeline.add({ userId: session.id, type: 'ai', title: 'AI Conversation', description: text.substring(0, 60), icon: '🤖' });

    if (messagesEl) {
      messagesEl.innerHTML += renderAIMessage(aiMsg);
      scrollAIMessages();
    }
  },

  inputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
  },

  setLanguage(lang) {
    _aiState.language = lang;
    const input = document.getElementById('ai-input');
    if (input) input.placeholder = getAIPlaceholder(lang);
    NotifService.toast('info', 'Language Changed', `AI will respond in ${AIService.getLanguageName(lang)}`);
  },

  quickAsk(text) {
    const input = document.getElementById('ai-input');
    if (input) { input.value = text; this.send(); }
  },

  toggleVoice() {
    const voiceBtn = document.getElementById('voice-btn');
    const voiceStatus = document.getElementById('ai-voice-status');
    const label = document.getElementById('voice-btn-label');

    if (_aiState.isListening) {
      AIService.stopListening();
      _aiState.isListening = false;
      if (voiceBtn) voiceBtn.classList.remove('active');
      if (voiceStatus) voiceStatus.style.display = 'none';
      if (label) label.textContent = 'Voice';
    } else {
      _aiState.isListening = true;
      if (voiceBtn) voiceBtn.classList.add('active');
      if (voiceStatus) { voiceStatus.style.display = 'block'; voiceStatus.textContent = '🎙️ Listening...'; }
      if (label) label.textContent = 'Stop';

      AIService.startListening(
        _aiState.language,
        (transcript) => {
          const input = document.getElementById('ai-input');
          if (input) input.value = transcript;
          _aiState.isListening = false;
          if (voiceBtn) voiceBtn.classList.remove('active');
          if (voiceStatus) voiceStatus.style.display = 'none';
          if (label) label.textContent = 'Voice';
          this.send();
        },
        () => {
          _aiState.isListening = false;
          if (voiceBtn) voiceBtn.classList.remove('active');
          if (voiceStatus) voiceStatus.style.display = 'none';
          if (label) label.textContent = 'Voice';
        },
        (error) => {
          _aiState.isListening = false;
          if (voiceBtn) voiceBtn.classList.remove('active');
          if (voiceStatus) voiceStatus.style.display = 'none';
          if (label) label.textContent = 'Voice';
          NotifService.toast('warning', 'Voice Error', error);
        }
      );
    }
  },

  speakLastResponse() {
    const lastAI = [..._aiState.messages].reverse().find(m => m.role === 'ai');
    if (!lastAI) { NotifService.toast('info', 'Nothing to read', 'No AI response yet'); return; }
    if (AIService.isSpeaking()) { AIService.stopSpeaking(); return; }
    AIService.speak(lastAI.text, _aiState.language);
    NotifService.toast('info', '🔊 Reading Response', 'Text-to-speech active');
  },

  newSession() {
    _aiState.sessionId = null;
    _aiState.messages = [];
    const session = Store.Session.get();
    const user = Store.Users.getById(session.id);
    PatientAIPage(user, document.getElementById('patient-page-content'));
  },

  loadSession(sessionId) {
    const chatSession = Store.AIChats.getSession(sessionId);
    if (!chatSession) return;
    _aiState.sessionId = sessionId;
    _aiState.messages = [...chatSession.messages];
    _aiState.language = chatSession.language || 'en';
    const session = Store.Session.get();
    const user = Store.Users.getById(session.id);
    PatientAIPage(user, document.getElementById('patient-page-content'));
  },

  clearChat() {
    _aiState.sessionId = null;
    _aiState.messages = [];
    const messagesEl = document.getElementById('ai-messages');
    if (messagesEl) {
      const session = Store.Session.get();
      const user = Store.Users.getById(session.id);
      messagesEl.innerHTML = renderWelcomeMsg(user);
    }
  },
};
