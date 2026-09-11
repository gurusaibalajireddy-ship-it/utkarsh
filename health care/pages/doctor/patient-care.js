/**
 * WE CARE — Doctor Patient Care Page
 * Consolidated view of a patient's clinical data
 */

function DoctorPatientCarePage(patient, doctor, container) {
  const prescriptions = Store.Prescriptions.getForPatient(patient.id);
  const activeRx = prescriptions.filter(r => r.status === 'active');
  const pastRx = prescriptions.filter(r => r.status !== 'active');
  const aiChats = Store.AIChats.getAuthorizedForDoctor(patient.id);
  const notes = Store.DoctorNotes.getForPatient(doctor.id, patient.id);
  const appointments = Store.Appointments.getForPatient(patient.id);

  container.innerHTML = `
    <div class="page-header" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:14px;cursor:pointer" onclick="Router.navigate('doctor-patients')">
        <span style="font-size:20px;color:var(--text-muted)">←</span>
        <h1 class="section-title" style="margin-bottom:0">Patient Care Page</h1>
      </div>
    </div>

    <!-- Patient Header -->
    <div style="background:var(--bg-secondary);border:1px solid var(--border-light);border-radius:var(--radius-lg);padding:24px;display:flex;align-items:center;gap:20px;margin-bottom:24px;box-shadow:var(--shadow-sm)">
      <div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,var(--teal-600),var(--navy-700));display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:700;color:#fff">${Utils.getInitials(patient.name)}</div>
      <div style="flex:1">
        <div style="font-size:24px;font-weight:800;font-family:'Outfit',sans-serif">${Utils.esc(patient.name)}</div>
        <div style="font-size:14px;color:var(--text-muted);margin-top:4px">${Utils.getAge(patient.dob)} years · ${patient.gender || '—'} · ID: ${patient.id.substring(0,12)}</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <span class="badge badge-teal">Patient</span>
          <span class="badge ${activeRx.length>0?'badge-success':'badge-neutral'}">${activeRx.length} Active Prescriptions</span>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn btn-primary" onclick="DoctorRxWriter.open('${patient.id}')">✏️ Write Prescription</button>
        <button class="btn btn-secondary" onclick="DoctorPatientsCtrl.quickMessage('${patient.id}')">💬 Message Patient</button>
      </div>
    </div>

    <div class="grid-2" style="align-items:start">
      <!-- LEFT COLUMN -->
      <div style="display:flex;flex-direction:column;gap:24px">
        
        <!-- Patient Info -->
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">📋 Patient Information</div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><span class="text-muted text-sm font-semibold">MOBILE</span><span class="text-sm font-semibold">${Utils.esc(patient.mobile)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><span class="text-muted text-sm font-semibold">EMAIL</span><span class="text-sm font-semibold">${Utils.esc(patient.email)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><span class="text-muted text-sm font-semibold">ADDRESS</span><span class="text-sm font-semibold" style="text-align:right;max-width:200px">${Utils.esc(patient.address)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><span class="text-muted text-sm font-semibold text-danger">EMERGENCY</span><span class="text-sm font-semibold text-danger">${Utils.esc(patient.emergencyContact)}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light)"><span class="text-muted text-sm font-semibold">GUARDIAN NAME</span><span class="text-sm font-semibold">${Utils.esc(patient.guardianName || '—')}</span></div>
          <div style="display:flex;justify-content:space-between;padding:8px 0"><span class="text-muted text-sm font-semibold">GUARDIAN PHONE</span><span class="text-sm font-semibold">${Utils.esc(patient.guardianPhone || '—')}</span></div>
        </div>

        <!-- Prescriptions -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">💊 Active Prescriptions</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('doctor-prescriptions')">View All</button>
          </div>
          ${activeRx.length === 0 ? '<div class="empty-state" style="padding:20px"><p>No active prescriptions</p></div>' : ''}
          ${activeRx.map(rx => `
            <div style="border:1px solid var(--border-light);border-radius:var(--radius);padding:14px;margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;margin-bottom:10px">
                <span style="font-weight:700;font-size:14px">${Utils.formatDate(rx.startDate)}</span>
                <span class="badge badge-success">Active</span>
              </div>
              ${rx.medicines.map(m => `
                <div style="font-size:13px;padding:4px 0;border-bottom:1px dashed var(--border-light)">
                  <span style="font-weight:600">${Utils.esc(m.name)}</span> · ${Utils.esc(m.dosage)} · ${Utils.esc(m.frequency)}
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>

        <!-- Appointments -->
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">📅 Appointments</div>
          ${appointments.slice(0,3).map(a => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light)">
              <div>
                <div style="font-size:13px;font-weight:600">${Utils.esc(a.type)}</div>
                <div style="font-size:11px;color:var(--text-muted)">${Utils.formatDate(a.date)} · ${a.time}</div>
              </div>
              <span class="badge ${a.status==='confirmed'?'badge-success':a.status==='pending'?'badge-warning':'badge-neutral'}">${a.status}</span>
            </div>
          `).join('')}
        </div>

      </div>

      <!-- RIGHT COLUMN -->
      <div style="display:flex;flex-direction:column;gap:24px">
        
        <!-- AI Activity -->
        <div class="card" style="border:1px solid var(--teal-200)">
          <div class="card-header" style="margin-bottom:12px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:20px">🤖</span>
              <div class="card-title">Patient AI Activity</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--text-muted);margin-bottom:16px;background:var(--teal-50);padding:8px 12px;border-radius:var(--radius-sm)">
            Authorized view of patient's interactions with We Care AI. AI responses are generated automatically.
          </div>
          ${aiChats.length === 0 ? '<div class="empty-state" style="padding:20px"><p>No AI interactions recorded</p></div>' : ''}
          <div style="display:flex;flex-direction:column;gap:12px;max-height:400px;overflow-y:auto">
            ${aiChats.slice(0,5).map(chat => {
              const qs = chat.messages.filter(m => m.role === 'user');
              const q = qs.length > 0 ? qs[0] : null;
              return `
                <div style="border:1px solid var(--border-light);border-radius:var(--radius);padding:12px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                    <span style="font-size:12px;font-weight:700;color:var(--teal-700)">Topic: ${Utils.esc(chat.topic.substring(0,30))}</span>
                    <span style="font-size:11px;color:var(--text-muted)">${Utils.timeAgo(chat.updatedAt)}</span>
                  </div>
                  ${q ? `
                    <div style="background:var(--bg-primary);padding:8px;border-radius:var(--radius-sm);margin-bottom:6px">
                      <div style="font-size:10px;font-weight:700;color:var(--text-muted)">PATIENT ASKED:</div>
                      <div style="font-size:13px">${Utils.esc(q.text)}</div>
                    </div>
                  ` : ''}
                  <button class="btn btn-ghost btn-sm" style="font-size:11px;padding:4px 8px" onclick="DoctorPortal.viewAIChat('${chat.id}')">View full conversation →</button>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Doctor Notes -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📝 Private Clinical Notes</div>
          </div>
          <div style="margin-bottom:16px">
            <textarea id="doc-note-input" class="form-control" rows="3" placeholder="Add a private clinical note for this patient..."></textarea>
            <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="DoctorPatientCareCtrl.addNote('${patient.id}')">Add Note</button>
          </div>
          <div id="doc-notes-list" style="display:flex;flex-direction:column;gap:10px;max-height:300px;overflow-y:auto">
            ${notes.map(n => `
              <div style="background:var(--warning-bg);border-left:3px solid var(--warning);padding:12px;border-radius:0 var(--radius) var(--radius) 0">
                <div style="font-size:13px;white-space:pre-wrap">${Utils.esc(n.text)}</div>
                <div style="font-size:10px;color:var(--text-muted);margin-top:6px;text-align:right">${Utils.formatDateTime(n.createdAt)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
      </div>
    </div>
  `;
}

DoctorPortal.viewAIChat = function(chatId) {
  // Simple modal to view chat
  const chat = Store.AIChats.getSession(chatId);
  if (!chat) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <div>
          <h3>🤖 AI Conversation Transcript</h3>
          <p style="font-size:12px;color:var(--text-muted)">${Utils.formatDateTime(chat.createdAt)} · Language: ${AIService.getLanguageName(chat.language)}</p>
        </div>
        <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</span>
      </div>
      <div class="modal-body" style="background:var(--bg-primary);max-height:400px;overflow-y:auto;display:flex;flex-direction:column;gap:12px;padding:20px">
        <div style="background:var(--teal-50);padding:8px 12px;border-radius:var(--radius-sm);font-size:11px;color:var(--teal-700);text-align:center;margin-bottom:8px">
          This is an automatically generated conversation between the patient and We Care AI. It is not a medical diagnosis.
        </div>
        ${chat.messages.map(m => `
          <div style="display:flex;gap:10px;${m.role==='user'?'flex-direction:row-reverse':''}">
            <div style="width:28px;height:28px;border-radius:50%;background:${m.role==='user'?'var(--blue-500)':'var(--teal-600)'};color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">${m.role==='user'?'P':'AI'}</div>
            <div style="background:${m.role==='user'?'var(--blue-50)':'#fff'};padding:10px 14px;border-radius:var(--radius-md);font-size:13px;border:1px solid var(--border-light);max-width:80%">
              ${m.role==='ai'?'<div style="font-size:9px;font-weight:700;color:var(--teal-600);margin-bottom:4px">AI GENERATED</div>':''}
              <div style="white-space:pre-wrap">${Utils.esc(m.text || m.content)}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
};

const DoctorPatientCareCtrl = {
  addNote(patientId) {
    const input = document.getElementById('doc-note-input');
    if (!input || !input.value.trim()) return;
    const session = Store.Session.get();
    Store.DoctorNotes.add({ doctorId: session.id, patientId, text: input.value.trim() });
    Store.AuditLog.add({ action: 'DOCTOR_NOTE_ADDED', userId: session.id, patientId });
    input.value = '';
    // Re-render care page
    DoctorPatientsCtrl.openCare(patientId);
  }
};
