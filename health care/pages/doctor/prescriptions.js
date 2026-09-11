/**
 * WE CARE — Doctor Prescriptions Page & Rx Writer
 */

Router.register('doctor-prescriptions', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-prescriptions', user);
});

function DoctorPrescriptionsPage(user, container) {
  const session = Store.Session.get();
  const rxList = Store.Prescriptions.getByDoctor(session.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">💊 Prescriptions</h1>
          <p class="section-desc">Manage prescriptions you have issued</p>
        </div>
        <button class="btn btn-primary" onclick="DoctorRxWriter.open()">✏️ Write New Prescription</button>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>Medicines</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rxList.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No prescriptions issued yet.</td></tr>' : ''}
            ${rxList.map(rx => {
              const patient = Store.Users.getById(rx.patientId);
              return `
                <tr>
                  <td>
                    <div style="font-weight:600">${Utils.formatDate(rx.createdAt)}</div>
                  </td>
                  <td>
                    <div style="font-weight:600">${Utils.esc(patient?.name || 'Unknown')}</div>
                    <div style="font-size:12px;color:var(--text-muted)">ID: ${rx.patientId.substring(0,8)}</div>
                  </td>
                  <td>
                    <div style="font-size:13px">${Utils.esc(rx.medicines.map(m=>m.name).join(', '))}</div>
                    <div style="font-size:11px;color:var(--text-muted)">${rx.medicines.length} medicine(s)</div>
                  </td>
                  <td><span class="badge ${rx.status==='active'?'badge-success':'badge-neutral'}">${rx.status}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="DoctorRxWriter.view('${rx.id}')">View</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Global prescription writer modal
const DoctorRxWriter = {
  open(prefilledPatientId = null) {
    const session = Store.Session.get();
    const patientIds = Store.DoctorPatients.getPatientsForDoctor(session.id);
    const patients = patientIds.map(pid => Store.Users.getById(pid)).filter(Boolean);

    if (patients.length === 0) {
      NotifService.toast('warning', 'No patients', 'You must have patients assigned to write prescriptions.');
      return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = 'rx-writer-modal';
    
    // Set up state for this instance
    window._rxMeds = [{ name: '', dosage: '', frequency: '', time: '', instructions: '' }];

    overlay.innerHTML = `
      <div class="modal" style="max-width:700px">
        <div class="modal-header" style="background:linear-gradient(135deg,var(--teal-600),var(--navy-700));color:#fff;padding-bottom:24px;border-radius:var(--radius-xl) var(--radius-xl) 0 0">
          <div>
            <h3 style="color:#fff">✏️ Write Prescription</h3>
            <p style="color:rgba(255,255,255,0.8);font-size:13px;margin-top:4px">Prescription will be synced to the patient's dashboard instantly.</p>
          </div>
          <span class="modal-close" style="color:#fff" onclick="this.closest('.modal-overlay').remove()">×</span>
        </div>
        <div class="modal-body" style="padding-top:24px">
          
          <div class="grid-2">
            <div class="form-group">
              <label class="form-label">Patient <span>*</span></label>
              <select id="rx-patient" class="form-control">
                <option value="">Select a patient...</option>
                ${patients.map(p => `<option value="${p.id}" ${prefilledPatientId===p.id?'selected':''}>${Utils.esc(p.name)} (${Utils.getAge(p.dob)}y)</option>`).join('')}
              </select>
            </div>
            <div class="grid-2">
              <div class="form-group">
                <label class="form-label">Start Date <span>*</span></label>
                <input type="date" id="rx-start" class="form-control" value="${new Date().toISOString().split('T')[0]}" />
              </div>
              <div class="form-group">
                <label class="form-label">End Date <span>*</span></label>
                <input type="date" id="rx-end" class="form-control" />
              </div>
            </div>
          </div>

          <div style="margin:20px 0;border-top:1px solid var(--border-light);padding-top:20px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
              <label class="form-label" style="margin:0">Medications <span>*</span></label>
            </div>
            
            <div id="rx-meds-container" style="display:flex;flex-direction:column;gap:12px">
              ${this.renderMedRows()}
            </div>
            
            <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="DoctorRxWriter.addMedRow()">+ Add Medication</button>
          </div>

          <div class="form-group" style="margin-top:24px">
            <label class="form-label">Doctor's Notes / Advice</label>
            <textarea id="rx-notes" class="form-control" rows="2" placeholder="e.g. Drink plenty of fluids, review after 5 days..."></textarea>
          </div>

        </div>
        <div class="modal-footer" style="background:var(--bg-primary);border-top:1px solid var(--border-light);padding-top:16px;border-radius:0 0 var(--radius-xl) var(--radius-xl)">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="DoctorRxWriter.saveAndSend()">Send to Patient 🚀</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  renderMedRows() {
    return window._rxMeds.map((med, index) => `
      <div style="background:var(--bg-primary);border:1px solid var(--border-light);padding:12px;border-radius:var(--radius);position:relative">
        <button class="btn btn-ghost" style="position:absolute;top:4px;right:4px;color:var(--danger);font-size:16px;padding:4px" onclick="DoctorRxWriter.removeMedRow(${index})">×</button>
        <div class="grid-4" style="gap:10px;margin-bottom:10px">
          <div style="grid-column:span 2">
            <input type="text" class="form-control rx-med-name" placeholder="Medicine Name (e.g. Paracetamol)" value="${Utils.esc(med.name)}" oninput="window._rxMeds[${index}].name=this.value" />
          </div>
          <div>
            <input type="text" class="form-control rx-med-dosage" placeholder="Dosage (e.g. 500mg)" value="${Utils.esc(med.dosage)}" oninput="window._rxMeds[${index}].dosage=this.value" />
          </div>
          <div>
            <input type="text" class="form-control rx-med-freq" placeholder="Freq (e.g. 1-0-1)" value="${Utils.esc(med.frequency)}" oninput="window._rxMeds[${index}].frequency=this.value" />
          </div>
        </div>
        <div class="grid-2" style="gap:10px">
          <div>
            <input type="time" class="form-control rx-med-time" value="${med.time}" oninput="window._rxMeds[${index}].time=this.value" />
          </div>
          <div>
            <input type="text" class="form-control rx-med-inst" placeholder="Instructions (e.g. After food)" value="${Utils.esc(med.instructions)}" oninput="window._rxMeds[${index}].instructions=this.value" />
          </div>
        </div>
      </div>
    `).join('');
  },

  addMedRow() {
    window._rxMeds.push({ name: '', dosage: '', frequency: '', time: '', instructions: '' });
    const c = document.getElementById('rx-meds-container');
    if (c) c.innerHTML = this.renderMedRows();
  },

  removeMedRow(index) {
    if (window._rxMeds.length <= 1) return;
    window._rxMeds.splice(index, 1);
    const c = document.getElementById('rx-meds-container');
    if (c) c.innerHTML = this.renderMedRows();
  },

  saveAndSend() {
    const patientId = document.getElementById('rx-patient')?.value;
    const startDate = document.getElementById('rx-start')?.value;
    const endDate = document.getElementById('rx-end')?.value;
    const notes = document.getElementById('rx-notes')?.value || '';

    if (!patientId) { NotifService.toast('error', 'Validation Error', 'Please select a patient.'); return; }
    if (!startDate || !endDate) { NotifService.toast('error', 'Validation Error', 'Start and End dates are required.'); return; }
    
    // Validate meds
    const meds = window._rxMeds.filter(m => m.name.trim() !== '');
    if (meds.length === 0) { NotifService.toast('error', 'Validation Error', 'Please add at least one medication.'); return; }

    const session = Store.Session.get();
    const doctor = Store.Users.getById(session.id);

    // Format time for UI display
    meds.forEach(m => {
      if (m.time) {
        const [h, min] = m.time.split(':');
        let hour = parseInt(h);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        hour = hour % 12 || 12;
        m.time = `${hour.toString().padStart(2,'0')}:${min} ${ampm}`;
      } else {
        m.time = 'Anytime';
      }
      m.status = 'pending';
    });

    const rx = Store.Prescriptions.add({
      patientId,
      doctorId: session.id,
      doctorName: doctor.name,
      medicines: meds,
      startDate,
      endDate,
      notes,
    });

    // CRITICAL: Notify the patient (real-time sync)
    NotifService.notifyPrescription(patientId, rx);
    Store.Timeline.add({ userId: patientId, type: 'prescription', title: 'New Prescription', description: `Dr. ${doctor.name} added a new prescription.`, icon: '💊' });
    Store.AuditLog.add({ action: 'PRESCRIPTION_ISSUED', userId: session.id, patientId, rxId: rx.id });

    document.getElementById('rx-writer-modal')?.remove();
    NotifService.toast('success', 'Prescription Sent!', `Prescription successfully sent to patient.`);

    // Refresh if on prescriptions page
    if (Router.getCurrentRoute() === 'doctor-prescriptions') {
      DoctorPrescriptionsPage(doctor, document.getElementById('doctor-page-content'));
    }
  },

  view(rxId) {
    const rx = Store.Prescriptions.getById(rxId);
    if (!rx) return;
    const patient = Store.Users.getById(rx.patientId);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>💊 View Prescription</h3>
          <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</span>
        </div>
        <div class="modal-body">
          <div style="background:var(--bg-primary);border-radius:var(--radius);padding:16px;margin-bottom:20px;border:1px solid var(--border-light)">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span class="text-muted text-sm font-semibold">PATIENT</span>
              <span class="font-bold">${Utils.esc(patient?.name)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span class="text-muted text-sm font-semibold">ISSUED</span>
              <span>${Utils.formatDate(rx.createdAt)}</span>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span class="text-muted text-sm font-semibold">DURATION</span>
              <span>${Utils.formatDate(rx.startDate)} — ${Utils.formatDate(rx.endDate)}</span>
            </div>
          </div>

          <h4 style="font-size:14px;margin-bottom:12px;color:var(--text-primary)">Medications</h4>
          <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:20px">
            ${rx.medicines.map(m => `
              <div style="border:1px solid var(--border-light);border-left:3px solid var(--primary);padding:10px 14px;border-radius:var(--radius-sm)">
                <div style="font-weight:700;font-size:14px">${Utils.esc(m.name)}</div>
                <div style="font-size:13px;color:var(--text-secondary)">${Utils.esc(m.dosage)} · ${Utils.esc(m.frequency)}</div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">⏰ ${Utils.esc(m.time)} — ℹ️ ${Utils.esc(m.instructions)}</div>
              </div>
            `).join('')}
          </div>

          ${rx.notes ? `
            <div style="background:var(--info-bg);padding:12px;border-radius:var(--radius-sm);border:1px solid #bfdbfe">
              <div style="font-size:12px;font-weight:700;color:var(--info);margin-bottom:4px">Doctor's Notes</div>
              <div style="font-size:13px">${Utils.esc(rx.notes)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
};
