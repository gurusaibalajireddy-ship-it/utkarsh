/**
 * WE CARE — Doctor Profile Page
 */

Router.register('doctor-profile', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-profile', user);
});

function DoctorProfilePage(user, container) {
  const patients = Store.DoctorPatients.getPatientsForDoctor(user.id);
  const rxCount = Store.Prescriptions.getByDoctor(user.id).length;
  const feedbackList = Store.Feedback.getByDoctor(user.id);
  const avgRating = feedbackList.length > 0 ? (feedbackList.reduce((acc, f) => acc + f.rating, 0) / feedbackList.length).toFixed(1) : 'No Ratings';

  container.innerHTML = `
    <div class="profile-header" style="background:linear-gradient(135deg, var(--teal-800), var(--navy-900));">
      <div class="profile-avatar-lg" style="background:#fff;color:var(--teal-800)">${Utils.getInitials(user.name)}</div>
      <div style="flex:1">
        <div style="font-size:28px;font-weight:800;font-family:'Outfit',sans-serif">${Utils.esc(user.name)}</div>
        <div style="font-size:14px;opacity:0.9;margin-top:4px">${Utils.esc(user.specialization || 'Doctor')} · ${Utils.esc(user.hospital || 'Hospital')}</div>
        <div style="display:flex;gap:10px;margin-top:12px">
          <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff">Verified Doctor ✓</span>
          <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff">${patients.length} Patients</span>
          <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff">${rxCount} Prescriptions</span>
        </div>
      </div>
      <button class="btn" style="background:rgba(255,255,255,0.15);color:#fff" onclick="NotifService.toast('info','Coming Soon','Profile editing will be available soon.')">✏️ Edit Profile</button>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:18px">👨‍⚕️ Professional Information</div>
        ${docProfileField('Full Name', user.name)}
        ${docProfileField('Email', user.email)}
        ${docProfileField('Mobile', user.mobile)}
        ${docProfileField('Specialization', user.specialization)}
        ${docProfileField('Hospital / Clinic', user.hospital)}
        ${docProfileField('License ID', user.licenseId, true)}
      </div>
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="card">
          <div class="card-title" style="margin-bottom:18px">🔒 Security & Account</div>
          ${docProfileField('Doctor ID', user.id)}
          ${docProfileField('Account Status', 'Active — Verified', false, true)}
          ${docProfileField('Joined Date', Utils.formatDate(user.createdAt))}
          <div style="margin-top:16px">
            <button class="btn btn-outline btn-sm" onclick="NotifService.toast('info','Coming Soon','Password change coming soon.')">🔒 Change Password</button>
          </div>
        </div>
        
        <div class="card">
          <div class="card-title" style="margin-bottom:8px">⚠️ Actions</div>
          <button class="btn btn-secondary btn-sm" onclick="DoctorPortal.logout()">↩ Sign Out</button>
        </div>
      </div>
    </div>
    
    <!-- Feedback Section -->
    <div class="card" style="margin-top:24px">
      <div class="card-title" style="margin-bottom:18px;display:flex;justify-content:space-between">
        <span>⭐ Patient Feedback & Ratings</span>
        <span class="badge badge-warning">${avgRating} ★</span>
      </div>
      ${feedbackList.length === 0 ? '<div class="empty-state" style="padding:20px"><p>No feedback received yet.</p></div>' : ''}
      <div style="display:flex;flex-direction:column;gap:12px">
        ${feedbackList.map(f => `
          <div style="padding:16px;border:1px solid var(--border-light);border-radius:var(--radius);background:var(--bg-secondary)">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-weight:700">${Utils.esc(f.patientName)}</span>
              <span style="color:#f59e0b;font-weight:bold">${'★'.repeat(f.rating)}${'☆'.repeat(5 - f.rating)}</span>
            </div>
            <div style="font-size:14px;color:var(--text-primary);line-height:1.5">${Utils.esc(f.comment)}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:8px">${Utils.timeAgo(f.createdAt)}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function docProfileField(label, value, isLicense = false, isSuccess = false) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--border-light)">
      <span style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${label}</span>
      <span style="font-size:14px;font-weight:600;color:${isSuccess ? 'var(--success)' : 'var(--text-primary)'};${isLicense ? 'font-family:monospace;letter-spacing:1px' : ''}">${Utils.esc(value || '—')}</span>
    </div>
  `;
}
