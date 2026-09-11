/**
 * WE CARE — Patient Health Timeline
 */

Router.register('patient-timeline', () => {
  const session = Auth.requireAuth('patient');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderPatientPortal('patient-timeline', user);
});

function PatientTimelinePage(user, container) {
  const session = Store.Session.get();
  const events = Store.Timeline.getForUser(session.id);

  container.innerHTML = `
    <div class="page-header">
      <h1 class="section-title">📋 Health Timeline</h1>
      <p class="section-desc">Your complete healthcare journey with WE CARE</p>
    </div>
    <div style="max-width:700px">
      ${events.length === 0 ? '<div class="empty-state"><div class="empty-icon">📋</div><h3>No events yet</h3><p>Your healthcare journey events will appear here</p></div>' : ''}
      <div class="health-timeline">
        ${events.map(e => `
          <div class="timeline-item">
            <div class="timeline-dot ${e.type}"></div>
            <div class="timeline-date">${Utils.formatDateTime(e.date)}</div>
            <div class="timeline-title">${e.icon || '📌'} ${Utils.esc(e.title)}</div>
            <div class="timeline-desc">${Utils.esc(e.description)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
