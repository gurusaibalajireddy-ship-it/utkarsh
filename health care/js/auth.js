/**
 * WE CARE — Authentication Module
 */

const Auth = (() => {

  function hashPassword(pw) {
    return Store.hashPassword(pw);
  }

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validatePassword(pw) {
    return pw.length >= 8;
  }

  // --- SIGNUP ---
  function signupPatient(data) {
    const errors = [];
    if (!data.name || data.name.trim().length < 2) errors.push('Full name must be at least 2 characters.');
    if (!validateEmail(data.email)) errors.push('Invalid email address.');
    if (!data.mobile || data.mobile.trim().length < 8) errors.push('Valid mobile number required.');
    if (!data.dob) errors.push('Date of birth is required.');
    if (!data.gender) errors.push('Gender is required.');
    if (!validatePassword(data.password)) errors.push('Password must be at least 8 characters.');
    if (data.password !== data.confirmPassword) errors.push('Passwords do not match.');
    if (errors.length > 0) return { success: false, errors };

    if (Store.Users.getByEmail(data.email)) {
      return { success: false, errors: ['An account with this email already exists. Please log in.'] };
    }

    const user = Store.Users.add({
      role: 'patient',
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashPassword(data.password),
      mobile: data.mobile.trim(),
      dob: data.dob,
      gender: data.gender,
      address: data.address || '',
      emergencyContact: data.emergencyContact || '',
      avatar: data.name.trim()[0].toUpperCase(),
    });

    Store.AuditLog.add({ action: 'PATIENT_SIGNUP', userId: user.id, email: user.email });
    Store.Timeline.add({ userId: user.id, type: 'registration', title: 'Account Created', description: `${user.name} registered on WE CARE`, icon: '🎉' });

    return { success: true, user };
  }

  function signupDoctor(data) {
    const errors = [];
    if (!data.name || data.name.trim().length < 2) errors.push('Full name must be at least 2 characters.');
    if (!validateEmail(data.email)) errors.push('Invalid email address.');
    if (!data.mobile || data.mobile.trim().length < 8) errors.push('Valid mobile number required.');
    if (!data.specialization) errors.push('Medical specialization is required.');
    if (!data.hospital || data.hospital.trim().length < 2) errors.push('Hospital/Clinic name is required.');
    if (!data.licenseId || data.licenseId.trim().length < 3) errors.push('Doctor ID/License number is required.');
    if (!validatePassword(data.password)) errors.push('Password must be at least 8 characters.');
    if (data.password !== data.confirmPassword) errors.push('Passwords do not match.');
    if (errors.length > 0) return { success: false, errors };

    if (Store.Users.getByEmail(data.email)) {
      return { success: false, errors: ['An account with this email already exists. Please log in.'] };
    }

    const user = Store.Users.add({
      role: 'doctor',
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: hashPassword(data.password),
      mobile: data.mobile.trim(),
      specialization: data.specialization,
      hospital: data.hospital.trim(),
      licenseId: data.licenseId.trim(),
      avatar: data.name.trim()[0].toUpperCase(),
    });

    Store.AuditLog.add({ action: 'DOCTOR_SIGNUP', userId: user.id, email: user.email });

    return { success: true, user };
  }

  // --- LOGIN ---
  function login(email, password, role) {
    if (!email || !password) return { success: false, error: 'Email and password are required.' };
    if (!validateEmail(email)) return { success: false, error: 'Invalid email format.' };

    const user = Store.Users.getByEmail(email);
    if (!user) return { success: false, error: 'Account not found. Please sign up first.' };
    if (user.role !== role) return { success: false, error: `This email is registered as a ${user.role}, not a ${role}. Please use the correct login.` };
    if (user.password !== hashPassword(password)) return { success: false, error: 'Invalid email or password.' };

    Store.Session.set(user);
    Store.AuditLog.add({ action: 'LOGIN', userId: user.id, email: user.email, role: user.role });

    return { success: true, user };
  }

  // --- LOGOUT ---
  function logout() {
    const session = Store.Session.get();
    if (session) {
      Store.AuditLog.add({ action: 'LOGOUT', userId: session.id, email: session.email });
    }
    Store.Session.clear();
  }

  // --- GUARD ---
  function requireAuth(role) {
    const session = Store.Session.get();
    if (!session) { Router.navigate('auth'); return null; }
    if (role && session.role !== role) { Router.navigate('auth'); return null; }
    return session;
  }

  return { signupPatient, signupDoctor, login, logout, requireAuth, validateEmail, validatePassword };
})();
