// =================================================================
// EDUVERSE LANDING PAGE - AUTHENTICATION & INTERACTIONS
// =================================================================

// Modal Controls
function showLogin() {
    document.getElementById('loginModal').classList.add('active');
}

function showSignup() {
    document.getElementById('signupModal').classList.add('active');
}

function closeModals() {
    document.getElementById('loginModal').classList.remove('active');
    document.getElementById('signupModal').classList.remove('active');
}

function switchToSignup() {
    closeModals();
    setTimeout(() => showSignup(), 300);
}

function switchToLogin() {
    closeModals();
    setTimeout(() => showLogin(), 300);
}

// Smooth Scroll
function scrollToFeatures() {
    document.querySelector('.features-section').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

// Close modal on background click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        closeModals();
    }
});

// Close modal on ESC key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModals();
    }
});

// =================================================================
// USER DATA MANAGEMENT
// =================================================================

// Get all users from localStorage
function getAllUsers() {
    const users = localStorage.getItem('eduverse_users');
    return users ? JSON.parse(users) : [];
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem('eduverse_users', JSON.stringify(users));
}

// Check if handle exists
function handleExists(handle) {
    const users = getAllUsers();
    return users.some(user => user.handle.toLowerCase() === handle.toLowerCase());
}

// Check if email exists
function emailExists(email) {
    const users = getAllUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
}

// Simple hash function (NOT FOR PRODUCTION)
function simpleHash(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(16);
}

// Create new user
function createUser(name, handle, email, password) {
    const users = getAllUsers();
    
    const newUser = {
        name: name.trim(),
        handle: handle.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        passwordHash: simpleHash(password),
        createdAt: new Date().toISOString(),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`,
        lastLogin: new Date().toISOString(),
        preferences: {
            theme: 'dark',
            notifications: true
        },
        stats: {
            questionsAsked: 0,
            studySessions: 0,
            resourcesViewed: 0
        }
    };
    
    users.push(newUser);
    saveUsers(users);
    return newUser;
}

// Find user by credentials
function findUser(identifier, password) {
    const users = getAllUsers();
    const passwordHash = simpleHash(password);
    
    return users.find(user => 
        (user.email.toLowerCase() === identifier.toLowerCase() || 
         user.handle.toLowerCase() === identifier.toLowerCase()) &&
        user.passwordHash === passwordHash
    );
}

// Update last login
function updateLastLogin(handle) {
    const users = getAllUsers();
    const user = users.find(u => u.handle.toLowerCase() === handle.toLowerCase());
    if (user) {
        user.lastLogin = new Date().toISOString();
        saveUsers(users);
    }
}

// =================================================================
// SESSION MANAGEMENT
// =================================================================

function createSession(user) {
    localStorage.setItem('eduverse_session', JSON.stringify({
        handle: user.handle,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        loginTime: new Date().toISOString()
    }));
}

function getSession() {
    const session = localStorage.getItem('eduverse_session');
    return session ? JSON.parse(session) : null;
}

function clearSession() {
    localStorage.removeItem('eduverse_session');
}

function isLoggedIn() {
    return getSession() !== null;
}

// =================================================================
// VALIDATION FUNCTIONS
// =================================================================

function validateHandle(handle) {
    // Remove @ if present
    handle = handle.replace('@', '').trim();
    
    if (handle.length < 3) {
        return { valid: false, message: 'Handle must be at least 3 characters' };
    }
    
    if (handle.length > 20) {
        return { valid: false, message: 'Handle must be 20 characters or less' };
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
        return { valid: false, message: 'Handle can only contain letters, numbers, and underscores' };
    }
    
    if (handleExists(handle)) {
        return { valid: false, message: 'This handle is already taken' };
    }
    
    return { valid: true };
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return { valid: false, message: 'Please enter a valid email address' };
    }
    
    if (emailExists(email)) {
        return { valid: false, message: 'This email is already registered' };
    }
    
    return { valid: true };
}

function validatePassword(password) {
    if (password.length < 4) {
        return { valid: false, message: 'Password must be at least 4 characters' };
    }
    
    return { valid: true };
}

function validateName(name) {
    name = name.trim();
    
    if (name.length < 2) {
        return { valid: false, message: 'Name must be at least 2 characters' };
    }
    
    if (name.length > 50) {
        return { valid: false, message: 'Name must be 50 characters or less' };
    }
    
    return { valid: true };
}

// =================================================================
// FORM HANDLERS
// =================================================================

function handleLogin(event) {
    event.preventDefault();
    
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    // Validation
    if (!identifier) {
        showError('Please enter your username or email');
        return;
    }
    
    if (!password) {
        showError('Please enter your password');
        return;
    }
    
    // Find user
    const user = findUser(identifier, password);
    
    if (!user) {
        showError('Invalid credentials. Please try again.');
        return;
    }
    
    // Update last login
    updateLastLogin(user.handle);
    
    // Create session
    createSession(user);
    
    // Show success message
    showSuccess(`Welcome back, @${user.handle}!`);
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    let handle = document.getElementById('signupHandle').value.replace('@', '').trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    // Validate name
    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
        showError(nameValidation.message);
        return;
    }
    
    // Validate handle
    const handleValidation = validateHandle(handle);
    if (!handleValidation.valid) {
        showError(handleValidation.message);
        return;
    }
    
    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
        showError(emailValidation.message);
        return;
    }
    
    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
        showError(passwordValidation.message);
        return;
    }
    
    // Create user
    const user = createUser(name, handle, email, password);
    
    // Create session
    createSession(user);
    
    // Show success message
    showSuccess(`Account created successfully! Welcome, @${user.handle}!`);
    
    // Redirect to dashboard
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// =================================================================
// UI FEEDBACK
// =================================================================

function showError(message) {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification error';
    notification.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function showSuccess(message) {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();
    
    const notification = document.createElement('div');
    notification.className = 'notification success';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.classList.add('show'), 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Add notification styles
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        top: 100px;
        right: 2rem;
        padding: 1.25rem 2rem;
        background: rgba(30, 41, 59, 0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        display: flex;
        align-items: center;
        gap: 12px;
        z-index: 3000;
        opacity: 0;
        transform: translateX(400px);
        transition: all 0.3s ease;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        font-weight: 600;
    }
    
    .notification.show {
        opacity: 1;
        transform: translateX(0);
    }
    
    .notification.error {
        border-left: 4px solid #ef4444;
    }
    
    .notification.error i {
        color: #ef4444;
        font-size: 1.5rem;
    }
    
    .notification.success {
        border-left: 4px solid #10b981;
    }
    
    .notification.success i {
        color: #10b981;
        font-size: 1.5rem;
    }
`;
document.head.appendChild(notificationStyles);

// =================================================================
// INITIALIZATION
// =================================================================

// Check if already logged in on page load
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        const session = getSession();
        showSuccess(`Already logged in as @${session.handle}`);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
    
    // Add form listeners
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Handle input auto-focus
    const handleInput = document.getElementById('signupHandle');
    if (handleInput) {
        handleInput.addEventListener('focus', function() {
            if (!this.value) {
                this.value = '';
            }
        });
    }
});

