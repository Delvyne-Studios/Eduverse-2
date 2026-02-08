// =================================================================
// EDUVERSE AUTHENTICATION WITH INSFORGE
// =================================================================

import insforge from './insforge-client.js';

// =================================================================
// OAUTH AUTHENTICATION
// =================================================================

export async function signInWithGoogle() {
    try {
        await insforge.auth.signInWithOAuth({
            provider: 'google',
            redirectTo: window.location.origin + '/landing.html?auth=callback'
        });
    } catch (error) {
        console.error('Google sign-in error:', error);
        showError('Failed to sign in with Google. Please try again.');
    }
}

export async function signInWithGithub() {
    try {
        await insforge.auth.signInWithOAuth({
            provider: 'github',
            redirectTo: window.location.origin + '/landing.html?auth=callback'
        });
    } catch (error) {
        console.error('GitHub sign-in error:', error);
        showError('Failed to sign in with GitHub. Please try again.');
    }
}

// =================================================================
// EMAIL AUTHENTICATION
// =================================================================

export async function handleEmailSignup(email, password) {
    try {
        const { data, error } = await insforge.auth.signUp({
            email: email,
            password: password
        });

        if (error) {
            showError(error.message || 'Signup failed. Please try again.');
            return false;
        }

        if (data?.requireEmailVerification) {
            showSuccess('Verification email sent! Please check your inbox.');
            // In production, redirect to email verification page
            return false;
        }

        if (data?.accessToken) {
            // User signed up successfully
            await checkAndSetupProfile(data.user);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Signup error:', error);
        showError('An error occurred during signup. Please try again.');
        return false;
    }
}

export async function handleEmailLogin(email, password) {
    try {
        const { data, error } = await insforge.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            showError(error.message || 'Invalid email or password.');
            return false;
        }

        if (data?.accessToken) {
            showSuccess('Welcome back!');
            await checkAndSetupProfile(data.user);
            return true;
        }

        return false;
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login. Please try again.');
        return false;
    }
}

// =================================================================
// PROFILE MANAGEMENT
// =================================================================

async function checkAndSetupProfile(user) {
    try {
        // Check if user already has a profile
        const { data: profiles, error } = await insforge.db
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id);

        if (error) {
            console.error('Error checking profile:', error);
        }

        if (!profiles || profiles.length === 0) {
            // First time user - show profile setup modal
            showProfileSetupModal(user);
        } else {
            // Existing user - redirect to dashboard
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
    } catch (error) {
        console.error('Error checking profile:', error);
        // If there's an error, still redirect to dashboard
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }
}

export async function createUserProfile(userId, displayName, handle) {
    try {
        const { data, error } = await insforge.db
            .from('user_profiles')
            .insert([{
                user_id: userId,
                display_name: displayName,
                handle: handle.toLowerCase()
            }]);

        if (error) {
            // Check if handle already exists
            if (error.message && error.message.includes('unique')) {
                showError('This handle is already taken. Please choose another.');
                return false;
            }
            showError('Failed to create profile. Please try again.');
            return false;
        }

        showSuccess('Profile created! Welcome to EduVerse!');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
        return true;
    } catch (error) {
        console.error('Error creating profile:', error);
        showError('An error occurred. Please try again.');
        return false;
    }
}

function showProfileSetupModal(user) {
    closeModals();
    const modal = document.getElementById('profileSetupModal');
    if (modal) {
        modal.classList.add('active');
        
        // Store user ID for later use
        modal.dataset.userId = user.id;
    }
}

// =================================================================
// SESSION MANAGEMENT
// =================================================================

export async function getCurrentUser() {
    try {
        const { data, error } = await insforge.auth.getCurrentSession();
        
        if (error || !data.session) {
            return null;
        }
        
        return data.session.user;
    } catch (error) {
        console.error('Error getting current user:', error);
        return null;
    }
}

export async function signOut() {
    try {
        await insforge.auth.signOut();
        window.location.href = 'landing.html';
    } catch (error) {
        console.error('Sign out error:', error);
    }
}

// =================================================================
// PASSWORD VALIDATION
// =================================================================

export function validatePassword(password) {
    const requirements = {
        length: password.length >= 6,
        number: /\d/.test(password),
        letter: /[a-zA-Z]/.test(password)
    };
    
    return {
        isValid: requirements.length && requirements.number && requirements.letter,
        requirements: requirements
    };
}

export function updatePasswordUI(password, inputElement) {
    const validation = validatePassword(password);
    
    // Update input border
    if (password.length === 0) {
        inputElement.classList.remove('valid', 'invalid');
    } else if (validation.isValid) {
        inputElement.classList.remove('invalid');
        inputElement.classList.add('valid');
    } else {
        inputElement.classList.remove('valid');
        inputElement.classList.add('invalid');
    }
    
    // Update requirement indicators
    updateRequirement('req-length', validation.requirements.length);
    updateRequirement('req-number', validation.requirements.number);
    updateRequirement('req-letter', validation.requirements.letter);
    
    return validation.isValid;
}

function updateRequirement(id, isValid) {
    const element = document.getElementById(id);
    if (element) {
        element.classList.remove('valid', 'invalid');
        element.classList.add(isValid ? 'valid' : 'invalid');
    }
}

// =================================================================
// UI FEEDBACK
// =================================================================

export function showError(message) {
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

export function showSuccess(message) {
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

export function closeModals() {
    document.getElementById('loginModal')?.classList.remove('active');
    document.getElementById('signupModal')?.classList.remove('active');
    document.getElementById('profileSetupModal')?.classList.remove('active');
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
// HANDLE OAUTH CALLBACK
// =================================================================

export async function handleAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'callback') {
        // OAuth callback - check session
        const user = await getCurrentUser();
        if (user) {
            await checkAndSetupProfile(user);
        }
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}
