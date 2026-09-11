/**
 * WE CARE — Patient Profile Page
 */

Router.register('patient-profile', () => {
  const session = Auth.requireAuth('patient');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderPatientPortal('patient-profile', user);
});

function PatientProfilePage(user, container) {
  const sub = Store.Subscriptions.getForUser(user.id);

  container.innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar-lg">${Utils.getInitials(user.name)}</div>
      <div style="flex:1">
        <div style="font-size:28px;font-weight:800;font-family:'Outfit',sans-serif">${Utils.esc(user.name)}</div>
        <div style="font-size:14px;opacity:0.8;margin-top:4px">Patient · ${Utils.esc(user.email)}</div>
        <div style="display:flex;gap:10px;margin-top:12px">
          <span class="badge" style="background:rgba(255,255,255,0.2);color:#fff">Patient Account</span>
          ${sub ? `<span class="badge" style="background:rgba(255,255,255,0.2);color:#fff">${sub.planName}</span>` : ''}
        </div>
      </div>
      <button class="btn" style="background:rgba(255,255,255,0.15);color:#fff" onclick="PatientProfilePage.editProfile()">✏️ Edit Profile</button>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:18px">👤 Personal Information</div>
        ${profileField('Full Name', user.name)}
        ${profileField('Email', user.email)}
        ${profileField('Mobile', user.mobile)}
        ${profileField('Date of Birth', Utils.formatDate(user.dob))}
        ${profileField('Age', Utils.getAge(user.dob) + ' years')}
        ${profileField('Gender', user.gender, true)}
        ${profileField('Address', user.address)}
        ${profileField('Emergency Contact', user.emergencyContact, false, true)}
        ${profileField('Guardian Name', user.guardianName)}
        ${profileField('Guardian Phone', user.guardianPhone)}
      </div>

      <!-- Feedback Form -->
      <div class="card" style="margin-top:20px">
        <div class="card-title" style="margin-bottom:18px">⭐ Doctor Feedback</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Rate and review your assigned doctor to help us improve care quality.</p>
        <div style="display:flex;flex-direction:column;gap:12px">
          <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Assigned Doctor</label>
            <input type="text" class="form-control" value="${Store.Users.getById(user.doctorAssigned)?.name || 'Not Assigned'}" disabled />
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Rating (1-5)</label>
            <select id="feedback-rating" class="form-control">
              <option value="5">⭐⭐⭐⭐⭐ (5) Excellent</option>
              <option value="4">⭐⭐⭐⭐ (4) Very Good</option>
              <option value="3">⭐⭐⭐ (3) Average</option>
              <option value="2">⭐⭐ (2) Poor</option>
              <option value="1">⭐ (1) Terrible</option>
            </select>
          </div>
          <div>
            <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px">Review</label>
            <textarea id="feedback-comment" class="form-control" rows="3" placeholder="Write your review here..."></textarea>
          </div>
          <button class="btn btn-primary" onclick="PatientProfilePage.submitFeedback('${user.id}', '${user.doctorAssigned}')" style="align-self:flex-start">Submit Feedback</button>
        </div>
      </div>
      
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="card">
          <div class="card-title" style="margin-bottom:18px">🔒 Security</div>
          ${profileField('Password', '••••••••')}
          ${profileField('Account Created', Utils.formatDate(user.createdAt))}
          ${profileField('Patient ID', user.id.substring(0,20) + '...')}
          <div style="margin-top:16px">
            <button class="btn btn-outline btn-sm" onclick="PatientProfilePage.changePassword()">🔒 Change Password</button>
          </div>
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">📋 Subscription</div>
          ${sub ? `
            <div style="padding:16px;background:var(--teal-50);border-radius:var(--radius);border:1px solid var(--teal-200)">
              <div style="font-size:18px;font-weight:800;color:var(--primary)">${sub.planName}</div>
              <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Active since ${Utils.formatDate(sub.activatedAt)}</div>
              <span class="badge badge-success" style="margin-top:8px">Active</span>
            </div>
            <button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="Router.navigate('subscription')">Upgrade Plan</button>
          ` : `
            <p style="font-size:13px;color:var(--text-muted)">No active subscription</p>
            <button class="btn btn-primary btn-sm" style="margin-top:8px" onclick="Router.navigate('subscription')">Choose a Plan</button>
          `}
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:8px">⚠️ Account Actions</div>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px">Manage your WE CARE account</p>
          <button class="btn btn-secondary btn-sm" onclick="PatientPortal.logout()">↩ Sign Out</button>
        </div>
      </div>
    </div>
  `;
}

function profileField(label, value, capitalize = false, danger = false) {
  return `
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:10px 0;border-bottom:1px solid var(--border-light)">
      <span style="font-size:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.5px">${label}</span>
      <span style="font-size:14px;font-weight:600;color:${danger ? 'var(--danger)' : 'var(--text-primary)'};${capitalize ? 'text-transform:capitalize' : ''}">${Utils.esc(value || '—')}</span>
    </div>
  `;
}

const PatientProfilePage = {
  editProfile() {
    NotifService.toast('info', 'Coming Soon', 'Profile editing will be available in the next update');
  },
  changePassword() {
    NotifService.toast('info', 'Coming Soon', 'Password change via email verification coming soon');
  },
  submitFeedback(patientId, doctorId) {
    if (!doctorId || doctorId === 'undefined') {
      NotifService.toast('error', 'Error', 'No doctor assigned to review.');
      return;
    }
    const rating = parseInt(document.getElementById('feedback-rating').value);
    const comment = document.getElementById('feedback-comment').value.trim();
    if (!comment) {
      NotifService.toast('warning', 'Review Empty', 'Please provide a written review.');
      return;
    }
    
    const user = Store.Users.getById(patientId);
    Store.Feedback.add({
      patientId: patientId,
      doctorId: doctorId,
      patientName: user.name,
      rating: rating,
      comment: comment
    });
    
    NotifService.toast('success', 'Feedback Submitted', 'Thank you for your feedback!');
    document.getElementById('feedback-comment').value = '';
  }
};
