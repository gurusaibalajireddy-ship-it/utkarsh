/**
 * WE CARE — Doctor Notifications Page
 */

Router.register('doctor-notifications', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-notifications', user);
});

function DoctorNotificationsPage(user, container) {
  const session = Store.Session.get();
  const notifications = Store.Notifications.getForUser(session.id);
  Store.Notifications.markAllRead(session.id);
  NotifService.updateNotifBadge(session.id);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">🔔 Notifications</h1>
          <p class="section-desc">Updates from your patients and clinic</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="DoctorNotifCtrl.clearAll()">Clear All</button>
      </div>
    </div>

    <div style="max-width:700px">
      ${notifications.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <h3>No notifications</h3>
          <p>You're all caught up!</p>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;gap:10px">
          ${notifications.map(n => `
            <div class="card" style="display:flex;align-items:flex-start;gap:14px;padding:16px;cursor:pointer;border-left:4px solid ${n.type==='prescription'?'var(--success)':n.type==='message'?'var(--blue-500)':n.type==='appointment'?'var(--warning)':'var(--primary)'}" onclick="Router.navigate('${n.link || 'doctor-dashboard'}')">
              <span style="font-size:24px">${n.type==='prescription'?'💊':n.type==='message'?'💬':n.type==='appointment'?'📅':'🔔'}</span>
              <div style="flex:1">
                <div style="font-weight:700;font-size:15px">${Utils.esc(n.title)}</div>
                <div style="font-size:13px;color:var(--text-secondary);margin-top:4px">${Utils.esc(n.message)}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:6px">${Utils.formatDateTime(n.createdAt)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

const DoctorNotifCtrl = {
  clearAll() {
    const session = Store.Session.get();
    Store.Notifications.markAllRead(session.id);
    const user = Store.Users.getById(session.id);
    DoctorNotificationsPage(user, document.getElementById('doctor-page-content'));
    NotifService.toast('success', 'Cleared', 'All notifications marked as read');
  }
};
