/**
 * WE CARE — Doctor Appointments Page
 */

Router.register('doctor-appointments', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-appointments', user);
});

function DoctorAppointmentsPage(user, container) {
  const session = Store.Session.get();
  const appointments = Store.Appointments.getForDoctor(session.id);
  
  const pending = appointments.filter(a => a.status === 'pending').sort((a,b) => new Date(a.date) - new Date(b.date));
  const upcoming = appointments.filter(a => a.status === 'confirmed' && new Date(a.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date));
  const past = appointments.filter(a => new Date(a.date) < new Date() && a.status !== 'pending').sort((a,b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">📅 Appointments</h1>
          <p class="section-desc">Manage your clinic schedule</p>
        </div>
      </div>
    </div>

    ${pending.length > 0 ? `
      <div style="background:var(--warning-bg);border:1px solid var(--warning);border-radius:var(--radius-lg);padding:20px;margin-bottom:32px">
        <h3 style="font-size:16px;font-weight:700;color:var(--warning-dark);margin-bottom:16px;display:flex;align-items:center;gap:8px">
          <span style="font-size:20px">⚠️</span> Action Required: Pending Requests (${pending.length})
        </h3>
        <div style="display:flex;flex-direction:column;gap:12px">
          ${pending.map(a => renderDocApptCard(a, true)).join('')}
        </div>
      </div>
    ` : ''}

    <div class="grid-2">
      <div>
        <h3 style="font-size:16px;font-weight:700;margin-bottom:16px">Upcoming Appointments</h3>
        ${upcoming.length === 0 ? '<div class="empty-state" style="padding:30px"><p>No upcoming appointments</p></div>' : ''}
        <div style="display:flex;flex-direction:column;gap:12px">
          ${upcoming.map(a => renderDocApptCard(a, false)).join('')}
        </div>
      </div>
      <div>
        <h3 style="font-size:16px;font-weight:700;margin-bottom:16px;color:var(--text-secondary)">Past History</h3>
        ${past.length === 0 ? '<div class="empty-state" style="padding:30px"><p>No past appointments</p></div>' : ''}
        <div style="display:flex;flex-direction:column;gap:12px">
          ${past.map(a => renderDocApptCard(a, false, true)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderDocApptCard(a, isPending = false, isPast = false) {
  const d = new Date(a.date);
  return `
    <div class="appt-card" style="background:var(--bg-primary);border:1px solid var(--border-light)">
      <div class="appt-date-block" style="${isPending ? 'background:var(--warning);color:#fff' : isPast ? 'background:var(--bg-secondary);color:var(--text-muted)' : ''}">
        <div class="appt-day">${d.getDate()}</div>
        <div class="appt-month">${d.toLocaleString('default', { month: 'short' })}</div>
      </div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:15px;display:flex;align-items:center;gap:8px">
          ${Utils.esc(a.patientName)}
          <span class="badge ${a.status === 'confirmed' ? 'badge-success' : a.status === 'pending' ? 'badge-warning' : 'badge-neutral'}" style="font-size:10px">${a.status}</span>
        </div>
        <div style="font-size:13px;color:var(--text-muted)">${Utils.esc(a.type)}</div>
        <div style="font-size:13px;color:var(--text-muted)">🕐 ${Utils.esc(a.time)}</div>
        ${a.notes ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:6px;background:var(--bg-secondary);padding:6px;border-radius:4px">📝 ${Utils.esc(a.notes)}</div>` : ''}
      </div>
      ${isPending ? `
        <div style="display:flex;flex-direction:column;gap:8px">
          <button class="btn btn-primary btn-sm" onclick="DoctorApptCtrl.updateStatus('${a.id}','confirmed')">✓ Confirm</button>
          <button class="btn btn-outline btn-sm" onclick="DoctorApptCtrl.updateStatus('${a.id}','cancelled')">✕ Decline</button>
        </div>
      ` : `
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
          <button class="btn btn-ghost btn-sm" onclick="DoctorPatientsCtrl.openCare('${a.patientId}')">View Patient →</button>
        </div>
      `}
    </div>
  `;
}

const DoctorApptCtrl = {
  updateStatus(apptId, status) {
    const session = Store.Session.get();
    const appt = Store.Appointments.getAll().find(a => a.id === apptId);
    if (!appt) return;

    Store.Appointments.updateStatus(apptId, status);
    
    // Notify Patient
    if (status === 'confirmed') {
      NotifService.notifyAppointment(appt.patientId, `Your appointment on ${Utils.formatDate(appt.date)} at ${appt.time} has been confirmed by Dr. ${appt.doctorName}.`);
      Store.Timeline.add({ userId: appt.patientId, type: 'appointment', title: 'Appointment Confirmed', description: `Dr. ${appt.doctorName} confirmed your appointment for ${Utils.formatDate(appt.date)}.`, icon: '✅' });
    } else {
      NotifService.notifyAppointment(appt.patientId, `Your appointment request for ${Utils.formatDate(appt.date)} was declined. Please request a different time.`);
    }

    NotifService.toast('success', 'Appointment Updated', `Appointment marked as ${status}`);
    
    const user = Store.Users.getById(session.id);
    DoctorAppointmentsPage(user, document.getElementById('doctor-page-content'));
  }
};
