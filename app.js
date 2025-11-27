/*
 * ========================================
 * EDU CLASSREPO - FRONTEND JAVASCRIPT
 * All API calls and UI functions
 * ========================================
 */

const API = 'http://localhost:3000/api';

/*
 * ========================================
 * AUTH FUNCTIONS
 * ========================================
 */

// Get stored token
function getToken() {
    return localStorage.getItem('token');
}

// Get stored user
function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
}

// Check if logged in
function isLoggedIn() {
    return !!getToken();
}

// Logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// Protect page - redirect if not logged in
function checkAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return null;
    }
    return getUser();
}

/*
 * ========================================
 * API HELPER
 * ========================================
 */

// Make API calls
async function api(endpoint, options = {}) {
    const token = getToken();
    
    const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options
    };
    
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const res = await fetch(`${API}${endpoint}`, config);
        return await res.json();
    } catch (err) {
        console.error('API Error:', err);
        return { error: 'Connection failed' };
    }
}

/*
 * ========================================
 * LOGIN PAGE FUNCTIONS
 * ========================================
 */

let userType = 'student';

// Toggle between student and admin login
function setUserType(type) {
    userType = type;
    
    // Update button styles
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide admin notice
    const notice = document.getElementById('admin-notice');
    const footer = document.getElementById('login-footer');
    
    if (type === 'admin') {
        notice?.classList.remove('hidden');
        footer?.classList.add('hidden');
    } else {
        notice?.classList.add('hidden');
        footer?.classList.remove('hidden');
    }
}

