/**
 * WE CARE — Doctor Patient AI Activity Dashboard
 */

Router.register('doctor-ai-activity', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  renderDoctorPortal('doctor-ai-activity', user);
});

function DoctorAIActivityPage(user, container) {
  const session = Store.Session.get();
  const patientIds = Store.DoctorPatients.getPatientsForDoctor(session.id);
  
  // Gather all AI chats for all patients
  let allChats = [];
  patientIds.forEach(pid => {
    const chats = Store.AIChats.getAuthorizedForDoctor(pid);
    chats.forEach(c => allChats.push({ ...c, patientId: pid }));
  });
  
  allChats.sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-row">
        <div>
          <h1 class="section-title">🤖 Patient AI Activity</h1>
          <p class="section-desc">Review your patients' recent interactions with We Care AI</p>
        </div>
      </div>
    </div>

    <div style="background:var(--teal-50);border:1px solid var(--teal-200);border-radius:var(--radius);padding:16px;margin-bottom:24px;display:flex;align-items:center;gap:12px">
      <span style="font-size:24px">ℹ️</span>
      <div style="font-size:13px;color:var(--teal-800)">
        <strong>Authorized Clinical View:</strong> This dashboard shows health-related questions your patients are asking the AI. 
        Use this to understand their concerns and provide better care during their next appointment.
      </div>
    </div>

    <div class="card" style="padding:0">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Patient</th>
              <th>AI Topic Summary</th>
              <th>Last Interaction</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${allChats.length === 0 ? '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--text-muted)">No AI activity recorded.</td></tr>' : ''}
            ${allChats.map(chat => {
              const patient = Store.Users.getById(chat.patientId);
              const q = chat.messages.find(m => m.role === 'user');
              return `
                <tr>
                  <td style="font-weight:600;font-size:13px">${Utils.formatDate(chat.updatedAt)}</td>
                  <td>
                    <div style="font-weight:600;font-size:14px">${Utils.esc(patient?.name || 'Unknown')}</div>
                    <div style="font-size:12px;color:var(--text-muted)">ID: ${chat.patientId.substring(0,8)}</div>
                  </td>
                  <td>
                    <div style="font-weight:600;font-size:13px;color:var(--teal-700)">${Utils.esc(chat.topic.substring(0,40))}</div>
                    <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                      ${q ? `Q: "${Utils.esc(q.text)}"` : 'No questions logged'}
                    </div>
                  </td>
                  <td style="font-size:12px">${Utils.timeAgo(chat.updatedAt)}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm" onclick="DoctorPortal.viewAIChat('${chat.id}')">View Transcript</button>
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
