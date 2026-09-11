/**
 * WE CARE — Patient Notifications Page
 */

Router.register('patient-notifications', () => {
  const session = Auth.requireAuth('patient');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderPatientPortal('patient-notifications', user);
});

function PatientNotificationsPage(user, container) {
  const session = Store.Session.get();
  const notifications = Store.Notifications.getForUser(session.id);
  Store.Notifications.markAllRead(session.id);
  NotifService.updateNotifBadge(session.id);

  const groups = { prescription: [], message: [], appointment: [], ai: [], system: [] };
  notifications.forEach(n => {
    if (groups[n.type]) groups[n.type].push(n);
    else groups.system.push(n);
  });

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">🔔 Notifications</h1>
          <p class="section-desc">Stay updated on your health and care</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="PatientNotifPage.clearAll()">Clear All</button>
      </div>
    </div>

    ${notifications.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">🔔</div>
        <h3>No notifications</h3>
        <p>You're all caught up! Notifications will appear here.</p>
      </div>
    ` : `
      <div class="tabs" style="max-width:600px;margin-bottom:24px">
        <button class="tab-btn active" onclick="switchNotifTab('all', this)">All (${notifications.length})</button>
        <button class="tab-btn" onclick="switchNotifTab('prescription', this)">💊 Prescriptions</button>
        <button class="tab-btn" onclick="switchNotifTab('message', this)">💬 Messages</button>
        <button class="tab-btn" onclick="switchNotifTab('appointment', this)">📅 Appointments</button>
      </div>

      <div id="notif-all-list">
        ${renderNotifList(notifications)}
      </div>
    `}
  `;
}

function renderNotifList(notifs) {
  if (notifs.length === 0) return '<div class="empty-state" style="padding:40px"><p>No notifications in this category</p></div>';
  return `<div style="display:flex;flex-direction:column;gap:10px">
    ${notifs.map(n => `
      <div class="card" style="display:flex;align-items:flex-start;gap:14px;padding:16px;cursor:pointer;border-left:4px solid ${n.type==='prescription'?'var(--success)':n.type==='message'?'var(--blue-500)':n.type==='appointment'?'var(--warning)':'var(--primary)'}" onclick="Router.navigate('${n.link || 'patient-dashboard'}')">
        <span style="font-size:24px">${n.type==='prescription'?'💊':n.type==='message'?'💬':n.type==='appointment'?'📅':'🔔'}</span>
        <div style="flex:1">
          <div style="font-weight:700;font-size:15px">${Utils.esc(n.title)}</div>
          <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">${Utils.esc(n.message)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:6px">${Utils.formatDateTime(n.createdAt)}</div>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function switchNotifTab(type, btn) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const session = Store.Session.get();
  const all = Store.Notifications.getForUser(session.id);
  const filtered = type === 'all' ? all : all.filter(n => n.type === type);
  const list = document.getElementById('notif-all-list');
  if (list) list.innerHTML = renderNotifList(filtered);
}

const PatientNotifPage = {
  clearAll() {
    const session = Store.Session.get();
    // We don't actually delete, just mark all read and show empty
    Store.Notifications.markAllRead(session.id);
    const user = Store.Users.getById(session.id);
    PatientNotificationsPage(user, document.getElementById('patient-page-content'));
    NotifService.toast('success', 'Cleared', 'All notifications marked as read');
  },
};