// Show error message
function showError(msg) {
    const el = document.getElementById('error-message');
    if (el) {
        el.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${msg}`;
        el.classList.remove('hidden');
    }
}

// Show signup form
function showSignupForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.remove('hidden');
    document.getElementById('login-footer').classList.add('hidden');
    document.getElementById('signup-footer').classList.remove('hidden');
    document.getElementById('login-toggle').classList.add('hidden');
    document.getElementById('form-title').textContent = 'Create Account';
    document.getElementById('form-subtitle').textContent = 'Register as a new student';
    document.getElementById('error-message').classList.add('hidden');
}

// Show login form
function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('forgot-form')?.classList.add('hidden');
    document.getElementById('login-footer').classList.remove('hidden');
    document.getElementById('signup-footer').classList.add('hidden');
    document.getElementById('login-toggle').classList.remove('hidden');
    document.getElementById('form-title').textContent = 'Welcome Back';
    document.getElementById('form-subtitle').textContent = 'Sign in to access your courses';
    document.getElementById('error-message').classList.add('hidden');
}

// Show forgot password form
function showForgotPassword() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('signup-form').classList.add('hidden');
    document.getElementById('forgot-form')?.classList.remove('hidden');
    document.getElementById('login-footer').classList.add('hidden');
    document.getElementById('signup-footer').classList.add('hidden');
    document.getElementById('login-toggle').classList.add('hidden');
    document.getElementById('form-title').textContent = 'Reset Password';
    document.getElementById('form-subtitle').textContent = 'Enter your email to receive reset instructions';
    document.getElementById('error-message').classList.add('hidden');
}

// Handle forgot password (placeholder - needs email backend)
function handleForgotPassword(e) {
    e.preventDefault();
    alert('Password reset feature requires email service setup. Contact admin for assistance.');
}

// Handle reset password (placeholder)
function handleResetPassword(e) {
    e.preventDefault();
    alert('Password reset feature requires email service setup.');
}

// Handle login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    // Validate email
    if (!email.endsWith('@eastdelta.edu.bd')) {
        return showError('Use your @eastdelta.edu.bd email');
    }
    
    // Call API
    const data = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, userType })
    });
    
    if (data.error) {
        return showError(data.error);
    }
    
    // Save session
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    // Redirect
    window.location.href = 'dashboard.html';
}

// Handle signup
async function handleSignup(e) {
    e.preventDefault();
    
    const form = {
        name: document.getElementById('signup-name').value.trim(),
        student_id: document.getElementById('signup-studentid').value.trim(),
        gender: document.getElementById('signup-gender').value,
        department: document.getElementById('signup-dept').value,
        semester: document.getElementById('signup-semester')?.value || '',
        email: document.getElementById('signup-email').value.trim(),
        password: document.getElementById('signup-password').value,
        confirm: document.getElementById('signup-confirm').value
    };
    
    // Validations
    if (!form.email.endsWith('@eastdelta.edu.bd')) {
        return showError('Use your @eastdelta.edu.bd email');
    }
    if (form.password.length < 6) {
        return showError('Password must be at least 6 characters');
    }
    if (form.password !== form.confirm) {
        return showError('Passwords do not match');
    }
    
    // Call API
    const data = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form)
    });
    
    if (data.error) {
        return showError(data.error);
    }
    
    alert('Account created! Please login.');
    showLoginForm();
}

/*
 * ========================================
 * COURSE FUNCTIONS
 * ========================================
 */

// Load all courses
async function loadCourses() {
    return await api('/courses');
}

// Load user's enrolled courses
async function loadEnrollments() {
    return await api('/enrollments');
}

// Enroll in a course
async function enrollCourse(courseId) {
    const data = await api('/enrollments', {
        method: 'POST',
        body: JSON.stringify({ courseId })
    });
    
    if (data.error) {
        alert(data.error);
        return false;
    }
    
    alert('Enrolled successfully!');
    return true;
}

// Unenroll from a course
async function unenrollCourse(courseId) {
    if (!confirm('Unenroll from this course?')) return false;
    
    await api(`/enrollments/${courseId}`, { method: 'DELETE' });
    alert('Unenrolled');
    return true;
}

// Delete a course (Admin)
async function deleteCourse(courseId) {
    if (!confirm('Delete this course?')) return false;
    
    await api(`/courses/${courseId}`, { method: 'DELETE' });
    alert('Course deleted');
    return true;
}

// Create a course (Admin)
async function createCourse(code, title, dept, instructor) {
    return await api('/courses', {
        method: 'POST',
        body: JSON.stringify({ code, title, department: dept, instructor })
    });
}

/*
 * ========================================
 * FILE FUNCTIONS
 * ========================================
 */

// Load files for a course
async function loadCourseFiles(courseId) {
    return await api(`/files/${courseId}`);
}

// Load pending files (Admin)
async function loadPendingFiles() {
    return await api('/files/pending/all');
}

// Approve a file (Admin)
async function approveFile(fileId) {
    const data = await api(`/files/${fileId}/approve`, { method: 'PUT' });
    return !data.error;
}

// Reject a file (Admin)
async function rejectFile(fileId) {
    if (!confirm('Reject and delete this file?')) return false;
    
    const data = await api(`/files/${fileId}/reject`, { method: 'DELETE' });
    return !data.error;
}

// Delete a file
async function deleteFile(fileId) {
    if (!confirm('Delete this file?')) return false;
    
    await api(`/files/${fileId}`, { method: 'DELETE' });
    return true;
}

// Get file icon based on extension
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const icons = {
        pdf: { class: 'pdf', icon: 'fa-file-pdf' },
        doc: { class: 'doc', icon: 'fa-file-word' },
        docx: { class: 'doc', icon: 'fa-file-word' },
        ppt: { class: 'ppt', icon: 'fa-file-powerpoint' },
        pptx: { class: 'ppt', icon: 'fa-file-powerpoint' },
        xls: { class: 'xls', icon: 'fa-file-excel' },
        xlsx: { class: 'xls', icon: 'fa-file-excel' },
        jpg: { class: 'image', icon: 'fa-file-image' },
        jpeg: { class: 'image', icon: 'fa-file-image' },
        png: { class: 'image', icon: 'fa-file-image' },
        zip: { class: 'zip', icon: 'fa-file-archive' },
        rar: { class: 'zip', icon: 'fa-file-archive' }
    };
    
    return icons[ext] || { class: 'default', icon: 'fa-file' };
}

/*
 * ========================================
 * UI FUNCTIONS
 * ========================================
 */

// Load header with user info
function loadHeader() {
    const user = getUser();
    if (!user) return;
    
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Admin' : 'Student';
}

// Load sidebar navigation
function loadSidebar(activePage) {
    const user = getUser();
    const isAdmin = user?.role === 'admin';
    const sidebar = document.querySelector('.sidebar');
    
    if (!sidebar) return;
    
    sidebar.innerHTML = `
        <ul class="nav-menu">
            <li>
                <a href="dashboard.html" class="${activePage === 'dashboard' ? 'active' : ''}">
                    <i class="fas fa-th-large"></i> Dashboard
                </a>
            </li>
            ${!isAdmin ? `
            <li>
                <a href="my-courses.html" class="${activePage === 'my-courses' ? 'active' : ''}">
                    <i class="fas fa-book"></i> My Courses
                </a>
            </li>
            ` : ''}
            ${isAdmin ? `
            <li>
                <a href="admin.html" class="${activePage === 'admin' ? 'active' : ''}">
                    <i class="fas fa-tasks"></i> Pending Approvals
                </a>
            </li>
            ` : ''}
            <div class="nav-divider"></div>
            <li>
                <a href="settings.html" class="${activePage === 'settings' ? 'active' : ''}">
                    <i class="fas fa-cog"></i> Settings
                </a>
            </li>
            <li>
                <a href="#" onclick="logout()">
                    <i class="fas fa-sign-out-alt" style="color: var(--danger)"></i>
                    <span style="color: var(--danger)">Logout</span>
                </a>
            </li>
        </ul>
    `;
}

// Open modal
function openModal(id) {
    document.getElementById(id)?.classList.add('active');
}

// Close modal
function closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
}

// Close modal on outside click
window.onclick = (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
};

// Toggle password visibility
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}
