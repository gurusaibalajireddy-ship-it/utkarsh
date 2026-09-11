/**
 * WE CARE — Subscription Selection Page
 */

Router.register('subscription', () => {
  const session = Auth.requireAuth('patient');
  if (!session) return;

  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="auth-page">
      <div style="max-width:900px;width:100%;padding:40px 20px;margin:auto;position:relative;z-index:1">
        <div style="text-align:center;margin-bottom:40px">
          <img src="logo.jpg" alt="WE CARE" style="width:60px;height:60px;border-radius:16px;margin-bottom:16px" onerror="this.style.display='none'" />
          <h1 style="font-family:'Outfit',sans-serif;font-size:34px;font-weight:900;color:#fff">Choose Your Care Plan</h1>
          <p style="color:rgba(255,255,255,0.65);margin-top:8px;font-size:16px">Start your healthcare journey with WE CARE</p>
          <div class="demo-mode-indicator" style="margin:12px auto;width:fit-content">🎯 Mock Payment — Hackathon Demo</div>
        </div>

        <div class="grid-3" id="sub-cards" style="margin-bottom:32px">
          ${renderSubCard('basic', 'Basic Care', '₹499', '/month', 'Essential digital healthcare', [
            'We Care AI Health Assistant',
            'Prescription Tracking',
            'Daily Medication Schedule',
            'Doctor Communication',
            'Health Timeline',
            'Appointment Management',
          ], false)}
          ${renderSubCard('care_plus', 'Care Plus', '₹999', '/month', 'Advanced features for better care', [
            'Everything in Basic Care',
            'Voice AI Assistant 🎙️',
            'Multi-language Translation',
            'Priority Doctor Communication',
            'Enhanced Health Timeline',
            'Prescription Alert Notifications',
          ], true)}
          ${renderSubCard('family', 'Family Care', '₹1,499', '/month', 'Complete care for your whole family', [
            'Everything in Care Plus',
            'Up to 5 Family Profiles',
            'Family Health Dashboard',
            'Shared Prescription View',
            'Family Appointment Manager',
            'Dedicated Care Support',
          ], false)}
        </div>

        <div style="text-align:center">
          <p style="color:rgba(255,255,255,0.5);font-size:13px;margin-bottom:16px">🔒 This is a mock payment flow for the hackathon demo. No real payment is processed.</p>
          <button class="btn btn-ghost" style="color:rgba(255,255,255,0.5);font-size:13px" onclick="Router.navigate('patient-dashboard')">Skip for now →</button>
        </div>
      </div>
    </div>
  `;
});

function renderSubCard(plan, name, price, period, desc, features, popular) {
  return `
    <div class="sub-card ${popular ? 'popular' : ''}" id="sub-${plan}" onclick="SubscriptionPage.select('${plan}','${name}')">
      ${popular ? '<div class="sub-popular-badge">⭐ Most Popular</div>' : ''}
      <div class="sub-plan-name">${name}</div>
      <div class="sub-price">${price}<span>${period}</span></div>
      <div class="sub-desc">${desc}</div>
      <ul class="sub-features">
        ${features.map(f => `<li><span class="check">✓</span> ${f}</li>`).join('')}
      </ul>
      <button class="btn btn-primary btn-full" style="margin-top:24px" onclick="event.stopPropagation();SubscriptionPage.select('${plan}','${name}')">
        ${popular ? '⭐ Select Care Plus' : 'Select Plan'}
      </button>
    </div>
  `;
}

const SubscriptionPage = {
  select(plan, name) {
    const session = Store.Session.get();
    if (!session) return;

    // Mark all cards
    document.querySelectorAll('.sub-card').forEach(c => c.classList.remove('selected'));
    const card = document.getElementById(`sub-${plan}`);
    if (card) card.classList.add('selected');

    // Show mock payment
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>💳 Complete Subscription</h3>
          <span class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</span>
        </div>
        <div class="modal-body">
          <div style="background:var(--teal-50);border:1px solid var(--teal-200);border-radius:var(--radius);padding:16px;margin-bottom:20px;text-align:center">
            <div style="font-size:20px;font-weight:900;color:var(--primary);font-family:'Outfit',sans-serif">${name}</div>
            <div style="font-size:13px;color:var(--text-muted);margin-top:4px">Plan selected</div>
          </div>
          <div class="demo-mode-indicator" style="margin-bottom:16px;width:fit-content">🎯 MOCK PAYMENT — HACKATHON DEMO</div>
          <p style="font-size:14px;color:var(--text-secondary);margin-bottom:20px">This is a simulated payment for the hackathon demonstration. In production, this would connect to a payment gateway (Razorpay/Stripe).</p>
          <div style="display:flex;align-items:center;gap:10px;font-size:22px;color:var(--success);font-weight:700">
            <span>✅</span> Subscription will be activated instantly
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="SubscriptionPage.activate('${plan}','${name}')">✅ Activate Plan</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
  },

  activate(plan, name) {
    const session = Store.Session.get();
    Store.Subscriptions.set({ userId: session.id, plan, planName: name });
    Store.Users.update(session.id, { subscriptionPlan: plan });
    Store.Timeline.add({ userId: session.id, type: 'subscription', title: `${name} Plan Activated`, description: `Subscribed to ${name}`, icon: '✨' });
    Store.AuditLog.add({ action: 'SUBSCRIPTION_ACTIVATED', userId: session.id, plan });

    document.querySelector('.modal-overlay')?.remove();
    NotifService.toast('success', '🎉 Subscription Active!', `${name} plan activated. Welcome to WE CARE!`);

    setTimeout(() => Router.navigate('patient-dashboard'), 1000);
  },
};
