/**
 * WE CARE — Patient Appointments Page
 */

Router.register('patient-appointments', () => {
  const session = Auth.requireAuth('patient');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderPatientPortal('patient-appointments', user);
});

function PatientAppointmentsPage(user, container) {
  const session = Store.Session.get();
  const appointments = Store.Appointments.getForPatient(session.id);
  const upcoming = appointments.filter(a => new Date(a.date) >= new Date()).sort((a,b) => new Date(a.date) - new Date(b.date));
  const past = appointments.filter(a => new Date(a.date) < new Date()).sort((a,b) => new Date(b.date) - new Date(a.date));

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">📅 Appointments</h1>
          <p class="section-desc">Manage your healthcare appointments</p>
        </div>
        <button class="btn btn-primary" onclick="ApptPage.requestNew()">+ Request Appointment</button>
      </div>
    </div>

    ${upcoming.length > 0 ? `
      <h3 style="font-size:16px;font-weight:700;margin-bottom:16px;color:var(--text-primary)">Upcoming</h3>
      <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:32px">
        ${upcoming.map(a => renderApptCard(a)).join('')}
      </div>
    ` : ''}

    ${past.length > 0 ? `
      <h3 style="font-size:16px;font-weight:700;margin-bottom:16px;color:var(--text-secondary)">Past Appointments</h3>
      <div style="display:flex;flex-direction:column;gap:12px">
        ${past.map(a => renderApptCard(a, true)).join('')}
      </div>
    ` : ''}

    ${appointments.length === 0 ? `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>No appointments yet</h3>
        <p>Request an appointment with your doctor</p>
        <button class="btn btn-primary" style="margin-top:16px" onclick="ApptPage.requestNew()">+ Request Appointment</button>
      </div>
    ` : ''}
  `;
}

function renderApptCard(a, past = false) {
  const d = new Date(a.date);
  return `
    <div class="appt-card">
      <div class="appt-date-block">
        <div class="appt-day">${d.getDate()}</div>
        <div class="appt-month">${d.toLocaleString('default', { month: 'short' })}</div>
      </div>
      <div style="flex:1">
        <div style="font-weight:700;font-size:15px">${Utils.esc(a.type)}</div>
        <div style="font-size:13px;color:var(--text-muted)">👨‍⚕️ ${Utils.esc(a.doctorName)}</div>
        <div style="font-size:13px;color:var(--text-muted)">🕐 ${Utils.esc(a.time)}</div>
        ${a.notes ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px">📝 ${Utils.esc(a.notes)}</div>` : ''}
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
        <span class="badge ${a.status === 'confirmed' ? 'badge-success' : a.status === 'pending' ? 'badge-warning' : 'badge-neutral'}">${a.status}</span>
        ${!past ? '<button class="btn btn-outline btn-sm" onclick="Router.navigate(\'patient-messages\')">💬 Message Doctor</button>' : ''}
      </div>
    </div>
  `;
}

const ApptPage = {
  requestNew() {
    const session = Store.Session.get();
    const doctorIds = Store.DoctorPatients.getDoctorsForPatient(session.id);
    if (doctorIds.length === 0) {
      NotifService.toast('warning', 'No doctor assigned', 'Please contact the clinic to get a doctor assigned');
      return;
    }
    const doctor = Store.Users.getById(doctorIds[0]);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>📅 Request Appointment</h3>
          <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</span>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Doctor</label>
            <input class="form-control" value="${Utils.esc(doctor?.name || '')}" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">Appointment Type <span>*</span></label>
            <select id="appt-type" class="form-control">
              <option>Follow-up Consultation</option>
              <option>New Symptom Evaluation</option>
              <option>Prescription Review</option>
              <option>General Check-up</option>
            </select>
          </div>
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Preferred Date <span>*</span></label>
              <input type="date" id="appt-date" class="form-control" min="${new Date().toISOString().split('T')[0]}" />
            </div>
            <div class="form-group">
              <label class="form-label">Preferred Time</label>
              <select id="appt-time" class="form-control">
                <option>09:00 AM</option><option>10:00 AM</option><option>11:00 AM</option>
                <option>12:00 PM</option><option>02:00 PM</option><option>03:00 PM</option>
                <option>04:00 PM</option><option>05:00 PM</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Notes</label>
            <textarea id="appt-notes" class="form-control" rows="2" placeholder="Any specific concerns or notes..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="ApptPage.submitRequest('${doctorIds[0]}')">📅 Request Appointment</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  submitRequest(doctorId) {
    const session = Store.Session.get();
    const user = Store.Users.getById(session.id);
    const date = document.getElementById('appt-date')?.value;
    if (!date) { NotifService.toast('warning', 'Date required', 'Please select a preferred date'); return; }

    const doctor = Store.Users.getById(doctorId);
    const appt = Store.Appointments.add({
      patientId: session.id,
      doctorId,
      doctorName: doctor?.name || 'Doctor',
      patientName: user.name,
      date,
      time: document.getElementById('appt-time')?.value || '10:00 AM',
      type: document.getElementById('appt-type')?.value || 'Follow-up',
      status: 'pending',
      notes: document.getElementById('appt-notes')?.value || '',
    });

    NotifService.notifyAppointment(doctorId, `${user.name} requested an appointment on ${Utils.formatDate(date)}`);
    Store.Timeline.add({ userId: session.id, type: 'appointment', title: 'Appointment Requested', description: `Requested appointment with ${doctor?.name}`, icon: '📅' });
    Store.AuditLog.add({ action: 'APPOINTMENT_REQUESTED', userId: session.id, doctorId });

    document.querySelector('.modal-overlay')?.remove();
    NotifService.toast('success', 'Appointment Requested', 'Your doctor will confirm soon');

    // Refresh
    const user2 = Store.Users.getById(session.id);
    PatientAppointmentsPage(user2, document.getElementById('patient-page-content'));
  },
};
