/**
 * WE CARE — Patient Prescriptions Page
 */

Router.register('patient-prescriptions', () => {
  const session = Auth.requireAuth('patient');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderPatientPortal('patient-prescriptions', user);
});

function PatientPrescriptionsPage(user, container) {
  const session = Store.Session.get();
  const prescriptions = Store.Prescriptions.getForPatient(session.id);
  const active = prescriptions.filter(p => p.status === 'active');
  const past = prescriptions.filter(p => p.status !== 'active');

  Store.Prescriptions.markSeen(session.id);

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">💊 My Prescriptions</h1>
          <p class="section-desc">Prescriptions from your doctor, synced in real-time</p>
        </div>
      </div>
    </div>

    <div class="tabs" style="max-width:400px;margin-bottom:24px">
      <button class="tab-btn active" id="tab-active" onclick="switchRxTab('active')">Active Prescriptions (${active.length})</button>
      <button class="tab-btn" id="tab-past" onclick="switchRxTab('past')">Past (${past.length})</button>
    </div>

    <div id="rx-active-section">
      ${active.length === 0 ? `
        <div class="empty-state">
          <div class="empty-icon">💊</div>
          <h3>No active prescriptions</h3>
          <p>Your doctor hasn't added any prescriptions yet. Check back after your consultation.</p>
        </div>
      ` : ''}

      ${active.map(rx => renderPrescriptionCard(rx)).join('')}
    </div>

    <div id="rx-past-section" style="display:none">
      ${past.length === 0 ? '<div class="empty-state"><div class="empty-icon">📋</div><h3>No past prescriptions</h3></div>' : ''}
      ${past.map(rx => renderPrescriptionCard(rx, true)).join('')}
    </div>
  `;
}

function switchRxTab(tab) {
  document.getElementById('tab-active')?.classList.toggle('active', tab === 'active');
  document.getElementById('tab-past')?.classList.toggle('active', tab === 'past');
  const activeSection = document.getElementById('rx-active-section');
  const pastSection = document.getElementById('rx-past-section');
  if (activeSection) activeSection.style.display = tab === 'active' ? 'block' : 'none';
  if (pastSection) pastSection.style.display = tab === 'past' ? 'block' : 'none';
}

function renderPrescriptionCard(rx, past = false) {
  return `
    <div class="rx-card ${rx.isNew ? 'rx-new-highlight' : ''}" style="margin-bottom:20px">
      <div class="rx-card-header">
        <div>
          <h4>💊 Prescription ${rx.isNew ? '🆕 NEW' : ''}</h4>
          <div style="font-size:12px;opacity:0.8">Prescribed by ${Utils.esc(rx.doctorName)} · ${Utils.formatDate(rx.createdAt)}</div>
        </div>
        <div style="text-align:right">
          <span class="badge ${rx.status === 'active' ? 'badge-success' : 'badge-neutral'}" style="font-size:12px">${rx.status}</span>
          <div style="font-size:11px;opacity:0.7;margin-top:4px">${Utils.formatDate(rx.startDate)} – ${Utils.formatDate(rx.endDate)}</div>
        </div>
      </div>
      <div class="rx-card-body">
        <!-- Today's schedule -->
        <div style="margin-bottom:16px">
          <div style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">TODAY'S SCHEDULE</div>
          <div class="med-timeline" style="padding-left:0">
            ${rx.medicines.map(m => `
              <div class="med-item" style="padding:10px 0">
                <div class="med-time" style="min-width:80px">${Utils.esc(m.time || '—')}</div>
                <div class="med-dot ${m.status === 'taken' ? 'taken' : m.status === 'pending' ? 'pending' : 'upcoming'}" style="width:36px;height:36px;font-size:14px">
                  ${m.status === 'taken' ? '✓' : m.status === 'pending' ? '●' : '○'}
                </div>
                <div class="med-info" style="padding-top:4px">
                  <div class="med-name">${Utils.esc(m.name)}</div>
                  <div class="med-detail">${Utils.esc(m.dosage)} · ${Utils.esc(m.frequency)} · ${Utils.esc(m.instructions)}</div>
                </div>
                ${!past ? `<button class="btn btn-sm ${m.status === 'taken' ? 'btn-secondary' : 'btn-primary'}" onclick="markMedTaken('${rx.id}','${m.name}',this)" style="flex-shrink:0">
                  ${m.status === 'taken' ? '✓ Taken' : 'Mark Taken'}
                </button>` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        ${rx.notes ? `
          <div style="background:var(--info-bg);border:1px solid #bfdbfe;border-radius:var(--radius);padding:12px 14px;margin-top:8px">
            <div style="font-size:12px;font-weight:700;color:var(--info);margin-bottom:4px">📝 Doctor's Notes</div>
            <div style="font-size:13px;color:var(--text-secondary)">${Utils.esc(rx.notes)}</div>
          </div>
        ` : ''}

        <div style="display:flex;gap:10px;margin-top:16px">
          <button class="btn btn-outline btn-sm" onclick="PatientPortal && Router.navigate('patient-ai')">🤖 Ask AI About This</button>
        </div>
      </div>
    </div>
  `;
}

function markMedTaken(rxId, medName, btn) {
  const session = Store.Session.get();
  const rxList = Store.Prescriptions.getForPatient(session.id);
  const rx = rxList.find(r => r.id === rxId);
  if (!rx) return;

  const updatedMeds = rx.medicines.map(m => m.name === medName ? {...m, status: 'taken'} : m);
  Store.Prescriptions.update(rxId, { medicines: updatedMeds });
  Store.AuditLog.add({ action: 'MEDICATION_MARKED_TAKEN', userId: session.id, rxId, medName });

  if (btn) {
    btn.textContent = '✓ Taken';
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
    btn.disabled = true;
  }
  NotifService.toast('success', 'Medication Marked', `${medName} marked as taken`);
}
