<<<<<<< HEAD
/**
 * Frontend Application JavaScript
 * Handles API calls, authentication, and UI interactions
 */

// API base URL
const API = '/api';

// ============= AUTHENTICATION HELPERS =============

/**
 * Get JWT token from localStorage
 */
const getToken = () => localStorage.getItem('token');

/**
 * Get user data from localStorage
 */
const getUser = () => {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
};

/**
 * Check if user is logged in
 */
=======
﻿/* EDU ClassRepo - Frontend Application */
const API = '/api';

// Auth Helpers
const getToken = () => localStorage.getItem('token');
const getUser = () => { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null; };
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
const isLoggedIn = () => !!getToken();
const logout = () => { localStorage.clear(); location.href = 'index.html'; };
const checkAuth = () => { if (!isLoggedIn()) { location.href = 'index.html'; return null; } return getUser(); };

<<<<<<< HEAD
/**
 * Logout user and redirect to login
 */
const logout = () => {
    localStorage.clear();
    location.href = 'index.html';
};

/**
 * Check authentication and redirect if not logged in
 */
const checkAuth = () => {
    if (!isLoggedIn()) {
        location.href = 'index.html';
        return null;
    }
    return getUser();
};

// ============= API HELPER =============

/**
 * Make API request with authentication
 */
=======
// API Helper
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
const api = async (endpoint, options = {}) => {
    const config = { ...options, headers: { ...(options.headers || {}) } };
    if (options.body) config.headers['Content-Type'] = 'application/json';
    const token = getToken();
    if (token) config.headers['Authorization'] = 'Bearer ' + token;
    try {
        const res = await fetch(API + endpoint, config);
        return await res.json();
    } catch (err) {
        return { error: 'Connection failed' };
    }
};

<<<<<<< HEAD
// ============= LOGIN PAGE FUNCTIONS =============

let userType = 'student';

/**
 * Set user type (student or admin) for login
 */
=======
// Login Page
let userType = 'student';
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
const setUserType = (type) => {
    userType = type;
    document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    const notice = document.getElementById('admin-notice');
    const footer = document.getElementById('login-footer');
    if (type === 'admin') { notice && notice.classList.remove('hidden'); footer && footer.classList.add('hidden'); }
    else { notice && notice.classList.add('hidden'); footer && footer.classList.remove('hidden'); }
};

/**
 * Show error message on login page
 */
const showError = (msg) => {
    const el = document.getElementById('error-message');
    if (el) { el.innerHTML = '<i class=\"fas fa-exclamation-circle\"></i> ' + msg; el.classList.remove('hidden'); }
};

/**
 * Show signup form
 */
const showSignupForm = () => {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('login-footer').classList.add('hidden');
    document.getElementById('signup-footer').classList.remove('hidden');
    document.getElementById('login-toggle').classList.add('hidden');
    document.getElementById('form-title').textContent = 'Create Account';
    document.getElementById('form-subtitle').textContent = 'Register as a new student';
    document.getElementById('error-message').classList.add('hidden');
    document.querySelector('.login-form-section').scrollTop = 0;
};

/**
 * Show login form
 */
const showLoginForm = () => {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('login-footer').classList.remove('hidden');
    document.getElementById('signup-footer').classList.add('hidden');
    document.getElementById('login-toggle').classList.remove('hidden');
    document.getElementById('form-title').textContent = 'Get Started';
    document.getElementById('form-subtitle').textContent = 'Sign in to access notes and resources';
    document.getElementById('error-message').classList.add('hidden');
};

/**
 * Handle user login
 */
const handleLogin = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
<<<<<<< HEAD
    
    // Validate email domain for students
    if (userType !== 'admin' && !email.endsWith('@eastdelta.edu.bd')) {
        return showError('Use your @eastdelta.edu.bd email');
    }
    
    const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, userType })
    });
    
    if (data.error) return showError(data.error);
    
    // Store token and user data
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect to dashboard
=======
    if (userType !== 'admin' && !email.endsWith('@eastdelta.edu.bd')) return showError('Use your @eastdelta.edu.bd email');
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email: email, password: password, userType: userType }) });
    if (data.error) return showError(data.error);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
    location.href = 'dashboard.html';
};

/**
 * Handle user registration
 */
