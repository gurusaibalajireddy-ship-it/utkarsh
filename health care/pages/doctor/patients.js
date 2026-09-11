/**
 * WE CARE — Doctor Patients List Page
 */

Router.register('doctor-patients', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-patients', user);
});

Router.register('doctor-patient-care', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-patients', user);
});

function DoctorPatientsPage(user, container) {
  const session = Store.Session.get();
  const patientIds = Store.DoctorPatients.getPatientsForDoctor(session.id);
  const patients = patientIds.map(pid => Store.Users.getById(pid)).filter(Boolean);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">👥 My Patients</h1>
          <p class="section-desc">${patients.length} patient${patients.length !== 1 ? 's' : ''} under your care</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary" onclick="DoctorPatientsCtrl.showAddPatientModal()">+ Add Patient</button>
          <div class="topbar-search" style="min-width:220px">
            <span>🔍</span>
            <input type="text" placeholder="Search patients..." id="patient-search" oninput="DoctorPatientsCtrl.search(this.value)" />
          </div>
        </div>
      </div>
    </div>

    <div id="patients-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
      ${patients.length === 0 ? '<div class="empty-state"><div class="empty-icon">👥</div><h3>No patients assigned</h3><p>Patients will appear here when assigned to your care.</p></div>' : ''}
      ${patients.map(p => renderPatientCard(p, session.id)).join('')}
    </div>
  `;

  // If we have a selected patient from navigation, open their care page
  if (window._selectedPatientId) {
    const pid = window._selectedPatientId;
    window._selectedPatientId = null;
    setTimeout(() => DoctorPatientsCtrl.openCare(pid), 100);
  }
}

function renderPatientCard(p, doctorId) {
  const prescriptions = Store.Prescriptions.getForPatient(p.id).filter(r => r.status === 'active');
  const newMsg = Store.Messages.getAll().some(m => m.fromId === p.id && m.toId === doctorId && !m.read);
  const lastAppt = Store.Appointments.getForPatient(p.id).sort((a,b) => new Date(b.date) - new Date(a.date))[0];

  return `
    <div class="card" style="cursor:pointer;transition:all 0.2s" onmouseover="this.style.borderColor='var(--primary)';this.style.boxShadow='var(--shadow-teal)'" onmouseout="this.style.borderColor='';this.style.boxShadow=''" onclick="DoctorPatientsCtrl.openCare('${p.id}')">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div class="patient-avatar">${Utils.getInitials(p.name)}</div>
        <div style="flex:1">
          <div style="font-weight:700;font-size:16px">${Utils.esc(p.name)}</div>
          <div style="font-size:12px;color:var(--text-muted)">${Utils.getAge(p.dob)} yrs · ${p.gender || '—'}</div>
        </div>
        ${newMsg ? '<span class="badge badge-info">New Msg</span>' : ''}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:var(--text-muted)">Active Prescriptions</span>
          <span style="font-weight:700">${prescriptions.length}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:var(--text-muted)">Last Appointment</span>
          <span style="font-weight:600">${lastAppt ? Utils.formatDate(lastAppt.date) : 'None'}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:13px">
          <span style="color:var(--text-muted)">Mobile</span>
          <span>${Utils.esc(p.mobile || '—')}</span>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:16px">
        <button class="btn btn-primary btn-sm" style="flex:1" onclick="event.stopPropagation();DoctorPatientsCtrl.openCare('${p.id}')">View Care Page</button>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();DoctorPatientsCtrl.quickMessage('${p.id}')">💬</button>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();DoctorRxWriter.open('${p.id}')">💊</button>
      </div>
    </div>
  `;
}

const DoctorPatientsCtrl = {
  openCare(patientId) {
    window._openCarePatientId = patientId;
    const content = document.getElementById('doctor-page-content');
    const title = document.getElementById('page-title');
    if (title) title.textContent = 'Patient Care';

    const session = Store.Session.get();
    const patient = Store.Users.getById(patientId);
    if (!patient) return;

    // Verify access
    if (!Store.DoctorPatients.isAssigned(session.id, patientId)) {
      NotifService.toast('error', 'Access Denied', 'You are not authorized to view this patient.');
      return;
    }

    Store.AuditLog.add({ action: 'PATIENT_RECORD_ACCESSED', userId: session.id, patientId });
    DoctorPatientCarePage(patient, Store.Users.getById(session.id), content);
  },

  search(query) {
    const session = Store.Session.get();
    const patientIds = Store.DoctorPatients.getPatientsForDoctor(session.id);
    const patients = patientIds.map(pid => Store.Users.getById(pid)).filter(Boolean);
    const filtered = query ? patients.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.email.toLowerCase().includes(query.toLowerCase())) : patients;
    const grid = document.getElementById('patients-grid');
    if (grid) grid.innerHTML = filtered.map(p => renderPatientCard(p, session.id)).join('') || '<div class="empty-state"><p>No patients found</p></div>';
  },

  quickMessage(patientId) {
    window._selectedPatientId = null;
    // Navigate to messages with this patient selected
    window._msgTarget = patientId;
    Router.navigate('doctor-messages');
  },

  showAddPatientModal() {
    const session = Store.Session.get();
    // Get all registered patients not already assigned to this doctor
    const allPatients = Store.Users.getPatients();
    const assignedIds = Store.DoctorPatients.getPatientsForDoctor(session.id);
    const available = allPatients.filter(p => !assignedIds.includes(p.id));

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>➕ Add Patient to Care</h3>
          <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</span>
        </div>
        <div class="modal-body">
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Select a registered patient to add them to your care list.</p>
          <div class="form-group">
            <label class="form-label">Available Patients</label>
            <select id="add-patient-select" class="form-control">
              <option value="">-- Select a patient --</option>
              ${available.map(p => `<option value="${p.id}">${Utils.esc(p.name)} (${Utils.esc(p.email)})</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="DoctorPatientsCtrl.addPatient()">Add Patient</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  addPatient() {
    const select = document.getElementById('add-patient-select');
    const patientId = select ? select.value : null;
    if (!patientId) {
      NotifService.toast('warning', 'Selection Required', 'Please select a patient to add.');
      return;
    }

    const session = Store.Session.get();
    Store.DoctorPatients.add(session.id, patientId);
    
    // Update the patient's assigned doctor
    Store.Users.update(patientId, { doctorAssigned: session.id });

    // Close modal
    document.querySelector('.modal-overlay')?.remove();
    NotifService.toast('success', 'Patient Added', 'Patient successfully added to your care list.');

    // Refresh page
    const user = Store.Users.getById(session.id);
    DoctorPatientsPage(user, document.getElementById('doctor-page-content'));
  }
};
