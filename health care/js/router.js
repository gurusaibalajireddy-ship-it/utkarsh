/**
 * WE CARE — Client-side Router
 * Hash-based SPA routing
 */

const Router = (() => {
  const routes = {};
  let currentRoute = null;

  function register(name, handler) {
    routes[name] = handler;
  }

  function navigate(route, params = {}) {
    currentRoute = route;
    window.location.hash = '#' + route;
    render(route, params);
  }

  function render(route, params = {}) {
    const handler = routes[route];
    if (handler) {
      handler(params);
    } else {
      const app = document.getElementById('app');
      if (app) app.innerHTML = `<div style="padding:60px;text-align:center"><h2>Page not found: ${route}</h2><button onclick="Router.navigate('auth')" class="btn btn-primary" style="margin-top:16px">Go Home</button></div>`;
    }
  }

  function init() {
    const hash = window.location.hash.replace('#', '');
    const session = Store.Session.get();

    // Show splash first
    render('splash');
  }

  function getCurrentRoute() { return currentRoute; }

  return { register, navigate, render, init, getCurrentRoute };
})();

// Utility helpers used across pages
const Utils = {
  formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  formatTime(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  },
  formatDateTime(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  timeAgo(dateStr) {
    if (!dateStr) return '';
    const now = new Date(), d = new Date(dateStr), diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
    return Utils.formatDate(dateStr);
  },
  greet(name) {
    const h = new Date().getHours();
    const gr = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    return `${gr}, ${name.split(' ')[0]} 👋`;
  },
  getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().substring(0, 2);
  },
  esc(str) {
    const d = document.createElement('div');
    d.appendChild(document.createTextNode(str || ''));
    return d.innerHTML;
  },
  getAge(dob) {
    if (!dob) return '—';
    const now = new Date(), birth = new Date(dob);
    let age = now.getFullYear() - birth.getFullYear();
    if (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) age--;
    return age;
  },
  markdownToHtml(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  },
};
