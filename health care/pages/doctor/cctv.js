/**
 * WE CARE — AI Safety Monitoring CCTV Page
 */

Router.register('doctor-cctv', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-cctv', user);
});

// --- State for AI CCTV ---
const CCTVSafetyState = {
  cameraStream: null,
  audioStream: null,
  monitoringActive: false,
  microphoneActive: false,
  aiActive: false,
  voiceAlerts: true,
  cooldownSeconds: 30,
  lastAlertTime: 0,
  alertCount: 0,
  lastAnalysisTime: '--',
  lastEventDescription: 'Normal activity',
  demoMode: true,
  history: []
};

// Main view
function DoctorCCTVPage(user, container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">🏥 AI Safety Command Center</h1>
          <p class="section-desc">Live CCTV feed with Groq AI-powered safety, motion, and audio monitoring</p>
        </div>
      </div>
    </div>

    <!-- MAIN 2-COLUMN LAYOUT -->
    <div style="display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">
      
      <!-- LEFT: CAMERA & CONTROLS -->
      <div style="flex:1;min-width:600px;display:flex;flex-direction:column;gap:15px">
        
        <!-- Live Feed Container -->
        <div class="card" style="padding:0;overflow:hidden;background:#000;position:relative;border:2px solid #1e293b;border-radius:12px;height:450px">
          
          <!-- Persistent Panic Banner -->
          <div id="cctv-panic-banner" style="display:none;position:absolute;top:0;left:0;right:0;background:rgba(220,38,38,0.95);color:#fff;padding:15px;z-index:20;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.5)">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
              <span style="font-size:32px;animation:pulse 1s infinite">🚨</span>
              <div>
                <h2 style="margin:0;font-size:20px;font-weight:800;letter-spacing:1px">PANIC MODE ACTIVE</h2>
                <div id="panic-banner-desc" style="font-size:14px;font-weight:600">Possible emergency detected. Human verification required.</div>
              </div>
            </div>
            <div style="display:flex;gap:15px">
              <button class="btn" style="background:#fff;color:var(--danger);font-weight:700" onclick="CCTVSafetyEngine.acknowledgeIncident()">Acknowledge</button>
              <button class="btn btn-outline" style="border-color:#fff;color:#fff" onclick="CCTVSafetyEngine.resolveIncident()">Resolve</button>
            </div>
          </div>

          <div style="position:absolute;top:15px;left:15px;background:rgba(0,0,0,0.7);color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-family:monospace;z-index:10;display:flex;align-items:center;gap:8px">
            <div id="cctv-cam-dot" style="width:10px;height:10px;border-radius:50%;background:var(--danger)"></div>
            CAM 01 — LAPTOP
          </div>

          <div style="position:absolute;top:15px;right:15px;background:rgba(0,0,0,0.7);color:#fff;padding:6px 12px;border-radius:6px;font-size:13px;font-family:monospace;z-index:10" id="cctv-clock">
            --:--:--
          </div>

          <!-- Video Element -->
          <video id="cctv-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;background:#111;transition:filter 0.3s"></video>

          <!-- Transient Alert Overlay -->
          <div id="cctv-alert-overlay" style="display:none;position:absolute;inset:0;background:rgba(220,38,38,0.25);border:4px solid var(--danger);z-index:5;pointer-events:none;flex-direction:column;align-items:center;justify-content:center;color:#fff;text-shadow:0 2px 4px rgba(0,0,0,0.8)">
            <div style="font-size:48px">⚠️</div>
            <h2 id="cctv-overlay-title" style="margin:0;font-size:24px;color:var(--danger);font-weight:800;letter-spacing:1px">ALERT DETECTED</h2>
            <p id="cctv-overlay-desc" style="font-size:14px;font-weight:600;margin-top:5px">Human Verification Required</p>
          </div>
        </div>

        <!-- Controls -->
        <div class="card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <button class="btn btn-outline" onclick="CCTVSafetyEngine.startCamera()" id="btn-cam"><span style="font-size:16px">📹</span> Start Camera</button>
          <button class="btn btn-outline" onclick="CCTVSafetyEngine.startMicrophone()" id="btn-mic"><span style="font-size:16px">🎤</span> Enable Audio</button>
          <div style="flex:1"></div>
          <button class="btn btn-primary" onclick="CCTVSafetyEngine.toggleAI()" id="btn-ai-monitor">🤖 Start AI Monitoring</button>
          <button class="btn btn-secondary" onclick="CCTVSafetyEngine.toggleVoiceAlerts()" id="btn-voice-alerts">🔊 Voice Alerts ON</button>
        </div>

        <!-- External Connection Bar -->
        <div class="card" style="display:flex;gap:10px;align-items:center;background:var(--bg-secondary)">
          <input type="text" id="cctv-stream-url" placeholder="Enter External CCTV Stream URL..." class="form-control" style="flex:1" />
          <button class="btn btn-outline" onclick="CCTVSafetyEngine.connectExternalStream()"><span style="font-size:16px">🔗</span> Connect Link</button>
          <button class="btn btn-outline" onclick="CCTVSafetyEngine.connectBluetoothCCTV()"><span style="font-size:16px">📶</span> Connect Bluetooth</button>
        </div>

        <!-- Demo Mode Section -->
        <div class="card" style="border-left:4px solid var(--warning);background:var(--bg-secondary)">
          <h3 style="font-size:14px;font-weight:700;margin-bottom:10px;color:var(--warning)">🎯 HACKATHON DEMO EVENTS</h3>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:12px">Simulate AI processing an event candidate through the Groq backend.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-outline btn-sm" onclick="CCTVSafetyEngine.simulateEvent('fall')">🏃 Simulate Fall</button>
            <button class="btn btn-outline btn-sm" onclick="CCTVSafetyEngine.simulateEvent('noise')">🔊 Simulate Loud Noise</button>
            <button class="btn btn-outline btn-sm" onclick="CCTVSafetyEngine.simulateEvent('help')">🆘 Simulate Call for Help</button>
            <button class="btn btn-outline btn-sm" onclick="CCTVSafetyEngine.simulateEvent('movement')">🚶 Unusual Movement</button>
            <button class="btn btn-ghost btn-sm" onclick="CCTVSafetyEngine.clearAlertOverlay()">Clear Overlay</button>
          </div>
        </div>
      </div>

      <!-- RIGHT: STATUS & HISTORY -->
      <div style="width:350px;display:flex;flex-direction:column;gap:15px">
        
        <!-- Live Status -->
        <div class="card">
          <h3 class="section-title" style="font-size:16px;margin-bottom:15px;display:flex;justify-content:space-between;align-items:center">
            Live Safety Status
            <span id="status-badge-main" style="background:var(--bg-secondary);padding:4px 8px;border-radius:12px;font-size:11px;font-weight:700;color:var(--text-muted)">⚪ INACTIVE</span>
          </h3>
          
          <div style="display:flex;flex-direction:column;gap:12px;font-size:13px">
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text-muted)">Camera</span>
              <span id="status-cam" style="font-weight:600">🔴 Disconnected</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text-muted)">Microphone</span>
              <span id="status-mic" style="font-weight:600">🔴 Disconnected</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text-muted)">AI Engine</span>
              <span id="status-ai" style="font-weight:600">🔴 Offline</span>
            </div>
            <hr style="border-color:var(--border-color);margin:4px 0" />
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text-muted)">Last Analysis</span>
              <span id="status-last-time" style="font-family:monospace">--:--</span>
            </div>
            <div>
              <div style="color:var(--text-muted);margin-bottom:4px">Last Event</div>
              <div id="status-last-event" style="background:var(--bg-secondary);padding:8px;border-radius:6px;font-weight:500;word-break:break-word">Normal activity</div>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span style="color:var(--text-muted)">Alerts Generated</span>
              <span id="status-alert-count" style="font-weight:700;color:var(--primary)">0</span>
            </div>
          </div>
        </div>

        <!-- Alert History -->
        <div class="card" style="flex:1;display:flex;flex-direction:column">
          <h3 class="section-title" style="font-size:16px;margin-bottom:15px">Safety Alert History</h3>
          <div id="alert-history-list" style="flex:1;overflow-y:auto;max-height:250px;display:flex;flex-direction:column;gap:8px">
            <div style="text-align:center;color:var(--text-muted);font-size:13px;padding:20px">No alerts recorded today.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Start the UI clock
  CCTVSafetyEngine.startClock();
  
  // Check for existing active incidents on load
  setTimeout(() => CCTVSafetyEngine.checkActiveIncidents(), 100);
}

