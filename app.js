/* =============================================
   EDU CLASSREPO - MAIN JAVASCRIPT FILE
   All frontend logic in one file for simplicity
   ============================================= */

// API URL - Change this when deploying
const API_URL = 'http://localhost:3000/api';

// Set to true to use localStorage (demo mode without backend)
// Set to false to use actual backend API
const USE_LOCAL_STORAGE = true;

// Current user type for login page
let currentUserType = 'student';


/* =============================================
   AUTHENTICATION FUNCTIONS
   ============================================= */

// Initialize default admin accounts
function initializeAdmins() {
    let users = JSON.parse(localStorage.getItem('edu_users')) || {};
    
    // Create admin accounts if they don't exist
    if (!users['admin1@eastdelta.edu.bd']) {
        users['admin1@eastdelta.edu.bd'] = {
            id: 'ADM-001',
            name: 'Admin One',
            email: 'admin1@eastdelta.edu.bd',
            password: 'admin123',
            role: 'admin',
            department: 'Admin'
        };
    }
    
    if (!users['admin2@eastdelta.edu.bd']) {
        users['admin2@eastdelta.edu.bd'] = {
            id: 'ADM-002',
            name: 'Admin Two',
            email: 'admin2@eastdelta.edu.bd',
            password: 'admin123',
            role: 'admin',
            department: 'Admin'
        };
    }
    
    localStorage.setItem('edu_users', JSON.stringify(users));
}

// Validate email domain
function isValidEmail(email) {
    return email.toLowerCase().endsWith('@eastdelta.edu.bd');
}

// Set user type (student/admin) on login page
function setUserType(type) {
    currentUserType = type;
    
    // Update toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Show/hide admin notice
    const adminNotice = document.getElementById('admin-notice');
    const loginFooter = document.getElementById('login-footer');
    
    if (type === 'admin') {
        adminNotice.classList.remove('hidden');
        loginFooter.classList.add('hidden');
    } else {
        adminNotice.classList.add('hidden');
        loginFooter.classList.remove('hidden');
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
    document.getElementById('login-footer').classList.remove('hidden');
    document.getElementById('signup-footer').classList.add('hidden');
    document.getElementById('login-toggle').classList.remove('hidden');
    document.getElementById('form-title').textContent = 'Welcome Back!';
    document.getElementById('form-subtitle').textContent = 'Sign in to access your courses';
    document.getElementById('error-message').classList.add('hidden');
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    
    // Validate email domain
    if (!isValidEmail(email)) {
        showError('Please use your @eastdelta.edu.bd email address');
        return;
    }
    
    if (USE_LOCAL_STORAGE) {
        // Demo mode - use localStorage
        const users = JSON.parse(localStorage.getItem('edu_users')) || {};
        const user = users[email];
        
        if (!user) {
            showError('No account found with this email');
            return;
        }
        
        if (user.password !== password) {
            showError('Incorrect password');
            return;
        }
        
        // Check role matches selected type
        if (currentUserType === 'admin' && user.role !== 'admin') {
            showError('This account does not have admin access');
            return;
        }
        
        if (currentUserType === 'student' && user.role === 'admin') {
            showError('Please use Admin portal to login');
            return;
        }
        
        // Create session
        const session = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            department: user.department
        };
        
        localStorage.setItem('edu_session', JSON.stringify(session));
        window.location.href = 'dashboard.html';
        
    } else {
        // Production mode - use API
        fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, userType: currentUserType })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('edu_session', JSON.stringify(data.user));
                localStorage.setItem('edu_token', data.token);
                window.location.href = 'dashboard.html';
            } else {
                showError(data.message);
            }
        })
        .catch(err => showError('Connection error. Please try again.'));
    }
}

// Handle signup form submission
function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value.trim();
    const studentId = document.getElementById('signup-studentid').value.trim();
    const gender = document.getElementById('signup-gender').value;
    const department = document.getElementById('signup-dept').value;
    const semester = document.getElementById('signup-semester')?.value || '';
    const email = document.getElementById('signup-email').value.trim().toLowerCase();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    
    // Validations
    if (!gender) {
        showError('Please select your gender');
        return;
    }
    
    if (!isValidEmail(email)) {
        showError('Only @eastdelta.edu.bd emails are allowed');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirm) {
        showError('Passwords do not match');
        return;
    }
    
    if (USE_LOCAL_STORAGE) {
        // Demo mode
        let users = JSON.parse(localStorage.getItem('edu_users')) || {};
        
        if (users[email]) {
            showError('An account with this email already exists');
            return;
        }
        
        // Create new user
        users[email] = {
            id: studentId,
            name: name,
            email: email,
            password: password,
            role: 'student',
            department: department,
            gender: gender,
            semester: semester,
            profilePic: null
        };
        
        localStorage.setItem('edu_users', JSON.stringify(users));
        alert('Account created successfully! Please login.');
        showLoginForm();
        
    } else {
        // Production mode - use API
        fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, studentId, email, password, department, gender, semester })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert('Account created successfully! Please login.');
                showLoginForm();
            } else {
                showError(data.message);
            }
        })
        .catch(err => showError('Connection error. Please try again.'));
    }
}

