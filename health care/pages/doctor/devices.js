/**
 * WE CARE — Doctor Devices Monitoring Page
 * Hackathon Simulation
 */

Router.register('doctor-devices', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-devices', user);
});

function DoctorDevicesPage(user, container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">📡 IoT Medical Devices</h1>
          <p class="section-desc">Link and monitor patient vitals via connected smart devices</p>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <button class="btn btn-primary" onclick="DoctorDevices.showLinkModal()">+ Link New Device</button>
        </div>
      </div>
    </div>

    <div class="demo-mode-indicator" style="margin-bottom:20px;display:flex;align-items:center;justify-content:space-between">
      <div>🎯 HACKATHON DEMO: Simulated IoT device metrics and AI analysis.</div>
      <button class="btn btn-secondary btn-sm" onclick="DoctorDevices.toggleAIMonitoring()" id="btn-device-ai">🤖 Start AI Monitoring</button>
    </div>

    <!-- AI Alerts Log -->
    <div id="ai-device-alerts" style="display:none;margin-bottom:20px;padding:16px;background:var(--bg-secondary);border-radius:var(--radius);border-left:4px solid var(--primary)">
      <h3 style="font-size:14px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px">
        <span class="pulse-dot" style="background:var(--primary)"></span> AI IoT Monitoring Active
      </h3>
      <div id="ai-device-list" style="display:flex;flex-direction:column;gap:8px;max-height:150px;overflow-y:auto;font-size:13px;font-family:monospace">
        <div style="color:var(--success)">[System] AI telemetry analysis initialized. Waiting for vital anomalies...</div>
      </div>
    </div>

    <div class="grid-2" id="devices-container">
      ${renderDeviceCard('Pulse Oximeter', 'DEV-PULSE-101', 'Patient: John Doe', '❤️ 78 bpm | 🩸 98% SpO2', 'online', 'pulse')}
      ${renderDeviceCard('Continuous Glucose Monitor', 'DEV-CGM-404', 'Patient: Jane Smith', '🩸 105 mg/dL', 'online', 'blood')}
      ${renderDeviceCard('Smart BP Monitor', 'DEV-BP-202', 'Patient: Alice Johnson', '❤️ 120/80 mmHg', 'offline', 'heart')}
    </div>
  `;
}

function renderDeviceCard(type, id, patient, metrics, status, iconType) {
  const icon = iconType === 'pulse' ? '🫀' : iconType === 'blood' ? '🩸' : '💓';
  const statusColor = status === 'online' ? '#0f0' : '#f00';
  const statusText = status.toUpperCase();

  return `
    <div class="card" style="padding:0;overflow:hidden;background:#0f172a;position:relative;border:1px solid #1e293b">
      <div style="padding:16px;border-bottom:1px solid #1e293b;display:flex;justify-content:space-between;align-items:flex-start">
        <div style="display:flex;gap:12px">
          <div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:20px">
            ${icon}
          </div>
          <div>
            <div style="font-weight:700;color:#fff;font-size:15px">${Utils.esc(type)}</div>
            <div style="font-size:12px;color:var(--text-muted);font-family:monospace">ID: ${Utils.esc(id)}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <div style="width:8px;height:8px;border-radius:50%;background:${statusColor}"></div>
          <span style="color:${statusColor};font-size:11px;font-weight:700">${statusText}</span>
        </div>
      </div>
      <div style="padding:16px">
        <div style="font-size:13px;color:var(--text-muted);margin-bottom:8px">Assigned to: <span style="color:#fff">${Utils.esc(patient)}</span></div>
        <div style="background:#000;padding:12px;border-radius:6px;font-family:monospace;color:#fff;font-size:14px;border:1px solid #333">
          ${status === 'online' ? metrics : 'NO SIGNAL DECODED'}
        </div>
      </div>
      <div style="background:#020617;padding:10px 16px;display:flex;justify-content:space-between;border-top:1px solid #1e293b">
        <button class="btn btn-ghost btn-sm" style="color:var(--primary)">View History</button>
        <button class="btn btn-outline btn-sm" style="border-color:#333;color:#fff;">Configure</button>
      </div>
    </div>
  `;
}

const DoctorDevices = {
  aiInterval: null,

  showLinkModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>🔗 Link New Medical Device</h3>
          <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Device MAC Address / Serial No.</label>
            <input type="text" id="dev-serial" class="form-control" placeholder="e.g., 00:1A:2B:3C:4D:5E" />
          </div>
          <div class="form-group">
            <label class="form-label">Device Type</label>
            <select id="dev-type" class="form-control">
              <option>Pulse Oximeter</option>
              <option>Continuous Glucose Monitor</option>
              <option>Smart BP Cuff</option>
              <option>ECG Patch</option>
              <option>Smart Inhaler</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Assign to Patient (Optional)</label>
            <input type="text" class="form-control" placeholder="Patient Name or ID" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="DoctorDevices.linkDevice()">Link Device</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  linkDevice() {
    const serial = document.getElementById('dev-serial').value;
    const type = document.getElementById('dev-type').value;
    
    if (!serial) {
      NotifService.toast('warning', 'Validation Error', 'Please enter a device serial number.');
      return;
    }

    const container = document.getElementById('devices-container');
    if (container) {
      const feedHtml = renderDeviceCard(type, serial, 'Unassigned', 'CALIBRATING...', 'online', 'heart');
      container.insertAdjacentHTML('afterbegin', feedHtml);
      document.querySelector('.modal-overlay').remove();
      NotifService.toast('success', 'Device Linked', 'New IoT device connected to telemetry.');
    }
  },

  toggleAIMonitoring() {
    const btn = document.getElementById('btn-device-ai');
    const panel = document.getElementById('ai-device-alerts');
    if (!btn || !panel) return;

    if (this.aiInterval) {
      clearInterval(this.aiInterval);
      this.aiInterval = null;
      btn.innerHTML = '🤖 Start AI Monitoring';
      btn.className = 'btn btn-secondary btn-sm';
      panel.style.display = 'none';
      NotifService.toast('info', 'AI Monitor Stopped', 'Telemetry AI analysis offline.');
    } else {
      btn.innerHTML = '🛑 Stop AI Monitoring';
      btn.className = 'btn btn-danger btn-sm';
      panel.style.display = 'block';
      
      const list = document.getElementById('ai-device-list');
      if (list) list.innerHTML = '<div style="color:var(--success)">[System] AI telemetry analysis initialized. Waiting for vital anomalies...</div>';

      const possibleAlerts = [
        "Patient John Doe: Heart rate irregularity detected (Tachycardia risk).",
        "Jane Smith: Glucose levels dropping rapidly. Hypoglycemia warning.",
        "Device DEV-BP-202: High latency detected. Please check network connection.",
        "Patient Alice Johnson: Blood pressure reading 140/90 (Elevated).",
        "Patient John Doe: SpO2 levels stabilized at 98%."
      ];

      this.aiInterval = setInterval(() => {
        const alertList = document.getElementById('ai-device-list');
        if (!alertList) { clearInterval(this.aiInterval); return; }

        const alertText = possibleAlerts[Math.floor(Math.random() * possibleAlerts.length)];
        const timeStr = new Date().toLocaleTimeString();
        
        const el = document.createElement('div');
        el.style.color = 'var(--warning)';
        el.textContent = `[${timeStr}] ⚠️ AI Alert: ${alertText}`;
        
        alertList.appendChild(el);
        alertList.scrollTop = alertList.scrollHeight;
        
        NotifService.toast('warning', 'IoT Vital Alert', alertText);
      }, 7000); 
    }
  }
};