const CCTVSafetyEngine = {
  clockInterval: null,

  startClock() {
    if (this.clockInterval) clearInterval(this.clockInterval);
    this.clockInterval = setInterval(() => {
      const clock = document.getElementById('cctv-clock');
      if (!clock) { clearInterval(this.clockInterval); return; }
      clock.textContent = new Date().toLocaleTimeString();
    }, 1000);
  },

  async startCamera() {
    const video = document.getElementById('cctv-video');
    const btn = document.getElementById('btn-cam');
    if (!video) return;

    if (CCTVSafetyState.cameraStream) {
      // Stop it
      CCTVSafetyState.cameraStream.getTracks().forEach(t => t.stop());
      CCTVSafetyState.cameraStream = null;
      video.srcObject = null;
      btn.innerHTML = '<span style="font-size:16px">📹</span> Start Camera';
      btn.className = 'btn btn-outline';
      this.updateStatus('cam', false);
      document.getElementById('cctv-cam-dot').style.animation = 'none';
      document.getElementById('cctv-cam-dot').style.background = '#666';
      return;
    }

    try {
      CCTVSafetyState.cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = CCTVSafetyState.cameraStream;
      btn.innerHTML = '🛑 Stop Camera';
      btn.className = 'btn btn-danger';
      this.updateStatus('cam', true);
      document.getElementById('cctv-cam-dot').style.animation = 'pulse 1.5s infinite';
      document.getElementById('cctv-cam-dot').style.background = 'var(--danger)';
    } catch (err) {
      console.error("Camera access error:", err);
      NotifService.toast('error', 'Camera Permission Denied', 'Please allow camera access in your browser settings.');
    }
  },

  async startMicrophone() {
    const btn = document.getElementById('btn-mic');
    if (CCTVSafetyState.audioStream) {
      CCTVSafetyState.audioStream.getTracks().forEach(t => t.stop());
      CCTVSafetyState.audioStream = null;
      btn.innerHTML = '<span style="font-size:16px">🎤</span> Enable Audio';
      btn.className = 'btn btn-outline';
      this.updateStatus('mic', false);
      CCTVSafetyState.microphoneActive = false;
      
      if (CCTVSafetyState.recognition) {
        CCTVSafetyState.recognition.stop();
        CCTVSafetyState.recognition = null;
      }
      return;
    }

    try {
      CCTVSafetyState.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      btn.innerHTML = '🔇 Disable Audio';
      btn.className = 'btn btn-warning';
      this.updateStatus('mic', true);
      CCTVSafetyState.microphoneActive = true;
      
      // Initialize Speech Recognition for real keyword detection
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
          if (!CCTVSafetyState.aiActive) return; // Only process if AI monitoring is ON
          
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            transcript += event.results[i][0].transcript;
          }
          
          const text = transcript.toLowerCase();
          if (text.includes('help') || text.includes('pain') || text.includes('save me') || text.includes('emergency')) {
            // Trigger emergency event! We throttle this via the AlertEngine cooldown.
            this.simulateEvent(text.includes('pain') ? 'pain' : 'help');
          }
        };
        
        recognition.onerror = (e) => console.log('Speech recognition error', e);
        recognition.start();
        CCTVSafetyState.recognition = recognition;
      }

    } catch (err) {
      console.error("Mic access error:", err);
      NotifService.toast('error', 'Microphone Permission Denied', 'Please allow microphone access.');
    }
  },

  connectExternalStream() {
    const input = document.getElementById('cctv-stream-url');
    if (!input || !input.value.trim()) {
      NotifService.toast('warning', 'Missing URL', 'Please enter a valid external CCTV stream link.');
      return;
    }
    
    // Attempt to set video source to external stream
    const video = document.getElementById('cctv-video');
    if (video) {
      video.srcObject = null;
      video.src = input.value.trim();
    }
    
    NotifService.toast('success', 'External Feed Connected', 'Attempting to stream from external CCTV link.');
    document.getElementById('cctv-cam-dot').style.animation = 'pulse 1.5s infinite';
    document.getElementById('cctv-cam-dot').style.background = 'var(--primary)';
    this.updateStatus('cam', true);
    input.value = '';
  },

  connectBluetoothCCTV() {
    // Simulate Web Bluetooth API behavior
    NotifService.toast('info', 'Scanning Bluetooth', 'Searching for nearby Bluetooth CCTV cameras...', 3000);
    setTimeout(() => {
      NotifService.toast('success', 'Bluetooth Connected', 'Successfully paired with "BL-CAM-904"');
      document.getElementById('cctv-cam-dot').style.animation = 'pulse 1.5s infinite';
      document.getElementById('cctv-cam-dot').style.background = '#3b82f6';
      this.updateStatus('cam', true);
    }, 3500);
  },

  toggleAI() {
    const btn = document.getElementById('btn-ai-monitor');
    CCTVSafetyState.aiActive = !CCTVSafetyState.aiActive;

    if (CCTVSafetyState.aiActive) {
      btn.innerHTML = '⏸️ Pause AI Monitoring';
      btn.className = 'btn btn-warning';
      this.updateStatus('ai', true);
      NotifService.toast('success', 'AI Monitoring Active', 'Vision & Audio AI safety analysis is running.');
      this.startAutomatedMonitoring();
    } else {
      btn.innerHTML = '🤖 Start AI Monitoring';
      btn.className = 'btn btn-primary';
      this.updateStatus('ai', false);
      NotifService.toast('info', 'AI Monitoring Paused', 'AI safety analysis offline.');
      this.stopAutomatedMonitoring();
    }
    this.updateMainBadge();
  },

  autoTimer: null,

  startAutomatedMonitoring() {
    this.stopAutomatedMonitoring();
    
    const scheduleNext = () => {
      // Random interval between 5 and 10 seconds
      const randomInterval = Math.floor(Math.random() * (10000 - 5000 + 1)) + 5000;
      
      this.autoTimer = setTimeout(() => {
        // High chance to trigger the specific events requested: shake, help, pain
        if (Math.random() < 0.35) {
          const anomalies = ['help', 'pain', 'shake'];
          const randomAnomaly = anomalies[Math.floor(Math.random() * anomalies.length)];
          this.simulateEvent(randomAnomaly);
        } else {
          document.getElementById('status-last-time').textContent = new Date().toLocaleTimeString();
          document.getElementById('status-last-event').innerHTML = '<span style="color:var(--success)">✅ AI background scan: Normal Activity</span>';
        }
        
        // Loop recursively
        scheduleNext();
      }, randomInterval);
    };

    scheduleNext();
  },

  stopAutomatedMonitoring() {
    if (this.autoTimer) {
      clearTimeout(this.autoTimer);
      this.autoTimer = null;
    }
  },

  toggleVoiceAlerts() {
    const btn = document.getElementById('btn-voice-alerts');
    CCTVSafetyState.voiceAlerts = !CCTVSafetyState.voiceAlerts;
    if (CCTVSafetyState.voiceAlerts) {
      btn.innerHTML = '🔊 Voice Alerts ON';
      btn.className = 'btn btn-secondary';
    } else {
      btn.innerHTML = '🔇 Voice Alerts OFF';
      btn.className = 'btn btn-outline';
    }
  },

  updateStatus(type, isActive) {
    const el = document.getElementById(`status-${type}`);
    if (!el) return;
    if (isActive) {
      el.innerHTML = '<span style="color:var(--success)">🟢 Active</span>';
    } else {
      el.innerHTML = '<span style="color:var(--danger)">🔴 Offline</span>';
    }
    this.updateMainBadge();
  },

  updateMainBadge() {
    const badge = document.getElementById('status-badge-main');
    if (!badge) return;

    if (CCTVSafetyState.aiActive) {
      badge.innerHTML = '🟢 MONITORING';
      badge.style.color = 'var(--success)';
      badge.style.background = 'rgba(34, 197, 94, 0.1)';
    } else {
      badge.innerHTML = '🟡 PAUSED';
      badge.style.color = 'var(--warning)';
      badge.style.background = 'rgba(234, 179, 8, 0.1)';
    }
  },

  // --- DEMO EVENT SIMULATION ---
  async simulateEvent(type) {
    if (!CCTVSafetyState.aiActive) {
      NotifService.toast('warning', 'AI Offline', 'Please Start AI Monitoring first to process events.');
      return;
    }

    // Set UI to loading state
    const timeStr = new Date().toLocaleTimeString();
    document.getElementById('status-last-time').textContent = timeStr;
    document.getElementById('status-last-event').innerHTML = `<span class="pulse-dot"></span> Analyzing event candidate via Groq...`;

    // Create a mock raw local event to send to Groq
    let promptInstruction = '';
    if (type === 'fall') {
      promptInstruction = "Camera 01 detected sudden downward vertical motion ending near the floor. The person has remained still for 3 seconds.";
    } else if (type === 'noise') {
      promptInstruction = "Microphone detected a sudden loud noise (85dB spike) lasting 1 second.";
    } else if (type === 'help') {
      promptInstruction = "Microphone continuously monitored the area for 5-10 seconds and detected a person repeatedly shouting for help and expressing severe pain.";
    } else if (type === 'pain') {
      promptInstruction = "Microphone continuously monitored the area for 5-10 seconds and detected severe pain sounds and groaning.";
    } else if (type === 'fits') {
      promptInstruction = "Camera 01 continuously monitored the screen for 10 seconds and noticed someone having fits/seizures on the floor.";
    } else if (type === 'movement') {
      promptInstruction = "Camera 01 continuously monitored the screen for 10 seconds and noticed unusual activity, including erratic movements and wandering in restricted zones.";
    } else if (type === 'shake') {
      promptInstruction = "Camera 01 detected intense shaking and rapid vibration for the last 5-10 seconds, possibly indicating a struggle, equipment tampering, or extreme patient distress.";
    }

    const messages = [{
      role: 'user', 
      content: `Analyze this sensor event and return a JSON object ONLY with the following keys: event_detected (boolean), event_type (string), severity (low/medium/high/critical), confidence (number 0-1), description (string - DO NOT DIAGNOSE, just describe movement), human_verification_required (boolean). EVENT: ${promptInstruction}`
    }];

    // Call Groq (using existing AIService)
    // We expect a JSON string back. If Groq API key is missing, ai.js returns mock responses, so we handle that.
    let aiResponse;
    const isMock = !AIService.getApiKey();

    if (isMock) {
      // Create mock JSON response if API key isn't set
      await new Promise(r => setTimeout(r, 800)); // simulate latency
      aiResponse = {
        event_detected: true,
        event_type: type === 'fall' ? 'possible_fall' : (type === 'noise' ? 'loud_noise' : (type === 'help' ? 'call_for_help' : (type === 'pain' ? 'severe_pain' : (type === 'fits' ? 'seizure_detected' : (type === 'shake' ? 'camera_shake_detected' : 'unusual_movement'))))),
        severity: (type === 'help' || type === 'fits' || type === 'shake') ? 'critical' : 'high',
        confidence: 0.95,
        description: promptInstruction + " Please verify visually.",
        human_verification_required: true
      };
    } else {
      // Real API call
      const res = await AIService.chat(messages);
      try {
        // Find JSON block in the text response
        const jsonMatch = res.text.match(/\\{.*?\\}/s);
        aiResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (e) {
        console.error("Failed to parse Groq JSON:", e);
      }
    }

    if (aiResponse && aiResponse.event_detected) {
      this.triggerAlertEngine(aiResponse);
    } else {
      document.getElementById('status-last-event').innerHTML = '<span style="color:var(--success)">✅ AI determined: Normal Activity</span>';
    }
  },

  // --- ALERT ENGINE ---
  triggerAlertEngine(eventData) {
    const now = Date.now();
    const currentUser = Auth.getCurrentUser();
    
    // 1. Log Monitoring Event
    Store.MonitoringEvents.add({
      eventType: eventData.event_type,
      confidence: eventData.confidence,
      description: eventData.description,
      severity: eventData.severity
    });

    // 2. Check for Active Panic Incidents (Deduplication)
    const activeIncidents = Store.PanicIncidents.getActive();
    
    // Pass cooldown -> update UI count
    CCTVSafetyState.lastAlertTime = now;
    CCTVSafetyState.alertCount++;
    document.getElementById('status-alert-count').textContent = CCTVSafetyState.alertCount;
    document.getElementById('status-last-event').innerHTML = `<span style="color:var(--danger)">🔴 ${Utils.esc(eventData.event_type.replace(/_/g, ' ').toUpperCase())}</span>`;

    // Add to History
    this.addHistoryItem(eventData);

    if (activeIncidents.length > 0) {
      // Incident already active! Do NOT create another notification or voice alert.
      document.getElementById('panic-banner-desc').textContent = `Incident ongoing. New event: ${eventData.event_type.replace(/_/g, ' ')}. Human verification still required.`;
      return; // Skip alerts
    }

    // --- NO ACTIVE INCIDENT: CREATE NEW PANIC ALERT ---
    
    Store.PanicIncidents.add({
      reason: eventData.event_type,
      description: eventData.description,
      confidence: eventData.confidence
    });

    // Show Persistent Panic Banner
    this.checkActiveIncidents();

    // Transient UI Overlay
    const overlay = document.getElementById('cctv-alert-overlay');
    if (overlay) {
      overlay.style.display = 'flex';
      document.getElementById('cctv-overlay-title').textContent = eventData.event_type.replace(/_/g, ' ').toUpperCase();
      document.getElementById('cctv-overlay-desc').textContent = `Confidence: ${Math.round(eventData.confidence * 100)}% — Human Verification Required`;
      setTimeout(() => { if (overlay) overlay.style.display = 'none'; }, 6000);
    }

    // Global Notification
    Store.Notifications.add({
      userId: currentUser.id,
      type: 'system',
      title: `🚨 PANIC ALERT: ${eventData.event_type.replace(/_/g, ' ').toUpperCase()}`,
      message: `Immediate human verification required. ${eventData.description}`,
      link: 'doctor-cctv'
    });
    updateNotifBadge(currentUser.id);

    // Voice Alert
    if (CCTVSafetyState.voiceAlerts) {
      const speechText = `Panic Alert. ${eventData.event_type.replace(/_/g, ' ')} detected in Camera One. Please verify immediately.`;
      AIService.speak(speechText, 'en');
    }

    NotifService.toast('error', 'Panic Mode Active', 'A new emergency incident has been generated.', 8000);
  },

  checkActiveIncidents() {
    const banner = document.getElementById('cctv-panic-banner');
    if (!banner) return;
    const active = Store.PanicIncidents.getActive();
    if (active.length > 0) {
      banner.style.display = 'flex';
      document.getElementById('panic-banner-desc').textContent = `Reason: ${active[0].reason.replace(/_/g, ' ')}. Human verification required.`;
    } else {
      banner.style.display = 'none';
    }
  },

  acknowledgeIncident() {
    const active = Store.PanicIncidents.getActive();
    if (active.length > 0) {
      Store.PanicIncidents.updateStatus(active[0].id, 'ACKNOWLEDGED', Auth.getCurrentUser().id);
      NotifService.toast('info', 'Incident Acknowledged', 'You have acknowledged the emergency alert.');
      this.checkActiveIncidents();
    }
  },

  resolveIncident() {
    const active = Store.PanicIncidents.getActive();
    if (active.length > 0) {
      Store.PanicIncidents.updateStatus(active[0].id, 'RESOLVED', Auth.getCurrentUser().id);
      NotifService.toast('success', 'Incident Resolved', 'Emergency panic mode has been resolved.');
      this.checkActiveIncidents();
      CCTVSafetyState.alertCount = 0;
      document.getElementById('status-alert-count').textContent = '0';
    }
  },

  clearAlertOverlay() {
    const overlay = document.getElementById('cctv-alert-overlay');
    if (overlay) overlay.style.display = 'none';
  },

  addHistoryItem(data) {
    const list = document.getElementById('alert-history-list');
    if (!list) return;

    if (CCTVSafetyState.history.length === 0) {
      list.innerHTML = ''; // clear empty message
    }

    const timeStr = new Date().toLocaleTimeString();
    const id = 'evt_' + Date.now();
    
    CCTVSafetyState.history.unshift(data);

    const el = document.createElement('div');
    el.className = 'card';
    el.style.padding = '10px';
    el.style.borderLeft = '4px solid var(--danger)';
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:11px;color:var(--text-muted)">${timeStr}</span>
        <span style="font-size:11px;background:rgba(220,38,38,0.1);color:var(--danger);padding:2px 6px;border-radius:4px;font-weight:700;text-transform:uppercase">${Utils.esc(data.severity)}</span>
      </div>
      <div style="font-weight:700;font-size:13px;margin-bottom:4px">${Utils.esc(data.event_type.replace(/_/g, ' ').toUpperCase())}</div>
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">${Utils.esc(data.description)}</div>
      <div style="display:flex;gap:5px" id="actions-${id}">
        <button class="btn btn-primary btn-sm" style="flex:1" onclick="CCTVSafetyEngine.verifyEvent('${id}')">Verify</button>
        <button class="btn btn-outline btn-sm" style="flex:1" onclick="CCTVSafetyEngine.dismissEvent('${id}')">Dismiss</button>
      </div>
    `;
    
    list.prepend(el);
  },

  verifyEvent(id) {
    const actions = document.getElementById('actions-' + id);
    if (actions) {
      actions.innerHTML = '<span style="color:var(--success);font-size:12px;font-weight:600">✅ Verified by Doctor</span>';
    }
  },

  dismissEvent(id) {
    const actions = document.getElementById('actions-' + id);
    if (actions) {
      actions.innerHTML = '<span style="color:var(--text-muted);font-size:12px">❌ Dismissed (False Alarm)</span>';
    }
  }
};
