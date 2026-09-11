/**
 * WE CARE — Data Store
 * JSON-based MVP data store using localStorage
 * All data operations go through this module
 */

const Store = (() => {
  const KEYS = {
    USERS: 'wecare_users',
    CURRENT_USER: 'wecare_current_user',
    PRESCRIPTIONS: 'wecare_prescriptions',
    NOTIFICATIONS: 'wecare_notifications',
    MESSAGES: 'wecare_messages',
    AI_CHATS: 'wecare_ai_chats',
    APPOINTMENTS: 'wecare_appointments',
    AUDIT_LOG: 'wecare_audit_log',
    TIMELINE: 'wecare_timeline',
    CCTV_STREAMS: 'wecare_cctv_streams',
    DEMO_MODE: 'wecare_demo_mode',
    SUBSCRIPTIONS: 'wecare_subscriptions',
    DOCTOR_PATIENTS: 'wecare_doctor_patients',
    DOCTOR_NOTES: 'wecare_doctor_notes',
    FEEDBACK: 'wecare_feedback',
    PANIC_INCIDENTS: 'wecare_panic_incidents',
    MONITORING_EVENTS: 'wecare_monitoring_events',
  };

  // --- Low-level helpers ---
  function get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  }
  function set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  // --- Initialization with demo data ---
  function init() {
    if (!get(KEYS.USERS)) {
      set(KEYS.USERS, getDefaultUsers());
    }
    if (!get(KEYS.PRESCRIPTIONS)) {
      set(KEYS.PRESCRIPTIONS, getDefaultPrescriptions());
    }
    if (!get(KEYS.NOTIFICATIONS)) {
      set(KEYS.NOTIFICATIONS, []);
    }
    if (!get(KEYS.MESSAGES)) {
      set(KEYS.MESSAGES, getDefaultMessages());
    }
    if (!get(KEYS.AI_CHATS)) {
      set(KEYS.AI_CHATS, getDefaultAIChats());
    }
    if (!get(KEYS.APPOINTMENTS)) {
      set(KEYS.APPOINTMENTS, getDefaultAppointments());
    }
    if (!get(KEYS.AUDIT_LOG)) {
      set(KEYS.AUDIT_LOG, []);
    }
    if (!get(KEYS.TIMELINE)) {
      set(KEYS.TIMELINE, getDefaultTimeline());
    }
    if (!get(KEYS.CCTV_STREAMS)) {
      set(KEYS.CCTV_STREAMS, getDefaultCCTVStreams());
    }
    if (!get(KEYS.SUBSCRIPTIONS)) {
      set(KEYS.SUBSCRIPTIONS, getDefaultSubscriptions());
    }
    if (!get(KEYS.DOCTOR_PATIENTS)) {
      set(KEYS.DOCTOR_PATIENTS, getDefaultDoctorPatients());
    }
    if (!get(KEYS.DOCTOR_NOTES)) {
      set(KEYS.DOCTOR_NOTES, []);
    }
    if (!get(KEYS.FEEDBACK)) {
      set(KEYS.FEEDBACK, getDefaultFeedback());
    }
    if (!get(KEYS.PANIC_INCIDENTS)) {
      set(KEYS.PANIC_INCIDENTS, []);
    }
    if (!get(KEYS.MONITORING_EVENTS)) {
      set(KEYS.MONITORING_EVENTS, []);
    }
  }

  // --- USER OPERATIONS ---
  const Users = {
    getAll() { return get(KEYS.USERS) || []; },
    getById(id) { return Users.getAll().find(u => u.id === id) || null; },
    getByEmail(email) { return Users.getAll().find(u => u.email.toLowerCase() === email.toLowerCase()) || null; },
    add(user) {
      const users = Users.getAll();
      user.id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2,6);
      user.createdAt = new Date().toISOString();
      users.push(user);
      set(KEYS.USERS, users);
      return user;
    },
    update(id, changes) {
      const users = Users.getAll().map(u => u.id === id ? {...u, ...changes} : u);
      set(KEYS.USERS, users);
    },
    getPatients() { return Users.getAll().filter(u => u.role === 'patient'); },
    getDoctors() { return Users.getAll().filter(u => u.role === 'doctor'); },
  };

  // --- SESSION ---
  const Session = {
    get() { return get(KEYS.CURRENT_USER); },
    set(user) { set(KEYS.CURRENT_USER, { id: user.id, role: user.role, name: user.name, email: user.email }); },
    clear() { localStorage.removeItem(KEYS.CURRENT_USER); },
    isLoggedIn() { return !!Session.get(); },
  };

  // --- PRESCRIPTIONS ---
  const Prescriptions = {
    getAll() { return get(KEYS.PRESCRIPTIONS) || []; },
    getById(id) { return Prescriptions.getAll().find(p => p.id === id); },
    getForPatient(patientId) { return Prescriptions.getAll().filter(p => p.patientId === patientId); },
    getByDoctor(doctorId) { return Prescriptions.getAll().filter(p => p.doctorId === doctorId); },
    add(rx) {
      const list = Prescriptions.getAll();
      rx.id = 'rx_' + Date.now();
      rx.createdAt = new Date().toISOString();
      rx.status = 'active';
      rx.isNew = true;
      list.push(rx);
      set(KEYS.PRESCRIPTIONS, list);
      return rx;
    },
    update(id, changes) {
      const list = Prescriptions.getAll().map(p => p.id === id ? {...p, ...changes} : p);
      set(KEYS.PRESCRIPTIONS, list);
    },
    markSeen(patientId) {
      const list = Prescriptions.getAll().map(p =>
        p.patientId === patientId ? {...p, isNew: false} : p
      );
      set(KEYS.PRESCRIPTIONS, list);
    },
  };

  // --- NOTIFICATIONS ---
  const Notifications = {
    getAll() { return get(KEYS.NOTIFICATIONS) || []; },
    getForUser(userId) { return Notifications.getAll().filter(n => n.userId === userId).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)); },
    getUnreadCount(userId) { return Notifications.getForUser(userId).filter(n => !n.read).length; },
    add(notif) {
      const list = Notifications.getAll();
      notif.id = 'notif_' + Date.now();
      notif.createdAt = new Date().toISOString();
      notif.read = false;
      list.push(notif);
      set(KEYS.NOTIFICATIONS, list);
      return notif;
    },
    markRead(id) {
      const list = Notifications.getAll().map(n => n.id === id ? {...n, read: true} : n);
      set(KEYS.NOTIFICATIONS, list);
    },
    markAllRead(userId) {
      const list = Notifications.getAll().map(n => n.userId === userId ? {...n, read: true} : n);
      set(KEYS.NOTIFICATIONS, list);
    },
  };

  // --- MESSAGES ---
  const Messages = {
    getAll() { return get(KEYS.MESSAGES) || []; },
    getThread(userId1, userId2) {
      const all = Messages.getAll();
      return all.filter(m =>
        (m.fromId === userId1 && m.toId === userId2) ||
        (m.fromId === userId2 && m.toId === userId1)
      ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    },
    getInbox(userId) {
      const all = Messages.getAll();
      const threads = {};
      all.filter(m => m.fromId === userId || m.toId === userId).forEach(m => {
        const otherId = m.fromId === userId ? m.toId : m.fromId;
        if (!threads[otherId] || new Date(m.createdAt) > new Date(threads[otherId].createdAt)) {
          threads[otherId] = m;
        }
      });
      return Object.entries(threads).map(([otherId, lastMsg]) => ({ otherId, lastMsg }))
        .sort((a, b) => new Date(b.lastMsg.createdAt) - new Date(a.lastMsg.createdAt));
    },
    send(msg) {
      const list = Messages.getAll();
      msg.id = 'msg_' + Date.now();
      msg.createdAt = new Date().toISOString();
      msg.read = false;
      list.push(msg);
      set(KEYS.MESSAGES, list);
      return msg;
    },
    markRead(fromId, toId) {
      const list = Messages.getAll().map(m =>
        m.fromId === fromId && m.toId === toId ? {...m, read: true} : m
      );
      set(KEYS.MESSAGES, list);
    },
    getUnreadCount(userId) {
      return Messages.getAll().filter(m => m.toId === userId && !m.read).length;
    },
  };

  // --- AI CHATS ---
  const AIChats = {
    getAll() { return get(KEYS.AI_CHATS) || []; },
    getForUser(userId) { return AIChats.getAll().filter(c => c.userId === userId).sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)); },
    getAuthorizedForDoctor(patientId) {
      return AIChats.getAll().filter(c => c.userId === patientId && c.sharedWithDoctor);
    },
    createSession(userId, firstMsg) {
      const sessions = AIChats.getAll();
      const session = {
        id: 'chat_' + Date.now(),
        userId,
        topic: firstMsg.substring(0, 50),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        language: 'en',
        sharedWithDoctor: true,
      };
      sessions.push(session);
      set(KEYS.AI_CHATS, sessions);
      return session;
    },
    addMessage(sessionId, message) {
      const sessions = AIChats.getAll().map(s => {
        if (s.id !== sessionId) return s;
        message.id = 'cmsg_' + Date.now();
        message.timestamp = new Date().toISOString();
        return { ...s, messages: [...s.messages, message], updatedAt: new Date().toISOString() };
      });
      set(KEYS.AI_CHATS, sessions);
    },
    getSession(id) { return AIChats.getAll().find(s => s.id === id); },
  };

  // --- APPOINTMENTS ---
  const Appointments = {
    getAll() { return get(KEYS.APPOINTMENTS) || []; },
    getForPatient(patientId) { return Appointments.getAll().filter(a => a.patientId === patientId); },
    getForDoctor(doctorId) { return Appointments.getAll().filter(a => a.doctorId === doctorId); },
    add(appt) {
      const list = Appointments.getAll();
      appt.id = 'appt_' + Date.now();
      appt.createdAt = new Date().toISOString();
      list.push(appt);
      set(KEYS.APPOINTMENTS, list);
      return appt;
    },
    update(id, changes) {
      const list = Appointments.getAll().map(a => a.id === id ? {...a, ...changes} : a);
      set(KEYS.APPOINTMENTS, list);
    },
  };

  // --- AUDIT LOG ---
  const AuditLog = {
    getAll() { return get(KEYS.AUDIT_LOG) || []; },
    add(entry) {
      const list = AuditLog.getAll();
      list.unshift({
        id: 'log_' + Date.now(),
        timestamp: new Date().toISOString(),
        ...entry,
      });
      if (list.length > 500) list.pop(); // keep last 500
      set(KEYS.AUDIT_LOG, list);
    },
  };

  // --- TIMELINE ---
  const Timeline = {
    getAll() { return get(KEYS.TIMELINE) || []; },
    getForUser(userId) { return Timeline.getAll().filter(e => e.userId === userId).sort((a,b) => new Date(b.date) - new Date(a.date)); },
    add(event) {
      const list = Timeline.getAll();
      list.unshift({
        id: 'tl_' + Date.now(),
        date: new Date().toISOString(),
        ...event,
      });
      set(KEYS.TIMELINE, list);
    },
  };

  // --- CCTV ---
  const CCTV = {
    getAll() { return get(KEYS.CCTV_STREAMS) || []; },
    update(id, changes) {
      const list = CCTV.getAll().map(c => c.id === id ? {...c, ...changes} : c);
      set(KEYS.CCTV_STREAMS, list);
    },
    add(stream) {
      const list = CCTV.getAll();
      stream.id = 'cctv_' + Date.now();
      list.push(stream);
      set(KEYS.CCTV_STREAMS, list);
      return stream;
    },
  };

  // --- SUBSCRIPTIONS ---
  const Subscriptions = {
    getAll() { return get(KEYS.SUBSCRIPTIONS) || []; },
    getForUser(userId) { return Subscriptions.getAll().find(s => s.userId === userId); },
    set(sub) {
      const list = Subscriptions.getAll().filter(s => s.userId !== sub.userId);
      sub.id = 'sub_' + Date.now();
      sub.activatedAt = new Date().toISOString();
      list.push(sub);
      set(KEYS.SUBSCRIPTIONS, list);
      return sub;
    },
  };

  // --- DOCTOR-PATIENT relationships ---
  const DoctorPatients = {
    getAll() { return get(KEYS.DOCTOR_PATIENTS) || []; },
    getPatientsForDoctor(doctorId) {
      return DoctorPatients.getAll().filter(dp => dp.doctorId === doctorId).map(dp => dp.patientId);
    },
    getDoctorsForPatient(patientId) {
      return DoctorPatients.getAll().filter(dp => dp.patientId === patientId).map(dp => dp.doctorId);
    },
    isAssigned(doctorId, patientId) {
      return DoctorPatients.getAll().some(dp => dp.doctorId === doctorId && dp.patientId === patientId);
    },
    add(doctorId, patientId) {
      const list = DoctorPatients.getAll();
      if (!DoctorPatients.isAssigned(doctorId, patientId)) {
        list.push({ doctorId, patientId, assignedAt: new Date().toISOString() });
        set(KEYS.DOCTOR_PATIENTS, list);
      }
    },
  };

  // --- DOCTOR NOTES ---
  const DoctorNotes = {
    getAll() { return get(KEYS.DOCTOR_NOTES) || []; },
    getForPatient(doctorId, patientId) {
      return DoctorNotes.getAll().filter(n => n.doctorId === doctorId && n.patientId === patientId)
        .sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    add(note) {
      const list = DoctorNotes.getAll();
      note.id = 'note_' + Date.now();
      note.createdAt = new Date().toISOString();
      list.push(note);
      set(KEYS.DOCTOR_NOTES, list);
      return note;
    },
  };

  // --- FEEDBACK ---
  const Feedback = {
    getAll() { return get(KEYS.FEEDBACK) || []; },
    getByDoctor(doctorId) {
      return Feedback.getAll().filter(f => f.doctorId === doctorId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    add(feedback) {
      const list = Feedback.getAll();
      feedback.id = 'fb_' + Date.now();
      feedback.createdAt = new Date().toISOString();
      list.push(feedback);
      set(KEYS.FEEDBACK, list);
      return feedback;
    },
  };

  // --- PANIC INCIDENTS ---
  const PanicIncidents = {
    getAll() { return get(KEYS.PANIC_INCIDENTS) || []; },
    getActive() { return PanicIncidents.getAll().filter(i => i.status === 'ACTIVE'); },
    add(incident) {
      const list = PanicIncidents.getAll();
      incident.id = 'panic_' + Date.now();
      incident.status = 'ACTIVE';
      incident.createdAt = new Date().toISOString();
      list.push(incident);
      set(KEYS.PANIC_INCIDENTS, list);
      return incident;
    },
    updateStatus(id, newStatus, byUserId) {
      const list = PanicIncidents.getAll();
      const inc = list.find(i => i.id === id);
      if (inc) {
        inc.status = newStatus;
        if (newStatus === 'ACKNOWLEDGED') {
          inc.acknowledgedAt = new Date().toISOString();
          inc.acknowledgedBy = byUserId;
        } else if (newStatus === 'RESOLVED') {
          inc.resolvedAt = new Date().toISOString();
          inc.resolvedBy = byUserId;
        }
        set(KEYS.PANIC_INCIDENTS, list);
      }
    }
  };

  // --- MONITORING EVENTS ---
  const MonitoringEvents = {
    getAll() { return get(KEYS.MONITORING_EVENTS) || []; },
    add(event) {
      const list = MonitoringEvents.getAll();
      event.id = 'evt_' + Date.now();
      event.createdAt = new Date().toISOString();
      list.push(event);
      set(KEYS.MONITORING_EVENTS, list);
      return event;
    }
  };

  // --- DEMO MODE ---
  const Demo = {
    isEnabled() { return get(KEYS.DEMO_MODE) === true; },
    enable() { set(KEYS.DEMO_MODE, true); },
    disable() { set(KEYS.DEMO_MODE, false); },
  };

  // ===================== DEFAULT DATA =====================

  function hashPassword(pw) {
    // Simple hash for MVP (in production use bcrypt via backend)
    let hash = 0;
    for (let i = 0; i < pw.length; i++) { hash = ((hash << 5) - hash) + pw.charCodeAt(i); hash |= 0; }
    return 'hash_' + Math.abs(hash).toString(16) + '_' + pw.length;
  }

  function getDefaultUsers() {
    return [
      {
        id: 'patient_demo_001',
        role: 'patient',
        name: 'Priya Sharma',
        email: 'priya@wecare.demo',
        password: hashPassword('Demo@1234'),
        mobile: '+91-9876543210',
        dob: '1995-03-15',
        gender: 'female',
        address: '123, Jubilee Hills, Hyderabad',
        emergencyContact: '+91-9876543211',
        guardianName: 'Ramesh Sharma',
        guardianPhone: '+91-9988776655',
        avatar: 'P',
        subscriptionPlan: 'premium',
        doctorAssigned: 'doctor_demo_001',
        createdAt: '2026-01-15T10:00:00.000Z',
      },
      {
        id: 'doctor_demo_001',
        role: 'doctor',
        name: 'Dr. Arjun Mehta',
        email: 'arjun@wecare.demo',
        password: hashPassword('Demo@1234'),
        mobile: '+91-9876500001',
        specialization: 'General Physician',
        hospital: 'Apollo Hospitals, Bengaluru',
        licenseId: 'KA-MED-2019-0042',
        avatar: 'A',
        createdAt: '2026-01-10T09:00:00.000Z',
      },
      {
        id: 'patient_demo_002',
        role: 'patient',
        name: 'Rahul Nair',
        email: 'rahul@wecare.demo',
        password: hashPassword('Demo@1234'),
        mobile: '+91-9876543212',
        dob: '1988-07-22',
        gender: 'male',
        address: '45, Koramangala, Bengaluru',
        emergencyContact: '+91-9876543213',
        guardianName: 'Anita Nair',
        guardianPhone: '+91-9988776644',
        avatar: 'R',
        subscriptionPlan: 'basic',
        doctorAssigned: 'doctor_demo_001',
        createdAt: '2026-02-01T11:00:00.000Z',
      },
    ];
  }

  function getDefaultPrescriptions() {
    return [
      {
        id: 'rx_demo_001',
        patientId: 'patient_demo_001',
        doctorId: 'doctor_demo_001',
        doctorName: 'Dr. Arjun Mehta',
        medicines: [
          { name: 'Azithromycin', dosage: '500mg', frequency: 'Once daily', time: '08:00 AM', instructions: 'Take with food', status: 'pending' },
          { name: 'Cetirizine', dosage: '10mg', frequency: 'Once daily', time: '01:00 PM', instructions: 'Take after lunch', status: 'pending' },
          { name: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily', time: '08:00 PM', instructions: 'Take 30 mins before dinner', status: 'pending' },
        ],
        startDate: '2026-09-10',
        endDate: '2026-09-20',
        notes: 'Rest adequately. Drink plenty of fluids. Follow-up in 10 days.',
        status: 'active',
        isNew: false,
        createdAt: '2026-09-08T10:00:00.000Z',
      },
      {
        id: 'rx_demo_002',
        patientId: 'patient_demo_002',
        doctorId: 'doctor_demo_001',
        doctorName: 'Dr. Arjun Mehta',
        medicines: [
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', time: '08:00 AM', instructions: 'Take with breakfast', status: 'taken' },
          { name: 'Atorvastatin', dosage: '10mg', frequency: 'Once at night', time: '09:00 PM', instructions: 'Take at bedtime', status: 'pending' },
        ],
        startDate: '2026-09-01',
        endDate: '2026-09-30',
        notes: 'Monitor blood sugar regularly. Avoid refined sugar.',
        status: 'active',
        isNew: false,
        createdAt: '2026-09-01T09:00:00.000Z',
      },
    ];
  }

  function getDefaultMessages() {
    return [
      {
        id: 'msg_demo_001',
        fromId: 'doctor_demo_001',
        toId: 'patient_demo_001',
        fromName: 'Dr. Arjun Mehta',
        toName: 'Priya Sharma',
        text: 'Hello Priya, how are you feeling today? Please make sure to take your medications on time.',
        createdAt: '2026-09-09T10:30:00.000Z',
        read: true,
      },
      {
        id: 'msg_demo_002',
        fromId: 'patient_demo_001',
        toId: 'doctor_demo_001',
        fromName: 'Priya Sharma',
        toName: 'Dr. Arjun Mehta',
        text: 'Thank you Doctor. I am feeling a bit better. The medicine is helping.',
        createdAt: '2026-09-09T11:00:00.000Z',
        read: true,
      },
      {
        id: 'msg_demo_003',
        fromId: 'doctor_demo_001',
        toId: 'patient_demo_001',
        fromName: 'Dr. Arjun Mehta',
        toName: 'Priya Sharma',
        text: 'Great to hear! Please come for a follow-up on September 20th. I will add a reminder.',
        createdAt: '2026-09-09T11:15:00.000Z',
        read: false,
      },
    ];
  }

  function getDefaultAIChats() {
    return [
      {
        id: 'chat_demo_001',
        userId: 'patient_demo_001',
        topic: 'Medication schedule question',
        messages: [
          { id: 'cm1', role: 'user', text: 'When should I take Azithromycin?', timestamp: '2026-09-09T09:00:00.000Z' },
          { id: 'cm2', role: 'ai', text: 'Based on your prescription, Azithromycin 500mg should be taken once daily at 8:00 AM with food. Please ensure you complete the full course as prescribed by Dr. Arjun Mehta, even if you feel better.\n\n⚠️ Always follow your doctor\'s specific instructions.', timestamp: '2026-09-09T09:00:05.000Z' },
          { id: 'cm3', role: 'user', text: 'What are the side effects?', timestamp: '2026-09-09T09:01:00.000Z' },
          { id: 'cm4', role: 'ai', text: 'Common side effects of Azithromycin may include:\n• Nausea or stomach upset\n• Diarrhea\n• Mild stomach pain\n• Headache\n\nSerious side effects are rare. If you experience severe rash, difficulty breathing, or irregular heartbeat, contact your doctor immediately or call emergency services.\n\n⚠️ This is general information only. Your doctor is the best source for medical advice.', timestamp: '2026-09-09T09:01:05.000Z' },
        ],
        createdAt: '2026-09-09T09:00:00.000Z',
        updatedAt: '2026-09-09T09:01:05.000Z',
        language: 'en',
        sharedWithDoctor: true,
      },
    ];
  }

  function getDefaultAppointments() {
    return [
      {
        id: 'appt_demo_001',
        patientId: 'patient_demo_001',
        doctorId: 'doctor_demo_001',
        doctorName: 'Dr. Arjun Mehta',
        patientName: 'Priya Sharma',
        date: '2026-09-20',
        time: '10:00 AM',
        type: 'Follow-up',
        status: 'confirmed',
        notes: 'Post-prescription follow-up. Check recovery progress.',
        createdAt: '2026-09-09T11:15:00.000Z',
      },
      {
        id: 'appt_demo_002',
        patientId: 'patient_demo_002',
        doctorId: 'doctor_demo_001',
        doctorName: 'Dr. Arjun Mehta',
        patientName: 'Rahul Nair',
        date: '2026-09-15',
        time: '02:00 PM',
        type: 'Diabetes Review',
        status: 'confirmed',
        notes: 'Monthly diabetes management review.',
        createdAt: '2026-09-01T09:00:00.000Z',
      },
      {
        id: 'appt_demo_004',
        patientId: 'patient_demo_001',
        doctorId: 'doctor_demo_001',
        patientName: 'Priya Sharma',
        doctorName: 'Dr. Arjun Mehta',
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
        time: '02:00 PM',
        type: 'General Checkup',
        status: 'confirmed',
        reminderSent: false,
        createdAt: '2026-09-08T08:00:00.000Z',
      }
    ];
  }

  function getDefaultFeedback() {
    return [
      {
        id: 'fb_demo_001',
        patientId: 'patient_demo_001',
        doctorId: 'doctor_demo_001',
        patientName: 'Priya Sharma',
        rating: 5,
        comment: 'Dr. Arjun is incredibly attentive and patient. He explained my medications very clearly.',
        createdAt: '2026-09-01T10:00:00.000Z'
      }
    ];
  }

  function getDefaultTimeline() {
    return [
      { id: 'tl1', userId: 'patient_demo_001', type: 'registration', title: 'Account Created', description: 'Priya Sharma registered on WE CARE', date: '2026-01-15T10:00:00.000Z', icon: '🎉' },
      { id: 'tl2', userId: 'patient_demo_001', type: 'doctor', title: 'Doctor Assigned', description: 'Dr. Arjun Mehta assigned as your physician', date: '2026-01-16T09:00:00.000Z', icon: '👨‍⚕️' },
      { id: 'tl3', userId: 'patient_demo_001', type: 'subscription', title: 'Care Plus Plan Activated', description: 'Subscribed to Care Plus plan', date: '2026-01-15T10:30:00.000Z', icon: '✨' },
      { id: 'tl4', userId: 'patient_demo_001', type: 'appointment', title: 'First Consultation', description: 'Initial consultation with Dr. Arjun Mehta', date: '2026-09-08T10:00:00.000Z', icon: '🏥' },
      { id: 'tl5', userId: 'patient_demo_001', type: 'prescription', title: 'Prescription Added', description: 'Dr. Arjun Mehta prescribed Azithromycin, Cetirizine, Pantoprazole', date: '2026-09-08T10:30:00.000Z', icon: '💊' },
      { id: 'tl6', userId: 'patient_demo_001', type: 'ai', title: 'AI Conversation', description: 'Asked We Care AI about medication schedule', date: '2026-09-09T09:00:00.000Z', icon: '🤖' },
    ];
  }

  function getDefaultCCTVStreams() {
    return [
      { id: 'cctv_01', name: 'Reception', url: '', status: 'offline', location: 'Main Entrance' },
      { id: 'cctv_02', name: 'Waiting Area', url: '', status: 'offline', location: 'Ground Floor' },
      { id: 'cctv_03', name: 'Corridor A', url: '', status: 'offline', location: 'First Floor' },
      { id: 'cctv_04', name: 'Emergency Area', url: '', status: 'offline', location: 'Ground Floor' },
      { id: 'cctv_05', name: 'Consultation Room 1', url: '', status: 'offline', location: 'First Floor' },
      { id: 'cctv_06', name: 'Entrance Gate', url: '', status: 'offline', location: 'Exterior' },
    ];
  }

  function getDefaultSubscriptions() {
    return [
      { userId: 'patient_demo_001', plan: 'care_plus', planName: 'Care Plus', activatedAt: '2026-01-15T10:30:00.000Z' },
      { userId: 'patient_demo_002', plan: 'basic', planName: 'Basic Care', activatedAt: '2026-02-01T11:30:00.000Z' },
    ];
  }

  function getDefaultDoctorPatients() {
    return [
      { doctorId: 'doctor_demo_001', patientId: 'patient_demo_001', assignedAt: '2026-01-16T09:00:00.000Z' },
      { doctorId: 'doctor_demo_001', patientId: 'patient_demo_002', assignedAt: '2026-02-01T11:00:00.000Z' },
    ];
  }

  function getDefaultFeedback() {
    return [
      {
        id: 'fb_demo_001',
        patientId: 'patient_demo_001',
        doctorId: 'doctor_demo_001',
        patientName: 'Priya Sharma',
        rating: 5,
        comment: 'Dr. Arjun is very attentive and explains everything clearly. Highly recommended!',
        createdAt: '2026-08-15T10:00:00.000Z'
      }
    ];
  }

  // Export public API
  return {
    init,
    hashPassword,
    Users,
    Session,
    Prescriptions,
    Notifications,
    Messages,
    AIChats,
    Appointments,
    AuditLog,
    Timeline,
    CCTV,
    Subscriptions,
    DoctorPatients,
    DoctorNotes,
    Feedback,
    PanicIncidents,
    MonitoringEvents,
    Demo,
    KEYS,
  };
})();