// Export functions for use in other files
window.EduVerseAuth = {
    isLoggedIn,
    getSession,
    clearSession
};

// =================================================================
// STATS COUNTER ANIMATION
// =================================================================

function animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        
        // Format number with commas for thousands
        const displayValue = Math.floor(current).toLocaleString();
        element.textContent = displayValue;
    }, 16);
}

// Intersection Observer for stats animation
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const statValues = entry.target.querySelectorAll('.stat-value');
            statValues.forEach(stat => {
                const target = parseInt(stat.getAttribute('data-count'));
                animateCounter(stat, target, 2000);
            });
            statsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

// Observe stats section when page loads
window.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
});

// =================================================================
// SCROLL ANIMATIONS FOR CARDS
// =================================================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const fadeInObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

window.addEventListener('load', () => {
    // Add initial styles for animation
    const animateElements = document.querySelectorAll(
        '.feature-card, .testimonial-card, .step-card'
    );
    
    animateElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `all 0.6s ease ${index * 0.1}s`;
        fadeInObserver.observe(el);
    });
});

// =================================================================
// NAVBAR SCROLL EFFECT
// =================================================================

let lastScroll = 0;
const navbar = document.querySelector('.landing-nav');

if (navbar) {
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 100) {
            navbar.style.background = 'rgba(15, 23, 42, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
            navbar.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.3)';
        } else {
            navbar.style.background = 'rgba(15, 23, 42, 0.5)';
            navbar.style.backdropFilter = 'blur(5px)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    });
}

console.log('🚀 EduVerse Landing Page - All Systems Ready!');
