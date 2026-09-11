/**
 * WE CARE — AI Service
 * Groq API integration + Browser Web Speech API
 */

const AIService = (() => {
  // API key is read from meta tag or window config (never hardcoded)
  // Set via: <meta name="groq-api-key" content="YOUR_KEY"> or window.GROQ_API_KEY
  function getApiKey() {
    return window.GROQ_API_KEY || null;
  }

  const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL = 'llama3-70b-8192';

  const SYSTEM_PROMPT = `You are "We Care AI", a helpful healthcare assistant for the WE CARE healthcare platform.

Your role:
- Answer general health information questions in a friendly, clear way
- Explain prescription instructions in simple language
- Explain medical terminology
- Help patients understand their medication schedules
- Help navigate the WE CARE application
- Translate conversations when asked
- Provide emotional support and wellness tips

CRITICAL RESTRICTIONS - you MUST:
- Never diagnose medical conditions independently
- Never prescribe medications
- Never change or override existing prescriptions
- Never replace a doctor's clinical judgment
- Always recommend consulting their doctor or emergency services for urgent matters
- Always remind patients to follow their doctor's instructions
- End responses with a safety reminder when discussing medical topics

If someone asks about an emergency: immediately say "PLEASE CALL EMERGENCY SERVICES (112/911) IMMEDIATELY or go to the nearest hospital."

If asked about prescriptions, reference that the information comes from what the doctor has prescribed.

Respond concisely but thoroughly. Be warm, reassuring, and professional.
When asked to respond in a specific language (Telugu, Hindi, Tamil, Kannada, Malayalam), respond fully in that language.`;

  async function chat(messages, language = 'en') {
    const apiKey = getApiKey();

    if (!apiKey) {
      return getMockResponse(messages[messages.length - 1]?.content, language);
    }

    const langInstruction = language !== 'en' ?
      `\n\n[IMPORTANT: Respond in ${getLanguageName(language)}. Translate your entire response to ${getLanguageName(language)}.]` : '';

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT + langInstruction },
            ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : m.role, content: m.content || m.text })),
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'API error');
      }

      const data = await response.json();
      return { success: true, text: data.choices[0].message.content };
    } catch (err) {
      console.error('[WE CARE AI] Groq API error:', err);
      return { success: false, error: 'Unable to connect to AI service. Please try again.', text: getMockResponse(messages[messages.length - 1]?.content, language).text };
    }
  }

  function getLanguageName(code) {
    const langs = { te: 'Telugu', hi: 'Hindi', ta: 'Tamil', kn: 'Kannada', ml: 'Malayalam', en: 'English' };
    return langs[code] || 'English';
  }

  // Mock responses for when Groq API is not configured
  function getMockResponse(userMessage, language = 'en') {
    const msg = (userMessage || '').toLowerCase();
    let response = '';

    if (msg.includes('medicine') || msg.includes('medication') || msg.includes('prescription') || msg.includes('మందు') || msg.includes('दवा')) {
      if (language === 'te') {
        response = 'మీ డాక్టర్ సూచించిన మందులను సరైన సమయంలో తీసుకోవడం చాలా ముఖ్యం. మీ ప్రిస్క్రిప్షన్‌లో పేర్కొన్న సూచనలను అనుసరించండి.\n\n• ఉదయం 8:00 గంటలకు: ఆజిత్రోమైసిన్ 500mg\n• మధ్యాహ్నం 1:00 గంటలకు: సెటిరిజిన్ 10mg\n• రాత్రి 8:00 గంటలకు: పాంటోప్రజోల్ 40mg\n\n⚠️ ఎల్లప్పుడూ మీ డాక్టర్ సూచనలను అనుసరించండి.';
      } else if (language === 'hi') {
        response = 'आपकी दवाओं को सही समय पर लेना बहुत महत्वपूर्ण है। अपने डॉक्टर के निर्देशों का पालन करें।\n\n• सुबह 8:00 बजे: एज़िथ्रोमाइसिन 500mg\n• दोपहर 1:00 बजे: सेटिरिज़िन 10mg\n• रात 8:00 बजे: पैंटोप्राज़ोल 40mg\n\n⚠️ हमेशा अपने डॉक्टर की सलाह का पालन करें।';
      } else {
        response = 'Based on your current prescription from Dr. Arjun Mehta:\n\n💊 **Morning (8:00 AM):** Azithromycin 500mg — Take with food\n💊 **Afternoon (1:00 PM):** Cetirizine 10mg — Take after lunch\n💊 **Evening (8:00 PM):** Pantoprazole 40mg — Take 30 mins before dinner\n\nPlease ensure you complete the full course. If you miss a dose, take it as soon as you remember, unless it\'s almost time for your next dose.\n\n⚠️ *We Care AI provides general information. Always follow your doctor\'s specific instructions.*';
      }
    } else if (msg.includes('side effect') || msg.includes('effect') || msg.includes('reaction')) {
      response = 'Common side effects vary by medication. For Azithromycin, you may experience mild nausea or stomach upset. Cetirizine may cause slight drowsiness. Pantoprazole is generally well-tolerated.\n\nIf you experience severe reactions like difficulty breathing, severe rash, or chest pain, contact your doctor immediately or call emergency services.\n\n⚠️ *This is general information. Your doctor is the best person to advise you.*';
    } else if (msg.includes('emergency') || msg.includes('urgent') || msg.includes('chest pain') || msg.includes('breathe')) {
      response = '🚨 **EMERGENCY ALERT**\n\nIf you are experiencing a medical emergency, please:\n\n1. **Call 112** (Emergency Services) immediately\n2. **Go to the nearest hospital**\n3. **Contact your doctor** right away\n\nDo not wait. Please seek immediate medical attention.\n\n*We Care AI cannot handle medical emergencies. Please call emergency services now.*';
    } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('hey') || msg.includes('నమస్కారం') || msg.includes('నమస్కారం')) {
      if (language === 'te') {
        response = 'నమస్కారం! నేను వి కేర్ AI. మీకు ఈ రోజు ఏవిధంగా సహాయం చేయాలి?\n\nమీరు నన్ను ఇలా అడగవచ్చు:\n• మీ మందుల గురించి\n• మీ అపాయింట్‌మెంట్ గురించి\n• సాధారణ ఆరోగ్య సమాచారం\n• మందుల దుష్ప్రభావాలు\n\n⚠️ నేను మీ డాక్టర్‌కు ప్రత్యామ్నాయం కాదు.';
      } else {
        response = 'Hello! I\'m **We Care AI**, your personal health assistant. How can I help you today?\n\nI can assist you with:\n• 💊 Your medication schedule & instructions\n• 📅 Appointment information\n• ℹ️ General health information\n• 🌐 Translation in Telugu, Hindi, Tamil, Kannada, Malayalam\n• 📱 Navigating the WE CARE app\n\n⚠️ *I provide assistance and general information. Always follow your doctor\'s instructions.*';
      }
    } else if (msg.includes('translate') || msg.includes('telugu') || msg.includes('hindi') || msg.includes('అనువాదం')) {
      response = 'I can help you translate! WE CARE AI supports:\n\n🇮🇳 **Telugu** — తెలుగు\n🇮🇳 **Hindi** — हिंदी\n🇮🇳 **Tamil** — தமிழ்\n🇮🇳 **Kannada** — ಕನ್ನಡ\n🇮🇳 **Malayalam** — മലയാളം\n🇬🇧 **English**\n\nUse the language selector in the chat to switch languages, and I\'ll respond in your chosen language!';
    } else if (msg.includes('appointment') || msg.includes('visit') || msg.includes('follow')) {
      response = 'Your next appointment is scheduled with **Dr. Arjun Mehta** on **September 20, 2026 at 10:00 AM** for a follow-up consultation.\n\nYou can view all your appointments in the Appointments section of your dashboard.\n\nFor rescheduling or new appointments, please send a message to your doctor through the Messages section.\n\n⚠️ *Always confirm appointments directly with your healthcare provider.*';
    } else {
      response = 'Thank you for your question. I\'m here to help you with:\n\n• **Medication information** from your prescription\n• **Health terminology** explained simply\n• **App navigation** guidance\n• **Language translation** for medical information\n• **General wellness** information\n\nCould you tell me more about what you\'d like help with? I\'ll do my best to assist you.\n\n⚠️ *We Care AI provides assistance and general information. Always follow your doctor\'s instructions for medical decisions.*';
    }

    return { success: true, text: response, isMock: !getApiKey() };
  }

  // === VOICE / SPEECH ===
  let recognition = null;
  let synthesis = window.speechSynthesis;
  let _onResult = null;
  let _onEnd = null;
  let _onError = null;

  function initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return false;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-IN';
    return true;
  }

  function startListening(lang = 'en', onResult, onEnd, onError) {
    if (!recognition && !initSpeech()) {
      if (onError) onError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    _onResult = onResult;
    _onEnd = onEnd;
    _onError = onError;

    const langMap = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN' };
    recognition.lang = langMap[lang] || 'en-IN';

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map(r => r[0].transcript).join(' ');
      if (_onResult) _onResult(transcript);
    };
    recognition.onend = () => { if (_onEnd) _onEnd(); };
    recognition.onerror = (event) => { if (_onError) _onError(`Speech error: ${event.error}`); };

    try { recognition.start(); } catch(e) { if (_onError) _onError('Could not start speech recognition.'); }
  }

  function stopListening() {
    if (recognition) { try { recognition.stop(); } catch(e) {} }
  }

  function speak(text, lang = 'en') {
    if (!synthesis) return;
    synthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\n+/g, ' ').substring(0, 500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langMap = { en: 'en-IN', te: 'te-IN', hi: 'hi-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN' };
    utterance.lang = langMap[lang] || 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    synthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (synthesis) synthesis.cancel();
  }

  function isSpeaking() {
    return synthesis ? synthesis.speaking : false;
  }

  return {
    chat,
    getMockResponse,
    getLanguageName,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isSpeaking,
    getApiKey,
  };
})();