const handleSignup = async (e) => {
    e.preventDefault();
    const form = {
        name: document.getElementById('signup-name').value.trim(),
        student_id: document.getElementById('signup-studentid').value.trim(),
        gender: document.getElementById('signup-gender').value,
        department: document.getElementById('signup-dept').value,
        semester: document.getElementById('signup-semester') ? document.getElementById('signup-semester').value : '',
        email: document.getElementById('signup-email').value.trim(),
        password: document.getElementById('signup-password').value,
        confirm: document.getElementById('signup-confirm').value
    };
<<<<<<< HEAD
    
    // Validate form data
    if (!form.email.endsWith('@eastdelta.edu.bd')) {
        return showError('Use your @eastdelta.edu.bd email');
    }
    if (form.password.length < 6) {
        return showError('Password must be at least 6 characters');
    }
    if (form.password !== form.confirm) {
        return showError('Passwords do not match');
    }
    
    const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
    });
    
    if (data.error) return showError(data.error);
    
    // Show success message
    const errorEl = document.getElementById('error-message');
    errorEl.classList.remove('hidden', 'alert-error');
    errorEl.classList.add('alert-success');
    errorEl.style.display = 'block';
    errorEl.innerHTML = `<i class="fas fa-check-circle"></i> Account created successfully! You can login now.`;
    
    // Clear form and show login
    document.getElementById('signup-form').reset();
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm').value = '';
    
    setTimeout(() => {
        showLoginForm();
    }, 2000);
=======
    if (!form.email.endsWith('@eastdelta.edu.bd')) return showError('Use your @eastdelta.edu.bd email');
    if (form.password.length < 6) return showError('Password must be at least 6 characters');
    if (form.password !== form.confirm) return showError('Passwords do not match');
    const data = await api('/auth/register', { method: 'POST', body: JSON.stringify(form) });
    if (data.error) return showError(data.error);
    const el = document.getElementById('error-message');
    el.classList.remove('hidden', 'alert-error');
    el.classList.add('alert-success');
    el.innerHTML = '<i class=\"fas fa-check-circle\"></i> Account created! You can login now.';
    document.getElementById('signup-form').reset();
    setTimeout(showLoginForm, 2000);
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
};

/**
 * Toggle password visibility
 */
const togglePassword = (inputId, btn) => {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
};

<<<<<<< HEAD
// ============= COURSE FUNCTIONS =============

/**
 * Load all courses
 */
const loadCourses = async () => await api('/courses');

/**
 * Load user's enrolled courses
 */
const loadEnrollments = async () => await api('/enrollments');

/**
 * Enroll in a course
 */
=======
// Course Functions
const loadCourses = () => api('/courses');
const loadEnrollments = () => api('/enrollments');
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
const enrollCourse = async (id) => {
    const data = await api('/enrollments', { method: 'POST', body: JSON.stringify({ courseId: id }) });
    if (data.error) { alert(data.error); return false; }
    alert('Enrolled successfully!');
    return true;
};
<<<<<<< HEAD

/**
 * Unenroll from a course
 */
=======
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
const unenrollCourse = async (id) => {
    if (!confirm('Unenroll from this course?')) return false;
    await api('/enrollments/' + id, { method: 'DELETE' });
    alert('Unenrolled');
    return true;
};
<<<<<<< HEAD

/**
 * Delete a course (Admin only)
 */
=======
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
const deleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return false;
    await api('/courses/' + id, { method: 'DELETE' });
    alert('Course deleted');
    return true;
};
const createCourse = (code, title, dept, instructor) => api('/courses', { method: 'POST', body: JSON.stringify({ code: code, title: title, department: dept, instructor: instructor }) });

<<<<<<< HEAD
/**
 * Create a new course (Admin only)
 */
const createCourse = async (code, title, dept, instructor) => {
    return await api('/courses', {
        method: 'POST',
        body: JSON.stringify({ code, title, department: dept, instructor })
    });
};

// ============= FILE FUNCTIONS =============

/**
 * Load files for a course
 */
const loadCourseFiles = async (courseId) => await api(`/files/${courseId}`);

/**
 * Load all pending files (Admin only)
 */
const loadPendingFiles = async () => await api('/files/pending/all');

/**
 * Approve a file (Admin only)
 */
const approveFile = async (id) => {
    const data = await api(`/files/${id}/approve`, { method: 'PUT' });
    return !data.error;
};

/**
 * Reject a file (Admin only)
 */
const rejectFile = async (id) => {
    if (!confirm('Reject and delete this file?')) return false;
    const data = await api(`/files/${id}/reject`, { method: 'DELETE' });
    return !data.error;
};

