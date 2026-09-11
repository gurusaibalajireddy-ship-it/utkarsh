/**
 * WE CARE — Doctor Messaging Page
 */

Router.register('doctor-messages', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-messages', user);
});

let _docMsgState = { selectedPatientId: null };

function DoctorMessagesPage(user, container) {
  const session = Store.Session.get();
  
  // If we navigated here with a target patient
  if (window._msgTarget) {
    _docMsgState.selectedPatientId = window._msgTarget;
    window._msgTarget = null;
  }

  // Get inbox for doctor (patients messaging the doctor)
  const inbox = Store.Messages.getInbox(session.id);
  const patientIds = Store.DoctorPatients.getPatientsForDoctor(session.id);

  container.innerHTML = `
    <div class="page-header">
      <h1 class="section-title">💬 Messages</h1>
      <p class="section-desc">Communicate with your patients securely</p>
    </div>
    
    <div class="msg-layout">
      <!-- PATIENT LIST -->
      <div class="msg-list">
        <div class="msg-list-header">
          <div class="topbar-search" style="width:100%">
            <span>🔍</span>
            <input type="text" placeholder="Search patients..." id="doc-msg-search" oninput="DoctorMsgCtrl.search(this.value)" style="flex:1;border:none;background:none;font-size:13px" />
          </div>
        </div>
        <div class="msg-list-body" id="doc-msg-list">
          ${renderDocMsgList(session.id, inbox, patientIds)}
        </div>
      </div>

      <!-- MESSAGE WINDOW -->
      <div class="msg-window" id="doctor-msg-window">
        ${_docMsgState.selectedPatientId ? '' : renderDocEmptyMsgWindow()}
      </div>
    </div>
  `;

  if (_docMsgState.selectedPatientId) {
    DoctorMsgCtrl.openThread(_docMsgState.selectedPatientId);
  }
}

function renderDocMsgList(doctorId, inbox, allPatientIds) {
  // Combine inbox threads and patients with no threads yet
  let list = [];
  
  inbox.forEach(thread => {
    list.push({ ...thread, isThread: true });
  });

  allPatientIds.forEach(pid => {
    if (!list.some(t => t.otherId === pid)) {
      list.push({ otherId: pid, isThread: false });
    }
  });

  // Sort by latest message, then alphabet
  list.sort((a,b) => {
    if (a.isThread && !b.isThread) return -1;
    if (!a.isThread && b.isThread) return 1;
    if (a.isThread && b.isThread) return new Date(b.lastMsg.createdAt) - new Date(a.lastMsg.createdAt);
    return 0; // fallback
  });

  if (list.length === 0) return '<div class="empty-state" style="padding:40px 20px"><p>No patients assigned</p></div>';

  return list.map(item => {
    const p = Store.Users.getById(item.otherId);
    if (!p) return '';
    const isUnread = item.isThread && item.lastMsg.toId === doctorId && !item.lastMsg.read;
    const preview = item.isThread ? Utils.esc(item.lastMsg.text) : 'Start a conversation';
    const time = item.isThread ? Utils.timeAgo(item.lastMsg.createdAt) : '';

    return `
      <div class="msg-thread-item ${isUnread ? 'unread' : ''} ${_docMsgState.selectedPatientId === item.otherId ? 'active' : ''}" onclick="DoctorMsgCtrl.openThread('${item.otherId}')">
        <div class="msg-thread-avatar">${Utils.getInitials(p.name)}</div>
        <div style="flex:1;min-width:0">
          <div class="thread-name">${Utils.esc(p.name)}</div>
          <div class="thread-preview">${preview}</div>
        </div>
        <div class="thread-time">${time}</div>
        ${isUnread ? '<div class="msg-thread-unread-dot"></div>' : ''}
      </div>
    `;
  }).join('');
}

function renderDocEmptyMsgWindow() {
  return `
    <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--text-muted);background:var(--bg-primary)">
      <div style="font-size:64px">💬</div>
      <h3 style="font-size:18px;color:var(--text-secondary)">Select a patient</h3>
      <p style="font-size:14px">Choose a patient from the list to message them</p>
    </div>
  `;
}

