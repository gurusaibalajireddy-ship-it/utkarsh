/**
 * WE CARE — Main Application Entry Point
 * Bootstraps the application, loads data, and handles initial routing.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize the local storage database
  Store.init();

  // 2. Add API Key Prompt mechanism for Groq
  initApiKeyPrompt();

  // 3. Start background loops
  checkAppointmentReminders();

  // 4. Start routing
  Router.init();
});

// Allow user to enter Groq API key via a hidden UI trigger (e.g., clicking a logo)
// or check URL params (e.g., ?groq_key=xyz) for the hackathon
function initApiKeyPrompt() {
  const urlParams = new URLSearchParams(window.location.search);
  const key = urlParams.get('groq_key');
  if (key) {
    window.GROQ_API_KEY = key;
    console.log("Groq API Key loaded from URL");
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    NotifService.toast('success', 'API Key Loaded', 'Groq AI is now active');
  }

  // Global helper for the console
  window.setGroqKey = function(key) {
    window.GROQ_API_KEY = key;
    console.log("Groq API Key set manually.");
    NotifService.toast('success', 'API Key Set', 'AI features will now use live models');
  };
}

// Background polling for appointment reminders (2-3 days prior)
function checkAppointmentReminders() {
  const check = () => {
    const session = Store.Session.get();
    if (!session || session.role !== 'patient') return;
    
    const appointments = Store.Appointments.getAll().filter(a => a.patientId === session.id && !a.reminderSent && a.status === 'confirmed');
    const now = new Date();
    
    appointments.forEach(appt => {
      const apptDate = new Date(appt.date);
      // Calculate diff in days
      const diffTime = apptDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // If 2 or 3 days away, trigger a reminder
      if (diffDays === 2 || diffDays === 3) {
        Store.Notifications.add({
          userId: session.id,
          type: 'appointment',
          title: 'Upcoming Appointment Reminder',
          message: `Reminder: You have an upcoming ${appt.type} with ${appt.doctorName} on ${Utils.formatDate(appt.date)} at ${appt.time}.`
        });
        
        Store.Appointments.update(appt.id, { reminderSent: true });
        NotifService.updateNotifBadge(session.id);
      }
    });
  };
  
  check(); // Run immediately on startup
  setInterval(check, 1000 * 60 * 60); // Check every hour
}
