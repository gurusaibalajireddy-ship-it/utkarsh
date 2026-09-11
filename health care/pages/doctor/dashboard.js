/**
 * WE CARE — Doctor Dashboard
 */

Router.register('doctor-dashboard', () => {
  const session = Auth.requireAuth('doctor');
  if (!session) return;
  const user = Store.Users.getById(session.id);
  if (!user) { Auth.logout(); Router.navigate('auth'); return; }
  renderDoctorPortal('doctor-dashboard', user);
});

// =====================================================
// DOCTOR PORTAL SHELL
// =====================================================
function renderDoctorPortal(activePage, user) {
  const session = Store.Session.get();
  const unreadNotif = Store.Notifications.getUnreadCount(session?.id || '');
  const unreadMsg = Store.Messages.getUnreadCount(session?.id || '');
  const patientIds = Store.DoctorPatients.getPatientsForDoctor(session?.id || '');

  const app = document.getElementById('app');
  app.innerHTML = `
    ${Store.Demo.isEnabled() ? '<div class="demo-banner">🎯 HACKATHON DEMO MODE — DOCTOR PORTAL</div>' : ''}
    <div class="portal-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar" id="doctor-sidebar">
        <div class="sidebar-brand">
          <img src="logo.jpg" class="sidebar-logo" alt="WE CARE" onerror="this.style.display='none'" />
          <div class="sidebar-brand-text">
            <div class="brand-name">WE CARE</div>
            <div class="brand-tagline">Doctor Portal</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section-label">Overview</div>
          ${docNavItem('doctor-dashboard', '🏥', 'Dashboard', activePage)}
          ${docNavItem('doctor-patients', '👥', 'My Patients', activePage, patientIds.length)}
          <div class="sidebar-section-label">Clinical</div>
          ${docNavItem('doctor-prescriptions', '💊', 'Prescriptions', activePage)}
          ${docNavItem('doctor-appointments', '📅', 'Appointments', activePage)}
          ${docNavItem('doctor-messages', '💬', 'Messages', activePage, unreadMsg)}
          <div class="sidebar-section-label">Monitoring</div>
          ${docNavItem('doctor-ai-activity', '🤖', 'AI Patient Activity', activePage)}
          ${docNavItem('doctor-cctv', '📹', 'CCTV Monitoring', activePage)}
          ${docNavItem('doctor-devices', '📡', 'IoT Devices', activePage)}
          <div class="sidebar-section-label">Account</div>
          ${docNavItem('doctor-notifications', '🔔', 'Notifications', activePage, unreadNotif)}
          ${docNavItem('doctor-profile', '👤', 'Profile', activePage)}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user" onclick="DoctorPortal.logout()">
            <div class="sidebar-user-avatar">${Utils.getInitials(user.name)}</div>
            <div class="sidebar-user-info">
              <div class="user-name">${user.name.split(' ')[0]}</div>
              <div class="user-role">${user.specialization || 'Doctor'}</div>
            </div>
            <div class="sidebar-user-logout" title="Logout">↩</div>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <div class="main-content">
        <header class="topbar">
          <div>
            <div class="topbar-title" id="page-title">Doctor Dashboard</div>
          </div>
          <div class="topbar-actions">
            <div class="topbar-search">
              <span>🔍</span>
              <input type="text" placeholder="Search patients, prescriptions..." id="doctor-search" oninput="DoctorPortal.search(this.value)" />
            </div>
            <button class="topbar-btn" onclick="DoctorPortal.toggleNotifPanel()" title="Notifications">
              🔔
              <span class="notif-badge" id="notif-badge" style="${unreadNotif > 0 ? '' : 'display:none'}">${unreadNotif}</span>
            </button>
            <button class="topbar-btn" onclick="DoctorPortal.logout()" title="Logout">↩</button>
          </div>
        </header>
        <main class="page-content" id="doctor-page-content">
          <div class="page-loader"><div class="loader-ring"></div><span>Loading...</span></div>
        </main>
      </div>
    </div>
    <div id="notif-panel" style="display:none"></div>
  `;

  DoctorPortal.renderPage(activePage, user);
}

function docNavItem(page, icon, label, activePage, badge = 0) {
  return `
    <div class="sidebar-item ${activePage === page ? 'active' : ''}" onclick="Router.navigate('${page}')">
      <span class="nav-icon">${icon}</span>
      <span>${label}</span>
      ${badge > 0 ? `<span class="nav-badge">${badge}</span>` : ''}
    </div>
  `;
}

