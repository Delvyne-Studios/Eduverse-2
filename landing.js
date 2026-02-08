// =================================================================
// EDUVERSE LANDING PAGE - MAIN SCRIPT
// =================================================================

import {
    signInWithGoogle,
    signInWithGithub,
    handleEmailSignup,
    handleEmailLogin,
    createUserProfile,
    getCurrentUser,
    validatePassword,
    updatePasswordUI,
    showError,
    showSuccess,
    closeModals,
    handleAuthCallback
} from './auth-handler.js';

// =================================================================
// MODAL CONTROLS
// =================================================================

function showLogin() {
    document.getElementById('loginModal').classList.add('active');
}

function showSignup() {
    document.getElementById('signupModal').classList.add('active');
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

// Make functions globally available for onclick handlers
window.signInWithGoogle = signInWithGoogle;
window.signInWithGithub = signInWithGithub;
window.showLogin = showLogin;
window.showSignup = showSignup;
window.closeModals = closeModals;
window.switchToSignup = switchToSignup;
window.switchToLogin = switchToLogin;
window.scrollToFeatures = scrollToFeatures;

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
// FORM HANDLERS
// =================================================================

// Login Form Handler
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            const errorDiv = document.getElementById('loginError');
            
            // Clear previous errors
            errorDiv.classList.remove('show');
            
            // Validation
            if (!email || !password) {
                errorDiv.textContent = 'Please fill in all fields';
                errorDiv.classList.add('show');
                return;
            }
            
            // Disable submit button
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Signing in...</span>';
            
            const success = await handleEmailLogin(email, password);
            
            if (!success) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
    
    // Signup Form Handler
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        const passwordInput = document.getElementById('signupPassword');
        
        // Real-time password validation
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => {
                updatePasswordUI(e.target.value, e.target);
            });
        }
        
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            const errorDiv = document.getElementById('signupError');
            
            // Clear previous errors
            errorDiv.classList.remove('show');
            
            // Validation
            if (!email || !password) {
                errorDiv.textContent = 'Please fill in all fields';
                errorDiv.classList.add('show');
                return;
            }
            
            // Validate password strength
            const validation = validatePassword(password);
            if (!validation.isValid) {
                errorDiv.textContent = 'Please meet all password requirements';
                errorDiv.classList.add('show');
                return;
            }
            
            // Disable submit button
            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Creating account...</span>';
            
            const success = await handleEmailSignup(email, password);
            
            if (!success) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
    
    // Profile Setup Form Handler
    const profileForm = document.getElementById('profileSetupForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const displayName = document.getElementById('profileDisplayName').value.trim();
            const handle = document.getElementById('profileHandle').value.trim().toLowerCase();
            const errorDiv = document.getElementById('profileError');
            const modal = document.getElementById('profileSetupModal');
            const userId = modal?.dataset.userId;
            
            // Clear previous errors
            errorDiv.classList.remove('show');
            
            // Validation
            if (!displayName || !handle) {
                errorDiv.textContent = 'Please fill in all fields';
                errorDiv.classList.add('show');
                return;
            }
            
            if (handle.length < 3) {
                errorDiv.textContent = 'Handle must be at least 3 characters';
                errorDiv.classList.add('show');
                return;
            }
            
            if (!/^[a-zA-Z0-9_]+$/.test(handle)) {
                errorDiv.textContent = 'Handle can only contain letters, numbers, and underscores';
                errorDiv.classList.add('show');
                return;
            }
            
            if (!userId) {
                errorDiv.textContent = 'Session error. Please try logging in again.';
                errorDiv.classList.add('show');
                return;
            }
            
            // Disable submit button
            const submitBtn = profileForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Setting up profile...</span>';
            
            const success = await createUserProfile(userId, displayName, handle);
            
            if (!success) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
    
    // Check if already logged in
    checkExistingSession();
    
    // Handle OAuth callback
    handleAuthCallback();
});

async function checkExistingSession() {
    const user = await getCurrentUser();
    if (user && !window.location.search.includes('auth=callback')) {
        showSuccess('Already logged in!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

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
        
        const displayValue = Math.floor(current).toLocaleString();
        element.textContent = displayValue;
    }, 16);
}

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

window.addEventListener('DOMContentLoaded', () => {
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }
});

// =================================================================
// SCROLL ANIMATIONS
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

console.log('🚀 EduVerse Landing Page with InsForge - All Systems Ready!');
