/**
 * WE CARE — Authentication Page
 * Login + Signup for Patient & Doctor
 */

Router.register('auth', () => {
  const app = document.getElementById('app');
  NotifService.stopPolling();

  app.innerHTML = `
    <div id="auth-page">
      <div class="auth-container">
        <!-- LEFT PANEL -->
        <div class="auth-left">
          <div class="auth-left-logo">
            <img src="logo.jpg" alt="WE CARE" onerror="this.style.display='none'" />
            <span class="logo-text">WE CARE</span>
          </div>
          <h2>Healthcare<br/>Made <span>Smarter</span><br/>& Connected.</h2>
          <p>A secure platform connecting patients and doctors through AI-powered care, real-time prescriptions, and seamless communication.</p>
          <div class="auth-feature-list">
            <div class="auth-feature"><div class="auth-feature-icon">🤖</div> We Care AI — Your smart health assistant</div>
            <div class="auth-feature"><div class="auth-feature-icon">💊</div> Real-time prescription sync with alerts</div>
            <div class="auth-feature"><div class="auth-feature-icon">🎙️</div> Voice AI in multiple Indian languages</div>
            <div class="auth-feature"><div class="auth-feature-icon">🏥</div> Secure doctor–patient communication</div>
            <div class="auth-feature"><div class="auth-feature-icon">📹</div> CCTV clinic monitoring for doctors</div>
          </div>
          <div style="margin-top:24px">
            <button class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,0.3)" onclick="AuthPage.loadDemo()">
              🎯 Try Demo Mode
            </button>
          </div>
        </div>

        <!-- RIGHT PANEL -->
        <div class="auth-right" id="auth-right-panel">
          <!-- Rendered by AuthPage.render() -->
        </div>
      </div>
    </div>
  `;

  AuthPage.init();
});

