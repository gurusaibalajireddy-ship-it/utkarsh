/**
 * WE CARE — Patient Messaging Page
 */

Router.register('patient-messages', () => {
  const session = Auth.requireAuth('patient');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderPatientPortal('patient-messages', user);
});

let _msgState = { selectedThreadId: null };

function PatientMessagesPage(user, container) {
  const session = Store.Session.get();
  const inbox = Store.Messages.getInbox(session.id);

  container.innerHTML = `
    <div class="page-header">
      <h1 class="section-title">💬 Messages</h1>
      <p class="section-desc">Secure communication with your care team</p>
    </div>
    <div class="msg-layout">
      <!-- THREAD LIST -->
      <div class="msg-list">
        <div class="msg-list-header">
          <div class="topbar-search" style="width:100%">
            <span>🔍</span>
            <input type="text" placeholder="Search messages..." style="flex:1;border:none;background:none;font-size:13px" />
          </div>
        </div>
        <div class="msg-list-body">
          ${inbox.length === 0 ? '<div class="empty-state" style="padding:40px 20px"><div class="empty-icon">💬</div><h3>No messages</h3><p>Your doctor will reach out here</p></div>' : ''}
          ${inbox.map(({ otherId, lastMsg }) => {
            const other = Store.Users.getById(otherId);
            if (!other) return '';
            const isUnread = lastMsg.toId === session.id && !lastMsg.read;
            return `
              <div class="msg-thread-item ${isUnread ? 'unread' : ''} ${_msgState.selectedThreadId === otherId ? 'active' : ''}" onclick="PatientMsgPage.openThread('${otherId}')">
                <div class="msg-thread-avatar">${Utils.getInitials(other.name)}</div>
                <div style="flex:1;min-width:0">
                  <div class="thread-name">${Utils.esc(other.name)}</div>
                  <div class="thread-preview">${Utils.esc(lastMsg.text)}</div>
                </div>
                <div class="thread-time">${Utils.timeAgo(lastMsg.createdAt)}</div>
                ${isUnread ? '<div class="msg-thread-unread-dot"></div>' : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- MESSAGE WINDOW -->
      <div class="msg-window" id="patient-msg-window">
        ${_msgState.selectedThreadId ? '' : renderEmptyMsgWindow()}
      </div>
    </div>
  `;

  if (_msgState.selectedThreadId) PatientMsgPage.openThread(_msgState.selectedThreadId);
}

function renderEmptyMsgWindow() {
  return `
    <div style="flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--text-muted);background:var(--bg-primary)">
      <div style="font-size:64px">💬</div>
      <h3 style="font-size:18px;color:var(--text-secondary)">Select a conversation</h3>
      <p style="font-size:14px">Choose a conversation from the list to view messages</p>
    </div>
  `;
}

const PatientMsgPage = {
  openThread(otherId) {
    _msgState.selectedThreadId = otherId;
    const session = Store.Session.get();
    const other = Store.Users.getById(otherId);
    if (!other) return;

    const messages = Store.Messages.getThread(session.id, otherId);
    Store.Messages.markRead(otherId, session.id);

    const window = document.getElementById('patient-msg-window');
    if (!window) return;

    window.innerHTML = `
      <div class="msg-window-header">
        <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--teal-600),var(--navy-700));display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#fff">${Utils.getInitials(other.name)}</div>
        <div>
          <div style="font-weight:700;font-size:15px">${Utils.esc(other.name)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${other.role === 'doctor' ? Utils.esc(other.specialization || 'Doctor') : 'Patient'} · ${Utils.esc(other.hospital || '')}</div>
        </div>
      </div>
      <div class="msg-messages" id="msg-thread-body">
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
        <input type="text" id="patient-msg-input" class="msg-input" placeholder="Type a message to ${Utils.esc(other.name)}..." onkeydown="if(event.key==='Enter')PatientMsgPage.sendMsg('${otherId}')" />
        <button class="btn btn-primary" onclick="PatientMsgPage.sendMsg('${otherId}')">Send ➤</button>
      </div>
    `;

    // Scroll to bottom
    const body = document.getElementById('msg-thread-body');
    if (body) setTimeout(() => { body.scrollTop = body.scrollHeight; }, 100);

    // Update thread list highlight
    document.querySelectorAll('.msg-thread-item').forEach(el => el.classList.remove('active'));
  },

  sendMsg(toId) {
    const input = document.getElementById('patient-msg-input');
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

    const body = document.getElementById('msg-thread-body');
    if (body) {
      const el = document.createElement('div');
      el.className = 'chat-msg sent';
      el.innerHTML = `<div><div class="chat-msg-text">${Utils.esc(msg.text)}</div><div class="chat-msg-time">${Utils.formatDateTime(msg.createdAt)}</div></div>`;
      body.appendChild(el);
      body.scrollTop = body.scrollHeight;
    }
  },
};