// Logout function
function logout() {
    localStorage.removeItem('edu_session');
    localStorage.removeItem('edu_token');
    window.location.href = 'index.html';
}

// Check if user is logged in (for protected pages)
function checkAuth() {
    const session = localStorage.getItem('edu_session');
    if (!session) {
        window.location.href = 'index.html';
        return null;
    }
    return JSON.parse(session);
}

// Get current user
function getCurrentUser() {
    const session = localStorage.getItem('edu_session');
    return session ? JSON.parse(session) : null;
}


/* =============================================
   NAVIGATION & UI FUNCTIONS
   ============================================= */

// Load sidebar navigation
function loadSidebar(activePage) {
    const user = getCurrentUser();
    const isAdmin = user && user.role === 'admin';
    
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
                    <i class="fas fa-cog"></i> Account Settings
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

// Load header with user info and profile picture
function loadHeader() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userNameEl = document.getElementById('user-name');
    const userRoleEl = document.getElementById('user-role');
    
    if (userNameEl) userNameEl.textContent = user.name;
    if (userRoleEl) userRoleEl.textContent = user.role;
    
    // Get full user data for profile pic
    const users = JSON.parse(localStorage.getItem('edu_users')) || {};
    const fullUser = users[user.email];
    
    // Update profile avatar
    const avatarEl = document.getElementById('profile-avatar');
    if (avatarEl && fullUser) {
        if (fullUser.profilePic) {
            avatarEl.innerHTML = `<img src="${fullUser.profilePic}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            // Show gender-based icon
            const icon = fullUser.gender === 'female' ? 'fa-user-circle' : 'fa-user-circle';
            const color = fullUser.gender === 'female' ? '#9c5c7a' : '#5c6b7a';
            avatarEl.innerHTML = `<i class="fas ${icon}" style="font-size: 24px; color: ${color};"></i>`;
        }
    }
}


/* =============================================
   COURSE FUNCTIONS
   ============================================= */

// Initialize sample courses (for demo)
function initializeCourses() {
    let courses = JSON.parse(localStorage.getItem('edu_courses'));
    
    if (!courses) {
        courses = [
            { id: 1, code: 'CSE 101', title: 'Introduction to Programming', dept: 'CSE', instructor: 'Dr. Rahman' },
            { id: 2, code: 'CSE 201', title: 'Data Structures', dept: 'CSE', instructor: 'Dr. Ahmed' },
            { id: 3, code: 'CSE 301', title: 'Database Systems', dept: 'CSE', instructor: 'Dr. Khan' },
            { id: 4, code: 'EEE 101', title: 'Basic Electrical Engineering', dept: 'EEE', instructor: 'Dr. Hossain' },
            { id: 5, code: 'BBA 101', title: 'Principles of Management', dept: 'BBA', instructor: 'Dr. Karim' }
        ];
        localStorage.setItem('edu_courses', JSON.stringify(courses));
    }
    
    return courses;
}

// Get all courses
function getCourses(deptFilter = 'All') {
    const courses = JSON.parse(localStorage.getItem('edu_courses')) || [];
    
    if (deptFilter === 'All') {
        return courses;
    }
    
    return courses.filter(c => c.dept === deptFilter);
}

// Get enrolled courses for current user
function getEnrolledCourses() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const enrollments = JSON.parse(localStorage.getItem('edu_enrollments')) || {};
    return enrollments[user.email] || [];
}

// Enroll in a course
function enrollInCourse(courseId) {
    const user = getCurrentUser();
    if (!user) return;
    
    const courses = JSON.parse(localStorage.getItem('edu_courses')) || [];
    const course = courses.find(c => c.id === courseId);
    
    if (!course) return;
    
    let enrollments = JSON.parse(localStorage.getItem('edu_enrollments')) || {};
    
    if (!enrollments[user.email]) {
        enrollments[user.email] = [];
    }
    
    // Check if already enrolled
    if (enrollments[user.email].some(c => c.id === courseId)) {
        alert('You are already enrolled in this course');
        return;
    }
    
    enrollments[user.email].push(course);
    localStorage.setItem('edu_enrollments', JSON.stringify(enrollments));
    
    alert(`Enrolled in ${course.code}: ${course.title}`);
    
    // Refresh page
    if (typeof loadDashboard === 'function') {
        loadDashboard();
    }
}

// Unenroll from a course
function unenrollFromCourse(courseId) {
    if (!confirm('Are you sure you want to unenroll from this course?')) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    let enrollments = JSON.parse(localStorage.getItem('edu_enrollments')) || {};
    
    if (enrollments[user.email]) {
        enrollments[user.email] = enrollments[user.email].filter(c => c.id !== courseId);
        localStorage.setItem('edu_enrollments', JSON.stringify(enrollments));
    }
    
    alert('Successfully unenrolled from course');
    
    // Refresh
    if (typeof loadMyCourses === 'function') {
        loadMyCourses();
    }
}

// Create a new course (Admin only)
function createCourse(code, title, dept, instructor) {
    let courses = JSON.parse(localStorage.getItem('edu_courses')) || [];
    
    const newCourse = {
        id: Date.now(),
        code: code,
        title: title,
        dept: dept,
        instructor: instructor
    };
    
    courses.push(newCourse);
    localStorage.setItem('edu_courses', JSON.stringify(courses));
    
    return newCourse;
}

// Delete a course (Admin only)
function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;
    
    let courses = JSON.parse(localStorage.getItem('edu_courses')) || [];
    courses = courses.filter(c => c.id !== courseId);
    localStorage.setItem('edu_courses', JSON.stringify(courses));
    
    // Also remove files for this course
    let files = JSON.parse(localStorage.getItem('edu_files')) || [];
    files = files.filter(f => f.courseId !== courseId);
    localStorage.setItem('edu_files', JSON.stringify(files));
    
    alert('Course deleted');
    
    if (typeof loadDashboard === 'function') {
        loadDashboard();
    }
}


/* =============================================
   FILE FUNCTIONS
   ============================================= */

// Get files for a course
function getCourseFiles(courseId, onlyApproved = true) {
    const files = JSON.parse(localStorage.getItem('edu_files')) || [];
    
    return files.filter(f => {
        if (f.courseId !== courseId) return false;
        if (onlyApproved && f.status !== 'approved') return false;
        return true;
    });
}

// Get all pending files (for admin)
function getPendingFiles() {
    const files = JSON.parse(localStorage.getItem('edu_files')) || [];
    return files.filter(f => f.status === 'pending');
}

// Upload a file
function uploadFile(courseId, fileName, fileSize) {
    const user = getCurrentUser();
    if (!user) return;
    
    let files = JSON.parse(localStorage.getItem('edu_files')) || [];
    
    const newFile = {
        id: Date.now(),
        courseId: courseId,
        name: fileName,
        size: fileSize,
        uploadedBy: user.name,
        uploadedByEmail: user.email,
        uploadDate: new Date().toLocaleDateString(),
        status: user.role === 'admin' ? 'approved' : 'pending'
    };
    
    files.push(newFile);
    localStorage.setItem('edu_files', JSON.stringify(files));
    
    return newFile;
}

// Approve a file (Admin)
function approveFile(fileId) {
    let files = JSON.parse(localStorage.getItem('edu_files')) || [];
    
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex > -1) {
        files[fileIndex].status = 'approved';
        localStorage.setItem('edu_files', JSON.stringify(files));
    }
    
    if (typeof loadAdminPanel === 'function') {
        loadAdminPanel();
    }
}

// Reject/Delete a file (Admin)
function rejectFile(fileId) {
    if (!confirm('Are you sure you want to reject and delete this file?')) return;
    
    let files = JSON.parse(localStorage.getItem('edu_files')) || [];
    files = files.filter(f => f.id !== fileId);
    localStorage.setItem('edu_files', JSON.stringify(files));
    
    if (typeof loadAdminPanel === 'function') {
        loadAdminPanel();
    }
}

// Delete a file
function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    let files = JSON.parse(localStorage.getItem('edu_files')) || [];
    files = files.filter(f => f.id !== fileId);
    localStorage.setItem('edu_files', JSON.stringify(files));
    
    alert('File deleted successfully');
    
    if (typeof loadCourseFiles === 'function') {
        loadCourseFiles();
    }
}

// Get file icon based on extension
function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    
    switch(ext) {
        case 'pdf':
            return { class: 'pdf', icon: 'fa-file-pdf' };
        case 'doc':
        case 'docx':
            return { class: 'doc', icon: 'fa-file-word' };
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
            return { class: 'image', icon: 'fa-file-image' };
        case 'ppt':
        case 'pptx':
            return { class: 'doc', icon: 'fa-file-powerpoint' };
        default:
            return { class: 'default', icon: 'fa-file' };
    }
}


/* =============================================
   MODAL FUNCTIONS
   ============================================= */

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