const AuthPage = (() => {
  let mode = 'login'; // login | signup
  let role = 'patient'; // patient | doctor

  function init() {
    renderRight();
  }

  function renderRight() {
    const panel = document.getElementById('auth-right-panel');
    if (!panel) return;
    if (mode === 'login') renderLogin(panel);
    else renderSignup(panel);
  }

  function renderLogin(panel) {
    panel.innerHTML = `
      <div class="auth-header">
        <h3>Welcome Back</h3>
        <p>Sign in to access your ${role === 'patient' ? 'health' : 'doctor'} portal</p>
      </div>

      <div class="auth-role-tabs">
        <button class="role-tab ${role === 'patient' ? 'active' : ''}" onclick="AuthPage.setRole('patient')">👤 Patient</button>
        <button class="role-tab ${role === 'doctor' ? 'active' : ''}" onclick="AuthPage.setRole('doctor')">👨‍⚕️ Doctor</button>
      </div>

      <div id="auth-error" class="form-error" style="display:none;background:var(--danger-bg);padding:10px 14px;border-radius:var(--radius);margin-bottom:16px"></div>

      <div class="form-group">
        <label class="form-label">Email Address <span>*</span></label>
        <div class="input-group">
          <span class="input-icon">✉️</span>
          <input type="email" id="login-email" class="form-control" placeholder="your@email.com" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Password <span>*</span></label>
        <div class="input-group">
          <span class="input-icon">🔒</span>
          <input type="password" id="login-password" class="form-control" placeholder="••••••••" />
          <span class="input-suffix" onclick="AuthPage.togglePw('login-password')">👁️</span>
        </div>
      </div>

      <button class="btn btn-primary btn-full btn-lg" id="login-btn" onclick="AuthPage.doLogin()">
        Sign In
      </button>

      <div class="auth-divider"><span>or</span></div>

      ${Store.Demo.isEnabled() ? `<div style="background:linear-gradient(135deg,#7c3aed20,#db297720);border:1px solid #7c3aed40;border-radius:var(--radius);padding:14px;margin-bottom:16px">
        <div style="font-size:13px;font-weight:700;color:#7c3aed;margin-bottom:8px">🎯 HACKATHON DEMO MODE ACTIVE</div>
        <div style="font-size:12px;color:var(--text-secondary)">Patient: priya@wecare.demo / Demo@1234</div>
        <div style="font-size:12px;color:var(--text-secondary)">Doctor: arjun@wecare.demo / Demo@1234</div>
        <div style="display:flex;gap:8px;margin-top:10px">
          <button class="btn btn-sm btn-primary" onclick="AuthPage.quickLogin('patient')" style="flex:1;font-size:12px">👤 Patient Demo</button>
          <button class="btn btn-sm btn-secondary" onclick="AuthPage.quickLogin('doctor')" style="flex:1;font-size:12px">👨‍⚕️ Doctor Demo</button>
        </div>
      </div>` : ''}

      <div class="auth-footer">
        Don't have an account? <a onclick="AuthPage.setMode('signup')">Sign up for free</a>
      </div>
    `;

    document.getElementById('login-password').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
    document.getElementById('login-email').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-password').focus(); });
  }

  function renderSignup(panel) {
    if (role === 'patient') renderPatientSignup(panel);
    else renderDoctorSignup(panel);
  }

  function renderPatientSignup(panel) {
    panel.innerHTML = `
      <div class="auth-header">
        <h3>Create Patient Account</h3>
        <p>Join WE CARE for smarter, connected healthcare</p>
      </div>
      <div class="auth-role-tabs">
        <button class="role-tab ${role === 'patient' ? 'active' : ''}" onclick="AuthPage.setRole('patient')">👤 Patient</button>
        <button class="role-tab ${role === 'doctor' ? 'active' : ''}" onclick="AuthPage.setRole('doctor')">👨‍⚕️ Doctor</button>
      </div>
      <div id="auth-error" class="form-error" style="display:none;background:var(--danger-bg);padding:10px 14px;border-radius:var(--radius);margin-bottom:12px"></div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Full Name <span>*</span></label>
          <input type="text" id="su-name" class="form-control" placeholder="Priya Sharma" />
        </div>
        <div class="form-group">
          <label class="form-label">Email <span>*</span></label>
          <input type="email" id="su-email" class="form-control" placeholder="your@email.com" />
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Mobile <span>*</span></label>
          <input type="tel" id="su-mobile" class="form-control" placeholder="+91-9876543210" />
        </div>
        <div class="form-group">
          <label class="form-label">Date of Birth <span>*</span></label>
          <input type="date" id="su-dob" class="form-control" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Gender <span>*</span></label>
        <select id="su-gender" class="form-control">
          <option value="">Select gender</option>
          <option value="female">Female</option>
          <option value="male">Male</option>
          <option value="other">Other</option>
          <option value="prefer_not">Prefer not to say</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Address</label>
        <input type="text" id="su-address" class="form-control" placeholder="12, MG Road, Bengaluru, Karnataka" />
      </div>
      <div class="form-group">
        <label class="form-label">Emergency Contact</label>
        <input type="tel" id="su-emergency" class="form-control" placeholder="+91-9876543211" />
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Password <span>*</span></label>
          <div class="input-group">
            <span class="input-icon">🔒</span>
            <input type="password" id="su-password" class="form-control" placeholder="Min 8 chars" />
            <span class="input-suffix" onclick="AuthPage.togglePw('su-password')">👁️</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password <span>*</span></label>
          <div class="input-group">
            <span class="input-icon">🔒</span>
            <input type="password" id="su-confirm" class="form-control" placeholder="Repeat password" />
          </div>
        </div>
      </div>
      <button class="btn btn-primary btn-full" onclick="AuthPage.doPatientSignup()">Create Patient Account →</button>
      <div class="auth-footer">Already have an account? <a onclick="AuthPage.setMode('login')">Sign in</a></div>
    `;
  }

  function renderDoctorSignup(panel) {
    panel.innerHTML = `
      <div class="auth-header">
        <h3>Doctor Registration</h3>
        <p>Create your secure doctor portal account</p>
      </div>
      <div class="auth-role-tabs">
        <button class="role-tab ${role === 'patient' ? 'active' : ''}" onclick="AuthPage.setRole('patient')">👤 Patient</button>
        <button class="role-tab ${role === 'doctor' ? 'active' : ''}" onclick="AuthPage.setRole('doctor')">👨‍⚕️ Doctor</button>
      </div>
      <div id="auth-error" class="form-error" style="display:none;background:var(--danger-bg);padding:10px 14px;border-radius:var(--radius);margin-bottom:12px"></div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Full Name <span>*</span></label>
          <input type="text" id="dsu-name" class="form-control" placeholder="Dr. Arjun Mehta" />
        </div>
        <div class="form-group">
          <label class="form-label">Email <span>*</span></label>
          <input type="email" id="dsu-email" class="form-control" placeholder="dr@hospital.com" />
        </div>
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Mobile <span>*</span></label>
          <input type="tel" id="dsu-mobile" class="form-control" placeholder="+91-9876500001" />
        </div>
        <div class="form-group">
          <label class="form-label">Doctor ID / License <span>*</span></label>
          <input type="text" id="dsu-license" class="form-control" placeholder="KA-MED-2019-0042" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Medical Specialization <span>*</span></label>
        <select id="dsu-spec" class="form-control">
          <option value="">Select specialization</option>
          <option>General Physician</option>
          <option>Cardiologist</option>
          <option>Dermatologist</option>
          <option>Neurologist</option>
          <option>Orthopedic Surgeon</option>
          <option>Pediatrician</option>
          <option>Psychiatrist</option>
          <option>Oncologist</option>
          <option>Gynecologist</option>
          <option>ENT Specialist</option>
          <option>Ophthalmologist</option>
          <option>Diabetologist</option>
          <option>Other</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Hospital / Clinic <span>*</span></label>
        <input type="text" id="dsu-hospital" class="form-control" placeholder="Apollo Hospitals, Bengaluru" />
      </div>
      <div class="grid-2">
        <div class="form-group">
          <label class="form-label">Password <span>*</span></label>
          <div class="input-group">
            <span class="input-icon">🔒</span>
            <input type="password" id="dsu-password" class="form-control" placeholder="Min 8 chars" />
            <span class="input-suffix" onclick="AuthPage.togglePw('dsu-password')">👁️</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Confirm Password <span>*</span></label>
          <div class="input-group">
            <span class="input-icon">🔒</span>
            <input type="password" id="dsu-confirm" class="form-control" placeholder="Repeat password" />
          </div>
        </div>
      </div>
      <div style="background:var(--teal-50);border:1px solid var(--teal-200);border-radius:var(--radius);padding:12px 14px;font-size:12px;color:var(--teal-700);margin-bottom:16px">
        🔐 Doctor accounts are marked as "Doctor — Verified" after registration. Do not share your login credentials.
      </div>
      <button class="btn btn-primary btn-full" onclick="AuthPage.doDoctorSignup()">Register Doctor Account →</button>
      <div class="auth-footer">Already have an account? <a onclick="AuthPage.setMode('login')">Sign in</a></div>
    `;
  }

  function showError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  function hideError() {
    const el = document.getElementById('auth-error');
    if (el) el.style.display = 'none';
  }

  function setMode(m) {
    mode = m;
    renderRight();
  }

  function setRole(r) {
    role = r;
    renderRight();
  }

  function togglePw(id) {
    const el = document.getElementById(id);
    if (el) el.type = el.type === 'password' ? 'text' : 'password';
  }

  function doLogin() {
    hideError();
    const email = document.getElementById('login-email')?.value.trim();
    const password = document.getElementById('login-password')?.value;
    const btn = document.getElementById('login-btn');

    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Signing in...'; }

    setTimeout(() => {
      const result = Auth.login(email, password, role);
      if (!result.success) {
        showError(result.error);
        if (btn) { btn.disabled = false; btn.innerHTML = 'Sign In'; }
        return;
      }
      const user = result.user;
      NotifService.toast('success', 'Welcome back!', `Signed in as ${user.name}`);
      if (user.role === 'patient') Router.navigate('patient-dashboard');
      else Router.navigate('doctor-dashboard');
    }, 800);
  }

  function doPatientSignup() {
    hideError();
    const data = {
      name: document.getElementById('su-name')?.value || '',
      email: document.getElementById('su-email')?.value || '',
      mobile: document.getElementById('su-mobile')?.value || '',
      dob: document.getElementById('su-dob')?.value || '',
      gender: document.getElementById('su-gender')?.value || '',
      address: document.getElementById('su-address')?.value || '',
      emergencyContact: document.getElementById('su-emergency')?.value || '',
      password: document.getElementById('su-password')?.value || '',
      confirmPassword: document.getElementById('su-confirm')?.value || '',
    };
    const result = Auth.signupPatient(data);
    if (!result.success) { showError(result.errors.join('\n')); return; }
    Store.Session.set(result.user);
    NotifService.toast('success', 'Account Created!', `Welcome to WE CARE, ${result.user.name}!`);
    Router.navigate('subscription');
  }

  function doDoctorSignup() {
    hideError();
    const data = {
      name: document.getElementById('dsu-name')?.value || '',
      email: document.getElementById('dsu-email')?.value || '',
      mobile: document.getElementById('dsu-mobile')?.value || '',
      specialization: document.getElementById('dsu-spec')?.value || '',
      hospital: document.getElementById('dsu-hospital')?.value || '',
      licenseId: document.getElementById('dsu-license')?.value || '',
      password: document.getElementById('dsu-password')?.value || '',
      confirmPassword: document.getElementById('dsu-confirm')?.value || '',
    };
    const result = Auth.signupDoctor(data);
    if (!result.success) { showError(result.errors.join('\n')); return; }
    Store.Session.set(result.user);
    NotifService.toast('success', 'Doctor Account Created!', `Welcome, ${result.user.name}!`);
    Router.navigate('doctor-dashboard');
  }

  function quickLogin(r) {
    const credentials = {
      patient: { email: 'priya@wecare.demo', password: 'Demo@1234', role: 'patient' },
      doctor: { email: 'arjun@wecare.demo', password: 'Demo@1234', role: 'doctor' },
    };
    const cred = credentials[r];
    const result = Auth.login(cred.email, cred.password, cred.role);
    if (result.success) {
      NotifService.toast('success', `Demo: ${result.user.name}`, 'Logged in with demo account');
      if (r === 'patient') Router.navigate('patient-dashboard');
      else Router.navigate('doctor-dashboard');
    }
  }

  function loadDemo() {
    Store.Demo.enable();
    NotifService.toast('info', '🎯 Demo Mode Active', 'Demo credentials are now visible on the login screen');
    renderRight();
  }

  return { init, setMode, setRole, togglePw, doLogin, doPatientSignup, doDoctorSignup, quickLogin, loadDemo };
})();