/**
 * Delete a file
 */
const deleteFile = async (id) => {
    if (!confirm('Delete this file?')) return false;
    await api(`/files/${id}`, { method: 'DELETE' });
    return true;
};

/**
 * Get file icon based on file extension
 */
=======
// File Functions
const loadCourseFiles = (courseId) => api('/files/' + courseId);
const loadPendingFiles = () => api('/files/pending/all');
const approveFile = async (id) => !(await api('/files/' + id + '/approve', { method: 'PUT' })).error;
const rejectFile = async (id) => { if (!confirm('Reject this file?')) return false; return !(await api('/files/' + id + '/reject', { method: 'DELETE' })).error; };
const deleteFile = async (id) => { if (!confirm('Delete this file?')) return false; await api('/files/' + id, { method: 'DELETE' }); return true; };
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = { pdf: { class: 'pdf', icon: 'fa-file-pdf' }, doc: { class: 'doc', icon: 'fa-file-word' }, docx: { class: 'doc', icon: 'fa-file-word' } };
    return icons[ext] || { class: 'default', icon: 'fa-file' };
};

<<<<<<< HEAD
// ============= UI HELPERS =============

/**
 * Load user info in header
 */
=======
// UI Helpers
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
const loadHeader = () => {
    const user = getUser();
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    if (nameEl) nameEl.textContent = user ? user.name : 'Guest';
    if (roleEl) roleEl.textContent = user ? (user.role === 'admin' ? 'Admin' : 'Student') : '';
};

/**
 * Load sidebar navigation
 */
const loadSidebar = (active) => {
    const user = getUser();
    const isAdmin = user && user.role === 'admin';
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Check if we're on a course page - if so, highlight 'my-courses'
    const isCousePage = window.location.pathname.includes('course.html');
    const activeItem = isCousePage ? 'my-courses' : active;
    
    sidebar.innerHTML = '<ul class=\"nav-menu\">' +
        '<li><a href=\"dashboard.html\" class=\"' + (activeItem === 'dashboard' ? 'active' : '') + '\"><i class=\"fas fa-th-large\"></i> Dashboard</a></li>' +
        (!isAdmin ? '<li><a href=\"my-courses.html\" class=\"' + (activeItem === 'my-courses' ? 'active' : '') + '\"><i class=\"fas fa-book\"></i> My Courses</a></li>' : '') +
        (isAdmin ? '<li><a href=\"admin.html\" class=\"' + (activeItem === 'admin' ? 'active' : '') + '\"><i class=\"fas fa-tasks\"></i> Pending Approvals</a></li>' : '') +
        '<div class=\"nav-divider\"></div>' +
        '<li><a href=\"settings.html\" class=\"' + (activeItem === 'settings' ? 'active' : '') + '\"><i class=\"fas fa-cog\"></i> Settings</a></li>' +
        '<li><a href=\"#\" onclick=\"logout()\"><i class=\"fas fa-sign-out-alt\" style=\"color:var(--danger)\"></i><span style=\"color:var(--danger)\">Logout</span></a></li>' +
    '</ul>';
};

<<<<<<< HEAD
/**
 * Open modal dialog
 */
const openModal = (id) => document.getElementById(id)?.classList.add('active');

/**
 * Close modal dialog
 */
const closeModal = (id) => document.getElementById(id)?.classList.remove('active');

// Close modal when clicking outside
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
};

/**
 * Toggle mobile sidebar
 */
const toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
};

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    if (sidebar && window.innerWidth <= 900) {
        if (!sidebar.contains(e.target) && !menuToggle?.contains(e.target) && sidebar.classList.contains('active')) {
            sidebar.classList.remove('active');
        }
    }
=======
const openModal = (id) => { const m = document.getElementById(id); if (m) m.classList.add('active'); };
const closeModal = (id) => { const m = document.getElementById(id); if (m) m.classList.remove('active'); };
window.onclick = (e) => { if (e.target.classList.contains('modal')) e.target.classList.remove('active'); };
const toggleSidebar = () => { const s = document.querySelector('.sidebar'); if (s) s.classList.toggle('active'); };
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    const toggle = document.querySelector('.menu-toggle');
    if (sidebar && window.innerWidth < 992 && !sidebar.contains(e.target) && (!toggle || !toggle.contains(e.target)) && sidebar.classList.contains('active')) {
        sidebar.classList.remove('active');
    }
>>>>>>> 3ca82797355ce6fff3b01307edb6553616d88046
});
