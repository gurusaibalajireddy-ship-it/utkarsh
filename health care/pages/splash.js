/**
 * WE CARE — Splash Screen
 */

Router.register('splash', () => {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="splash-screen">
      <div class="splash-logo-wrap">
        <div class="splash-pulse-ring"></div>
        <div class="splash-pulse-ring"></div>
        <img src="logo.jpg" alt="WE CARE Logo" class="splash-logo" onerror="this.style.display='none';document.querySelector('.splash-logo-svg').style.display='flex'" />
        <div class="splash-logo-svg" style="display:none;width:120px;height:120px;border-radius:30px;background:linear-gradient(135deg,#0d9488,#1E3A5F);align-items:center;justify-content:center;font-size:56px">⚕️</div>
      </div>
      <div class="splash-title font-outfit">WE CARE</div>
      <div class="splash-tagline">Connected Care. Smarter Health.</div>
      <div class="splash-progress">
        <div class="splash-progress-bar"></div>
      </div>
      <div class="splash-loading-text">Initializing secure health platform...</div>
    </div>
  `;

  // After 3.2s → transition to auth or portal
  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.transition = 'opacity 0.6s ease';
      splash.style.opacity = '0';
      setTimeout(() => {
        const session = Store.Session.get();
        if (session) {
          if (session.role === 'patient') Router.navigate('patient-dashboard');
          else if (session.role === 'doctor') Router.navigate('doctor-dashboard');
          else Router.navigate('auth');
        } else {
          Router.navigate('auth');
        }
      }, 600);
    }
  }, 3200);
});
