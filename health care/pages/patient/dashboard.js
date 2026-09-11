/**
 * WE CARE — Patient Dashboard
 */

Router.register('patient-dashboard', () => {
  const session = Auth.requireAuth('patient');
  if (!session) return;

  const user = Store.Users.getById(session.id);
  if (!user) { Auth.logout(); Router.navigate('auth'); return; }

  renderPatientPortal('dashboard', user);
  NotifService.startPolling(session.id);
});

// =====================================================
// PATIENT PORTAL SHELL
// =====================================================
function renderPatientPortal(activePage, user) {
  const session = Store.Session.get();
  const unreadNotif = Store.Notifications.getUnreadCount(session?.id || '');
  const unreadMsg = Store.Messages.getUnreadCount(session?.id || '');
  const sub = Store.Subscriptions.getForUser(session?.id || '');

  const app = document.getElementById('app');
  app.innerHTML = `
    ${Store.Demo.isEnabled() ? '<div class="demo-banner">🎯 HACKATHON DEMO MODE ACTIVE — WE CARE</div>' : ''}
    <div class="portal-layout">
      <!-- SIDEBAR -->
      <aside class="sidebar" id="patient-sidebar">
        <div class="sidebar-brand">
          <img src="logo.jpg" class="sidebar-logo" alt="WE CARE" onerror="this.style.display='none'" />
          <div class="sidebar-brand-text">
            <div class="brand-name">WE CARE</div>
            <div class="brand-tagline">Connected Care. Smarter Health.</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="sidebar-section-label">Main</div>
          ${navItem('dashboard', '🏠', 'Dashboard', activePage)}
          ${navItem('patient-prescriptions', '💊', 'Prescriptions', activePage)}
          ${navItem('patient-ai', '🤖', 'We Care AI', activePage)}
          <div class="sidebar-section-label">Communication</div>
          ${navItem('patient-messages', '💬', 'Messages', activePage, unreadMsg)}
          ${navItem('patient-appointments', '📅', 'Appointments', activePage)}
          <div class="sidebar-section-label">Account</div>
          ${navItem('patient-notifications', '🔔', 'Notifications', activePage, unreadNotif)}
          ${navItem('patient-timeline', '📋', 'Health Timeline', activePage)}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user" onclick="PatientPortal.logout()">
            <div class="sidebar-user-avatar">${Utils.getInitials(user.name)}</div>
            <div class="sidebar-user-info">
              <div class="user-name">${user.name.split(' ')[0]}</div>
              <div class="user-role">${sub?.planName || 'Patient'}</div>
            </div>
            <div class="sidebar-user-logout" title="Logout">↩</div>
          </div>
        </div>
      </aside>

      <!-- MAIN -->
      <div class="main-content">
        <!-- TOPBAR -->
        <header class="topbar" id="patient-topbar">
          <div>
            <div class="topbar-title" id="page-title">Dashboard</div>
          </div>
          <div class="topbar-actions">
            <div class="topbar-search">
              <span>🔍</span>
              <input type="text" placeholder="Search prescriptions, doctors..." id="global-search" oninput="PatientPortal.search(this.value)" />
            </div>
            <button class="topbar-btn" id="notif-bell-btn" onclick="PatientPortal.toggleNotifPanel()" title="Notifications">
              🔔
              <span class="notif-badge" id="notif-badge" style="${unreadNotif > 0 ? '' : 'display:none'}">${unreadNotif}</span>
            </button>
            <button class="topbar-btn" onclick="PatientPortal.logout()" title="Logout">↩</button>
          </div>
        </header>

        <!-- PAGE CONTENT -->
        <main class="page-content" id="patient-page-content">
          <div class="page-loader"><div class="loader-ring"></div><span>Loading...</span></div>
        </main>
      </div>
    </div>

    <!-- NOTIFICATION PANEL (hidden by default) -->
    <div id="notif-panel" style="display:none"></div>
  `;

  // Render the active page content
  PatientPortal.renderPage(activePage, user);
}

function navItem(page, icon, label, activePage, badge = 0) {
  return `
    <div class="sidebar-item ${activePage === page ? 'active' : ''}" onclick="Router.navigate('${page}')">
      <span class="nav-icon">${icon}</span>
      <span>${label}</span>
      ${badge > 0 ? `<span class="nav-badge">${badge}</span>` : ''}
    </div>
  `;
}

