/**
 * WE CARE — Notification Service
 * Toast notifications + Real-time notification panel
 */

const NotifService = (() => {
  let _container = null;
  let _listeners = [];
  let _pollingInterval = null;

  function init() {
    _container = document.createElement('div');
    _container.className = 'toast-container';
    _container.id = 'toast-container';
    document.body.appendChild(_container);
  }

  function toast(type, title, message, duration = 5000) {
    if (!_container) init();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️', prescription: '💊', message: '💬', appointment: '📅', ai: '🤖' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <span class="toast-close" onclick="this.parentElement.remove()">×</span>
    `;
    _container.appendChild(t);
    if (duration > 0) setTimeout(() => { if (t.parentNode) t.remove(); }, duration);
    return t;
  }

  function prescriptionAlert(prescriptionData, onView, onDismiss) {
    const overlay = document.createElement('div');
    overlay.className = 'alert-overlay';
    overlay.id = 'prescription-alert-overlay';
    overlay.innerHTML = `
      <div class="alert-modal">
        <div class="alert-icon">🔔</div>
        <h3>New Prescription Added</h3>
        <p>Dr. ${prescriptionData.doctorName} has added a new prescription for you.</p>
        <p style="font-size:13px;color:var(--text-muted);margin-top:-12px">${prescriptionData.medicines?.map(m=>m.name).join(', ')}</p>
        <div class="alert-actions">
          <button class="btn btn-primary" id="alert-view-btn">💊 View Prescription</button>
          <button class="btn btn-secondary" id="alert-dismiss-btn">Dismiss</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('alert-view-btn').onclick = () => {
      overlay.remove();
      if (onView) onView();
    };
    document.getElementById('alert-dismiss-btn').onclick = () => {
      overlay.remove();
      if (onDismiss) onDismiss();
    };
  }

  function notifyPrescription(patientId, prescription) {
    Store.Notifications.add({
      userId: patientId,
      type: 'prescription',
      title: '💊 New Prescription',
      message: `Dr. ${prescription.doctorName} added a new prescription: ${prescription.medicines?.map(m=>m.name).join(', ')}`,
      link: 'prescriptions',
      prescriptionId: prescription.id,
    });
  }

  function notifyMessage(toId, fromName, preview) {
    Store.Notifications.add({
      userId: toId,
      type: 'message',
      title: `💬 Message from ${fromName}`,
      message: preview.substring(0, 80),
      link: 'messages',
    });
  }

  function notifyAppointment(userId, details) {
    Store.Notifications.add({
      userId,
      type: 'appointment',
      title: '📅 Appointment Reminder',
      message: details,
      link: 'appointments',
    });
  }

  // Polling for new prescriptions (for demo real-time simulation)
  function startPolling(patientId) {
    if (_pollingInterval) clearInterval(_pollingInterval);
    let lastCount = Store.Prescriptions.getForPatient(patientId).length;

    _pollingInterval = setInterval(() => {
      const current = Store.Prescriptions.getForPatient(patientId);
      if (current.length > lastCount) {
        const newRx = current.filter(rx => rx.isNew);
        if (newRx.length > 0) {
          newRx.forEach(rx => {
            prescriptionAlert(rx,
              () => { Router.navigate('patient-prescriptions'); },
              () => { Store.Prescriptions.markSeen(patientId); }
            );
          });
          toast('prescription', 'New Prescription', `Dr. ${newRx[0].doctorName} added a prescription`);
          updateNotifBadge(patientId);
        }
        lastCount = current.length;
      }

      // Check for medication timing reminders
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      // Initialize reminded meds tracker if not exists
      if (!window._remindedMeds) window._remindedMeds = {};

      current.filter(rx => rx.status === 'active').forEach(rx => {
        rx.medicines.forEach(m => {
          if (m.status === 'pending' && m.time) {
            // Parse time string like "08:00 AM" or "14:30"
            let timeMatch = m.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (timeMatch) {
              let h = parseInt(timeMatch[1], 10);
              const min = parseInt(timeMatch[2], 10);
              const meridian = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
              
              if (meridian === 'PM' && h < 12) h += 12;
              if (meridian === 'AM' && h === 12) h = 0;
              
              const medMinutes = h * 60 + min;
              
              // If current time is within 2 minutes of the medication time
              if (Math.abs(currentMinutes - medMinutes) <= 2) {
                const medKey = rx.id + '_' + m.name + '_' + now.toDateString();
                if (!window._remindedMeds[medKey]) {
                  window._remindedMeds[medKey] = true;
                  toast('ai', '🤖 AI Medication Reminder', `It is time to take ${m.name} (${m.dosage}).`, 10000);
                  
                  // Also log an official notification
                  Store.Notifications.add({
                    userId: patientId,
                    type: 'prescription',
                    title: '🤖 AI Reminder: Time for Medication',
                    message: `Please take your ${m.name} (${m.dosage}) now as prescribed by Dr. ${rx.doctorName}.`,
                    link: 'patient-prescriptions'
                  });
                  updateNotifBadge(patientId);
                }
              }
            }
          }
        });
      });

      // Also update badge
      updateNotifBadge(patientId);
    }, 3000);
  }

  function stopPolling() {
    if (_pollingInterval) { clearInterval(_pollingInterval); _pollingInterval = null; }
  }

  function updateNotifBadge(userId) {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const count = Store.Notifications.getUnreadCount(userId);
    if (count > 0) { badge.textContent = count; badge.style.display = 'flex'; }
    else { badge.style.display = 'none'; }
  }

  return { init, toast, prescriptionAlert, notifyPrescription, notifyMessage, notifyAppointment, startPolling, stopPolling, updateNotifBadge };
})();