const DoctorMsgCtrl = {
  openThread(patientId) {
    _docMsgState.selectedPatientId = patientId;
    const session = Store.Session.get();
    const patient = Store.Users.getById(patientId);
    if (!patient) return;

    const messages = Store.Messages.getThread(session.id, patientId);
    Store.Messages.markRead(patientId, session.id);

    const window = document.getElementById('doctor-msg-window');
    if (!window) return;

    window.innerHTML = `
      <div class="msg-window-header">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--teal-600),var(--navy-700));display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff">${Utils.getInitials(patient.name)}</div>
        <div>
          <div style="font-weight:700;font-size:15px">${Utils.esc(patient.name)}</div>
          <div style="font-size:12px;color:var(--text-muted)">Patient · ${Utils.getAge(patient.dob)} yrs</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="DoctorRxWriter.open('${patientId}')">💊 Write Rx</button>
          <button class="btn btn-outline btn-sm" onclick="DoctorPatientsCtrl.openCare('${patientId}')">View Care Page</button>
        </div>
      </div>
      <div class="msg-messages" id="doc-msg-thread-body">
        ${messages.length === 0 ? '<div style="text-align:center;color:var(--text-muted);margin-top:40px;font-size:14px">Start the conversation below 👇</div>' : ''}
        ${messages.map(m => `
          <div class="chat-msg ${m.fromId === session.id ? 'sent' : 'received'}">
            <div>
              <div class="chat-msg-text">${Utils.esc(m.text)}</div>
              <div class="chat-msg-time">${Utils.formatDateTime(m.createdAt)}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="msg-input-row">
        <input type="text" id="doc-msg-input" class="msg-input" placeholder="Type a message to ${Utils.esc(patient.name)}..." onkeydown="if(event.key==='Enter')DoctorMsgCtrl.sendMsg('${patientId}')" />
        <button class="btn btn-primary" onclick="DoctorMsgCtrl.sendMsg('${patientId}')">Send ➤</button>
      </div>
    `;

    // Scroll to bottom
    const body = document.getElementById('doc-msg-thread-body');
    if (body) setTimeout(() => { body.scrollTop = body.scrollHeight; }, 100);

    // Update thread list highlight
    document.querySelectorAll('.msg-thread-item').forEach(el => el.classList.remove('active'));
    
    // Refresh the list to remove unread dots
    const inbox = Store.Messages.getInbox(session.id);
    const patientIds = Store.DoctorPatients.getPatientsForDoctor(session.id);
    const list = document.getElementById('doc-msg-list');
    if (list) list.innerHTML = renderDocMsgList(session.id, inbox, patientIds);
  },

  sendMsg(toId) {
    const input = document.getElementById('doc-msg-input');
    if (!input || !input.value.trim()) return;
    const session = Store.Session.get();
    const from = Store.Users.getById(session.id);
    const to = Store.Users.getById(toId);
    if (!to) return;

    const msg = Store.Messages.send({
      fromId: session.id,
      toId,
      fromName: from.name,
      toName: to.name,
      text: input.value.trim(),
    });

    NotifService.notifyMessage(toId, from.name, msg.text);
    Store.AuditLog.add({ action: 'MESSAGE_SENT', userId: session.id, toId });
    input.value = '';

    const body = document.getElementById('doc-msg-thread-body');
    if (body) {
      const el = document.createElement('div');
      el.className = 'chat-msg sent';
      el.innerHTML = `<div><div class="chat-msg-text">${Utils.esc(msg.text)}</div><div class="chat-msg-time">${Utils.formatDateTime(msg.createdAt)}</div></div>`;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }

    // Refresh list
    const inbox = Store.Messages.getInbox(session.id);
    const patientIds = Store.DoctorPatients.getPatientsForDoctor(session.id);
    const list = document.getElementById('doc-msg-list');
    if (list) list.innerHTML = renderDocMsgList(session.id, inbox, patientIds);
  },
  
  search(query) {
    // Basic filtering implementation could go here, omitting for simplicity in MVP
  }
};