// =====================================================
// PATIENT PORTAL CONTROLLER
// =====================================================
const PatientPortal = {
  renderPage(page, user) {
    const content = document.getElementById('patient-page-content');
    const title = document.getElementById('page-title');
    if (!content) return;

    const session = Store.Session.get();
    user = user || Store.Users.getById(session?.id);
    if (!user) return;

    const pages = {
      'dashboard': () => { if (title) title.textContent = 'Dashboard'; PatientDashboardPage(user, content); },
      'patient-health': () => { if (title) title.textContent = 'My Health'; PatientHealthPage(user, content); },
      'patient-prescriptions': () => { if (title) title.textContent = 'Prescriptions'; PatientPrescriptionsPage(user, content); },
      'patient-ai': () => { if (title) title.textContent = 'We Care AI'; PatientAIPage(user, content); },
      'patient-messages': () => { if (title) title.textContent = 'Messages'; PatientMessagesPage(user, content); },
      'patient-appointments': () => { if (title) title.textContent = 'Appointments'; PatientAppointmentsPage(user, content); },
      'patient-notifications': () => { if (title) title.textContent = 'Notifications'; PatientNotificationsPage(user, content); },
      'patient-timeline': () => { if (title) title.textContent = 'Health Timeline'; PatientTimelinePage(user, content); },
      'patient-profile': () => { if (title) title.textContent = 'My Profile'; PatientProfilePage(user, content); },
    };

    if (pages[page]) pages[page]();
    else PatientDashboardPage(user, content);
  },

  logout() {
    NotifService.stopPolling();
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
          <div style="display:flex;gap:8px;align-items:center">
            <button class="btn btn-ghost btn-sm" style="font-size:12px" onclick="PatientPortal.markAllRead()">Mark all read</button>
            <span style="cursor:pointer;font-size:20px;color:var(--text-muted)" onclick="PatientPortal.toggleNotifPanel()">×</span>
          </div>
        </div>
        <div class="notif-panel-body">
          ${notifs.length === 0 ? '<div class="empty-state" style="padding:40px 20px"><div class="empty-icon">🔔</div><h3>No notifications</h3></div>' : ''}
          ${notifs.map(n => `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="PatientPortal.openNotif('${n.id}','${n.link}')">
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

  markAllRead() {
    const session = Store.Session.get();
    Store.Notifications.markAllRead(session.id);
    NotifService.updateNotifBadge(session.id);
    this.toggleNotifPanel(); this.toggleNotifPanel();
  },

  openNotif(id, link) {
    Store.Notifications.markRead(id);
    document.getElementById('notif-panel').style.display = 'none';
    if (link) Router.navigate(link);
  },

  search(query) {
    if (!query || query.length < 2) return;
    const session = Store.Session.get();
    const prescriptions = Store.Prescriptions.getForPatient(session.id);
    const results = [];
    prescriptions.forEach(rx => {
      rx.medicines.forEach(m => {
        if (m.name.toLowerCase().includes(query.toLowerCase())) results.push({ type: 'Prescription', label: m.name, link: 'patient-prescriptions' });
      });
    });
    // Future: implement search results dropdown
  },
};

// =====================================================
// DASHBOARD PAGE CONTENT
// =====================================================
function PatientDashboardPage(user, container) {
  const session = Store.Session.get();
  const prescriptions = Store.Prescriptions.getForPatient(session.id);
  const activePrescriptions = prescriptions.filter(p => p.status === 'active');
  const appointments = Store.Appointments.getForPatient(session.id);
  const upcomingAppts = appointments.filter(a => new Date(a.date) >= new Date());
  const unreadMsgs = Store.Messages.getUnreadCount(session.id);
  const newRx = prescriptions.filter(p => p.isNew);

  // Today's medications from all active prescriptions
  const todayMeds = [];
  activePrescriptions.forEach(rx => {
    rx.medicines.forEach(m => todayMeds.push({ ...m, doctorName: rx.doctorName, rxId: rx.id }));
  });

  container.innerHTML = `
    <!-- Prescription alert if any new -->
    ${newRx.length > 0 ? `
      <div style="background:linear-gradient(90deg,var(--success-bg),#d1fae5);border:1px solid var(--success);border-radius:var(--radius-md);padding:16px 20px;margin-bottom:24px;display:flex;align-items:center;gap:14px;cursor:pointer" onclick="Router.navigate('patient-prescriptions')">
        <span style="font-size:32px">🔔</span>
        <div style="flex:1">
          <div style="font-weight:700;color:var(--success);font-size:15px">New Prescription Added</div>
          <div style="font-size:13px;color:var(--text-secondary)">Dr. ${newRx[0].doctorName} added a new prescription. Click to view.</div>
        </div>
        <button class="btn btn-primary btn-sm">View Prescription</button>
        <button class="btn btn-ghost btn-sm" onclick="event.stopPropagation();Store.Prescriptions.markSeen('${session.id}');this.closest('[style*=background]').remove()">✕</button>
      </div>
    ` : ''}

    <!-- Greeting -->
    <div class="page-header">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <h1 class="section-title">${Utils.greet(user.name)}</h1>
          <p class="section-desc">Here's your health overview for today, ${Utils.formatDate(new Date().toISOString())}</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn btn-primary btn-sm" onclick="Router.navigate('patient-ai')">🤖 Ask We Care AI</button>
          <button class="btn btn-secondary btn-sm" onclick="Router.navigate('patient-prescriptions')">💊 My Prescriptions</button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-stats" style="margin-bottom:28px">
      ${statCard('💊', 'Active Prescriptions', activePrescriptions.length, 'teal', 'Today')}
      ${statCard('📅', 'Upcoming Appointments', upcomingAppts.length, 'blue', 'Scheduled')}
      ${statCard('💬', 'Unread Messages', unreadMsgs, 'amber', 'From doctor')}
      ${statCard('✅', 'Today\'s Meds Done', todayMeds.filter(m=>m.status==='taken').length + '/' + todayMeds.length, 'green', 'Medication')}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <!-- Today's Medication -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">💊 Today's Medication</div>
            <div class="card-subtitle">${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="Router.navigate('patient-prescriptions')">View all →</button>
        </div>
        <div class="med-timeline">
          ${todayMeds.length === 0 ? '<div class="empty-state" style="padding:30px 10px"><div class="empty-icon">💊</div><p>No medications scheduled today</p></div>' : ''}
          ${todayMeds.map((m, i) => `
            <div class="med-item">
              <div class="med-time">${m.time || '—'}</div>
              <div class="med-dot ${m.status === 'taken' ? 'taken' : m.status === 'pending' ? 'pending' : 'upcoming'}">
                ${m.status === 'taken' ? '✓' : m.status === 'pending' ? '●' : '○'}
              </div>
              <div class="med-info">
                <div class="med-name">${Utils.esc(m.name)}</div>
                <div class="med-detail">${Utils.esc(m.dosage)} — ${Utils.esc(m.frequency)}</div>
                <span class="badge ${m.status === 'taken' ? 'badge-success' : m.status === 'pending' ? 'badge-warning' : 'badge-neutral'} med-status-badge">
                  ${m.status === 'taken' ? '✓ Taken' : m.status === 'pending' ? '⏳ Pending' : '🕐 Upcoming'}
                </span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Right column -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Upcoming Appointments -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📅 Upcoming Appointments</div>
            <button class="btn btn-ghost btn-sm" onclick="Router.navigate('patient-appointments')">View all →</button>
          </div>
          ${upcomingAppts.length === 0 ? '<div class="empty-state" style="padding:20px"><p>No upcoming appointments</p></div>' : ''}
          ${upcomingAppts.slice(0, 2).map(a => {
            const d = new Date(a.date);
            return `
              <div class="appt-card" style="margin-bottom:10px">
                <div class="appt-date-block">
                  <div class="appt-day">${d.getDate()}</div>
                  <div class="appt-month">${d.toLocaleString('default',{month:'short'})}</div>
                </div>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:14px">${Utils.esc(a.type)}</div>
                  <div style="font-size:13px;color:var(--text-muted)">👨‍⚕️ ${Utils.esc(a.doctorName)}</div>
                  <div style="font-size:12px;color:var(--text-muted)">🕐 ${Utils.esc(a.time)}</div>
                </div>
                <span class="badge badge-success">${a.status}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Quick AI -->
        <div class="card" style="background:linear-gradient(135deg,var(--teal-600),var(--navy-700));color:#fff;border:none">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
            <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px">🤖</div>
            <div>
              <div style="font-weight:700;font-size:16px;font-family:'Outfit',sans-serif">We Care AI</div>
              <div style="font-size:12px;opacity:0.8">Your personal health assistant</div>
            </div>
          </div>
          <p style="font-size:13px;opacity:0.85;margin-bottom:16px">Ask about your medications, health information, or get assistance in your language.</p>
          <button class="btn" style="background:rgba(255,255,255,0.2);color:#fff;backdrop-filter:blur(10px);width:100%" onclick="Router.navigate('patient-ai')">
            💬 Start Conversation →
          </button>
        </div>
      </div>
    </div>
  `;

  // Mark new prescriptions as seen
  setTimeout(() => Store.Prescriptions.markSeen(session.id), 5000);
}

function statCard(icon, label, value, color, sub) {
  return `
    <div class="stat-card">
      <div class="stat-icon ${color}">${icon}</div>
      <div class="stat-info">
        <div class="stat-value">${value}</div>
        <div class="stat-label">${label}</div>
        <div class="stat-change" style="color:var(--text-muted);font-size:11px">${sub}</div>
      </div>
    </div>
  `;
}

// =====================================================
// MY HEALTH PAGE
// =====================================================
function PatientHealthPage(user, container) {
  container.innerHTML = `
    <div class="page-header">
      <h1 class="section-title">❤️ My Health</h1>
      <p class="section-desc">Your personal health profile and vital information</p>
    </div>
    <div style="display:grid;grid-template-columns:320px 1fr;gap:24px">
      <div>
        <div class="card" style="text-align:center;padding:32px">
          <div style="width:80px;height:80px;background:linear-gradient(135deg,var(--teal-600),var(--navy-700));border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#fff;margin:0 auto 16px">${Utils.getInitials(user.name)}</div>
          <div style="font-size:20px;font-weight:800;font-family:'Outfit',sans-serif">${Utils.esc(user.name)}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Patient ID: ${user.id.substring(0,12)}...</div>
          <span class="badge badge-teal" style="margin-top:8px">Patient</span>
          <div style="margin-top:20px;display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg-primary);border-radius:var(--radius)">
              <span style="font-size:13px;color:var(--text-muted)">Age</span>
              <span style="font-size:13px;font-weight:700">${Utils.getAge(user.dob)} years</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg-primary);border-radius:var(--radius)">
              <span style="font-size:13px;color:var(--text-muted)">Gender</span>
              <span style="font-size:13px;font-weight:700;text-transform:capitalize">${user.gender || '—'}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px;background:var(--bg-primary);border-radius:var(--radius)">
              <span style="font-size:13px;color:var(--text-muted)">Date of Birth</span>
              <span style="font-size:13px;font-weight:700">${Utils.formatDate(user.dob) || '—'}</span>
            </div>
          </div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">📞 Contact Information</div>
          <div class="grid-2">
            <div><div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600">Mobile</div><div style="font-weight:600;margin-top:4px">${Utils.esc(user.mobile) || '—'}</div></div>
            <div><div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600">Email</div><div style="font-weight:600;margin-top:4px">${Utils.esc(user.email)}</div></div>
            <div><div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600">Address</div><div style="font-weight:600;margin-top:4px">${Utils.esc(user.address) || '—'}</div></div>
            <div><div style="font-size:12px;color:var(--text-muted);text-transform:uppercase;font-weight:600">Emergency Contact</div><div style="font-weight:600;margin-top:4px;color:var(--danger)">${Utils.esc(user.emergencyContact) || '—'}</div></div>
          </div>
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">👨‍⚕️ Care Team</div>
          ${buildCareTeam(user)}
        </div>
        <div class="card">
          <div class="card-title" style="margin-bottom:16px">📋 Subscription</div>
          ${buildSubscriptionInfo(user)}
        </div>
      </div>
    </div>
  `;
}

function buildCareTeam(user) {
  const doctorIds = Store.DoctorPatients.getDoctorsForPatient(user.id);
  if (doctorIds.length === 0) return '<p style="color:var(--text-muted);font-size:13px">No doctor assigned yet. Your doctor will be assigned upon first consultation.</p>';
  return doctorIds.map(dId => {
    const doc = Store.Users.getById(dId);
    if (!doc) return '';
    return `
      <div style="display:flex;align-items:center;gap:14px;padding:12px;background:var(--bg-primary);border-radius:var(--radius)">
        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--teal-600),var(--navy-700));display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff">${Utils.getInitials(doc.name)}</div>
        <div>
          <div style="font-weight:700">${Utils.esc(doc.name)}</div>
          <div style="font-size:13px;color:var(--text-muted)">${Utils.esc(doc.specialization) || 'Physician'}</div>
          <div style="font-size:12px;color:var(--text-muted)">${Utils.esc(doc.hospital) || ''}</div>
        </div>
        <button class="btn btn-outline btn-sm" style="margin-left:auto" onclick="Router.navigate('patient-messages')">💬 Message</button>
      </div>
    `;
  }).join('');
}

function buildSubscriptionInfo(user) {
  const sub = Store.Subscriptions.getForUser(user.id);
  if (!sub) return '<p style="color:var(--text-muted);font-size:13px">No active subscription. <a onclick="Router.navigate(\'subscription\')" style="color:var(--primary);cursor:pointer">Choose a plan →</a></p>';
  return `
    <div style="display:flex;align-items:center;gap:14px">
      <div style="font-size:36px">✨</div>
      <div>
        <div style="font-size:18px;font-weight:800;color:var(--primary);font-family:'Outfit',sans-serif">${sub.planName}</div>
        <div style="font-size:13px;color:var(--text-muted)">Active since ${Utils.formatDate(sub.activatedAt)}</div>
        <span class="badge badge-success">Active</span>
      </div>
    </div>
  `;
}