// =====================================================
// DOCTOR PORTAL CONTROLLER
// =====================================================
const DoctorPortal = {
  renderPage(page, user) {
    const content = document.getElementById('doctor-page-content');
    const title = document.getElementById('page-title');
    if (!content) return;

    const session = Store.Session.get();
    user = user || Store.Users.getById(session?.id);
    if (!user) return;

    const pages = {
      'doctor-dashboard': () => { if (title) title.textContent = 'Dashboard'; DoctorDashboardPage(user, content); },
      'doctor-patients': () => { if (title) title.textContent = 'My Patients'; DoctorPatientsPage(user, content); },
      'doctor-prescriptions': () => { if (title) title.textContent = 'Prescriptions'; DoctorPrescriptionsPage(user, content); },
      'doctor-appointments': () => { if (title) title.textContent = 'Appointments'; DoctorAppointmentsPage(user, content); },
      'doctor-messages': () => { if (title) title.textContent = 'Messages'; DoctorMessagesPage(user, content); },
      'doctor-ai-activity': () => { if (title) title.textContent = 'Patient AI Activity'; DoctorAIActivityPage(user, content); },
      'doctor-cctv': () => { if (title) title.textContent = 'CCTV Monitoring'; DoctorCCTVPage(user, content); },
      'doctor-devices': () => { if (title) title.textContent = 'IoT Devices'; DoctorDevicesPage(user, content); },
      'doctor-notifications': () => { if (title) title.textContent = 'Notifications'; DoctorNotificationsPage(user, content); },
      'doctor-profile': () => { if (title) title.textContent = 'My Profile'; DoctorProfilePage(user, content); },
    };

    if (pages[page]) pages[page]();
    else DoctorDashboardPage(user, content);
  },

  logout() {
    Auth.logout();
    NotifService.toast('info', 'Signed out', 'See you soon!');
    setTimeout(() => Router.navigate('auth'), 500);
  },

  toggleNotifPanel() {
    const panel = document.getElementById('notif-panel');
    if (!panel) return;
    const session = Store.Session.get();

    if (panel.style.display === 'none') {
      const notifs = Store.Notifications.getForUser(session.id);
      panel.style.display = 'flex';
      panel.className = 'notif-panel';
      panel.innerHTML = `
        <div class="notif-panel-header">
          <span class="notif-panel-title">🔔 Notifications</span>
          <span style="cursor:pointer;font-size:20px;color:var(--text-muted)" onclick="DoctorPortal.toggleNotifPanel()">×</span>
        </div>
        <div class="notif-panel-body">
          ${notifs.length === 0 ? '<div class="empty-state" style="padding:40px 20px"><div class="empty-icon">🔔</div><h3>No notifications</h3></div>' : ''}
          ${notifs.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="DoctorPortal.toggleNotifPanel()">
              <span class="notif-item-icon">${n.type === 'prescription' ? '💊' : n.type === 'message' ? '💬' : n.type === 'appointment' ? '📅' : '🔔'}</span>
              <div class="notif-item-body">
                <div class="notif-item-title">${Utils.esc(n.title)}</div>
                <div class="notif-item-msg">${Utils.esc(n.message)}</div>
                <div class="notif-item-time">${Utils.timeAgo(n.createdAt)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      Store.Notifications.markAllRead(session.id);
      NotifService.updateNotifBadge(session.id);
    } else {
      panel.style.display = 'none';
    }
  },

  search(query) {
    // Future: implement search dropdown
  },
};

// =====================================================
// DOCTOR DASHBOARD PAGE CONTENT
// =====================================================
function DoctorDashboardPage(user, container) {
  const session = Store.Session.get();
  const patientIds = Store.DoctorPatients.getPatientsForDoctor(session.id);
  const allRx = Store.Prescriptions.getByDoctor(session.id);
  const allAppts = Store.Appointments.getForDoctor(session.id);
  const upcomingAppts = allAppts.filter(a => new Date(a.date) >= new Date());
  const unreadMsgs = Store.Messages.getUnreadCount(session.id);

  container.innerHTML = `
    <div class="page-header">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="section-title">${Utils.greet(user.name)}</h1>
          <p class="section-desc">${Utils.esc(user.specialization || 'Doctor')} · ${Utils.esc(user.hospital || 'WE CARE')} · ${Utils.formatDate(new Date().toISOString())}</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary btn-sm" onclick="DoctorRxWriter.open()">✏️ Write Prescription</button>
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('doctor-patients')">👥 View Patients</button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-stats" style="margin-bottom:28px">
      ${statCard('👥', 'My Patients', patientIds.length, 'teal', 'Total assigned')}
      ${statCard('💊', 'Active Prescriptions', allRx.filter(r=>r.status==='active').length, 'green', 'Currently active')}
      ${statCard('📅', 'Upcoming Appointments', upcomingAppts.length, 'blue', 'Scheduled')}
      ${statCard('💬', 'Unread Messages', unreadMsgs, 'amber', 'From patients')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- My Patients Summary -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">👥 My Patients</div>
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('doctor-patients')">View all →</button>
        </div>
        ${patientIds.length === 0 ? '<div class="empty-state" style="padding:30px"><p>No patients assigned yet</p></div>' : ''}
        ${patientIds.slice(0, 5).map(pid => {
          const p = Store.Users.getById(pid);
          if (!p) return '';
          const patientRx = Store.Prescriptions.getForPatient(pid).filter(r => r.status === 'active');
          const newMsg = Store.Messages.getAll().some(m => m.fromId === pid && m.toId === session.id && !m.read);
          return `
            <div class="patient-card" style="margin-bottom:10px" onclick="DoctorPortal.openPatientCare('${pid}')">
              <div class="patient-avatar">${Utils.getInitials(p.name)}</div>
              <div style="flex:1">
                <div style="font-weight:700;font-size:14px">${Utils.esc(p.name)}</div>
                <div style="font-size:12px;color:var(--text-muted)">${Utils.getAge(p.dob)} yrs · ${p.gender || '—'}</div>
                <div style="font-size:12px;color:var(--text-muted)">💊 ${patientRx.length} active prescription${patientRx.length !== 1 ? 's' : ''}</div>
              </div>
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
                ${newMsg ? '<span class="badge badge-info" style="font-size:10px">New Msg</span>' : ''}
                <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();DoctorPortal.openPatientCare('${pid}')">View →</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Quick actions -->
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">⚡ Quick Actions</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <button class="btn btn-primary" onclick="DoctorRxWriter.open()" style="flex-direction:column;height:70px;font-size:13px;gap:6px">✏️<br/>Write Prescription</button>
            <button class="btn btn-secondary" onclick="Router.navigate('doctor-cctv')" style="flex-direction:column;height:70px;font-size:13px;gap:6px">📹<br/>CCTV Monitor</button>
            <button class="btn btn-secondary" onclick="Router.navigate('doctor-messages')" style="flex-direction:column;height:70px;font-size:13px;gap:6px">💬<br/>Messages</button>
            <button class="btn btn-secondary" onclick="Router.navigate('doctor-ai-activity')" style="flex-direction:column;height:70px;font-size:13px;gap:6px">🤖<br/>AI Activity</button>
          </div>
        </div>

        <!-- Monitoring and Prep -->
        <div class="grid-2">
          
          <!-- Next Patient Card -->
          <div class="card">
            <h3 class="section-title" style="margin-bottom:15px;display:flex;justify-content:space-between">
              Next Patient
              <span class="badge badge-primary">10:30 AM</span>
            </h3>
            <div style="display:flex;gap:15px;align-items:center;margin-bottom:15px">
              <img src="https://ui-avatars.com/api/?name=Arun+Kumar&background=e2e8f0" style="width:60px;height:60px;border-radius:50%" />
              <div>
                <div style="font-weight:700;font-size:18px">Arun Kumar</div>
                <div style="color:var(--text-muted);font-size:14px">Follow-up: Viral Fever</div>
              </div>
            </div>
            <button class="btn btn-primary" style="width:100%" onclick="Router.navigate('doctor-patient-care')">Prepare for Visit</button>
          </div>

          <!-- CCTV Safety Summary Card -->
          <div class="card" style="border-left: 4px solid var(--danger);">
            <h3 class="section-title" style="margin-bottom:15px;display:flex;justify-content:space-between">
              CCTV Safety Monitoring
              <span class="badge" style="background:var(--danger);color:#fff">LIVE</span>
            </h3>
            <div style="margin-bottom:15px">
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="color:var(--text-muted)">Status</span>
                <span style="font-weight:700;color:var(--success)">🟢 Monitoring Active</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="color:var(--text-muted)">Possible Falls</span>
                <span style="font-weight:700">0</span>
              </div>
              <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                <span style="color:var(--text-muted)">Audio Alerts</span>
                <span style="font-weight:700">0</span>
              </div>
              <div style="display:flex;justify-content:space-between">
                <span style="color:var(--text-muted)">Unreviewed Alerts</span>
                <span style="font-weight:700;color:var(--warning)">0</span>
              </div>
            </div>
            <button class="btn btn-secondary" style="width:100%" onclick="Router.navigate('doctor-cctv')">Open CCTV Command Center</button>
          </div>
          
        </div>
      </div>
    </div>
  `;
}

DoctorPortal.openPatientCare = function(patientId) {
  window._selectedPatientId = patientId;
  Router.navigate('doctor-patient-care');
};
