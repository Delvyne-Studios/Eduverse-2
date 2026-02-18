// =================================================================
// EDUVERSE AUTHENTICATION WITH INSFORGE REST API
// =================================================================

const BASE_URL = 'https://aw63n46k.us-west.insforge.app';

// =================================================================
// OAUTH AUTHENTICATION WITH PKCE
// =================================================================

// Helper for SHA256 hashing (for PKCE)
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return hashBuffer;
}

// Base64 URL encode
function base64URLEncode(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
}

// Generate random code verifier for PKCE
function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64URLEncode(array);
}

export async function signInWithGoogle() {
    try {
        // Generate PKCE parameters
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = base64URLEncode(await sha256(codeVerifier));
        
        // Store code verifier for later exchange
        sessionStorage.setItem('oauth_code_verifier', codeVerifier);
        sessionStorage.setItem('oauth_provider', 'google');
        
        // Get OAuth URL
        const redirectUri = `${window.location.origin}/landing.html`;
        const response = await fetch(
            `${BASE_URL}/api/auth/oauth/google?redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}`
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to initiate OAuth');
        }
        
        const { authUrl } = await response.json();
        window.location.href = authUrl;
    } catch (error) {
        console.error('Google sign-in error:', error);
        showError('Failed to sign in with Google: ' + error.message);
    }
}

export async function signInWithGithub() {
    try {
        // Generate PKCE parameters
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = base64URLEncode(await sha256(codeVerifier));
        
        // Store code verifier for later exchange
        sessionStorage.setItem('oauth_code_verifier', codeVerifier);
        sessionStorage.setItem('oauth_provider', 'github');
        
        // Get OAuth URL
        const redirectUri = `${window.location.origin}/landing.html`;
        const response = await fetch(
            `${BASE_URL}/api/auth/oauth/github?redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge=${codeChallenge}`
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to initiate OAuth');
        }
        
        const { authUrl } = await response.json();
        window.location.href = authUrl;
    } catch (error) {
        console.error('GitHub sign-in error:', error);
        showError('Failed to sign in with GitHub: ' + error.message);
    }
}

// Handle OAuth callback
export async function handleOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    const insforgeCode = urlParams.get('insforge_code');
    
    if (!insforgeCode) return null;
    
    try {
        const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
        if (!codeVerifier) {
            throw new Error('OAuth state not found');
        }
        
        // Exchange code for tokens
        const response = await fetch(`${BASE_URL}/api/auth/oauth/exchange`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                code: insforgeCode,
                code_verifier: codeVerifier
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to exchange OAuth code');
        }
        
        const { user, accessToken, csrfToken } = await response.json();

        // Store tokens
        localStorage.setItem('access_token', accessToken);
        if (csrfToken) {
            localStorage.setItem('csrf_token', csrfToken);
        }
        // Cache user to avoid re-login on page refresh
        if (user) localStorage.setItem('cached_user', JSON.stringify(user));
        
        // Clear OAuth state
        sessionStorage.removeItem('oauth_code_verifier');
        sessionStorage.removeItem('oauth_provider');
        
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Check and setup profile
        await checkAndSetupProfile(user);
        
        return user;
    } catch (error) {
        console.error('OAuth callback error:', error);
        showError('Failed to complete sign-in: ' + error.message);
        sessionStorage.removeItem('oauth_code_verifier');
        sessionStorage.removeItem('oauth_provider');
        return null;
    }
}

// =================================================================
// EMAIL AUTHENTICATION
// =================================================================

export async function handleEmailSignup(email, password) {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            showError(error.message || 'Signup failed. Please try again.');
            return false;
        }

        const { user, accessToken, requireEmailVerification } = await response.json();

        if (requireEmailVerification) {
            showSuccess('Verification email sent! Please check your inbox and verify your email before logging in.');
            // Close signup modal, show login modal
            closeModals();
            setTimeout(() => {
                if (typeof showLogin === 'function') showLogin();
            }, 2000);
            return false;
        }

        if (accessToken) {
            // Store token
            localStorage.setItem('access_token', accessToken);
            if (user) localStorage.setItem('cached_user', JSON.stringify(user));
            
            // User signed up successfully without email verification
            showSuccess('Account created successfully!');
            await checkAndSetupProfile(user);
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
        const response = await fetch(`${BASE_URL}/api/auth/sessions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            const error = await response.json();
            showError(error.message || 'Invalid email or password.');
            return false;
        }

        const { user, accessToken, csrfToken } = await response.json();

        if (accessToken) {
            // Store tokens
            localStorage.setItem('access_token', accessToken);
            if (csrfToken) {
                localStorage.setItem('csrf_token', csrfToken);
            }
            if (user) localStorage.setItem('cached_user', JSON.stringify(user));
            
            showSuccess('Welcome back!');
            await checkAndSetupProfile(user);
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
        const accessToken = localStorage.getItem('access_token');
        
        // Check if user already has a profile
        const response = await fetch(
            `${BASE_URL}/rest/v1/user_profiles?user_id=eq.${user.id}`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error('Error checking profile:', await response.text());
            // On error, still redirect to dashboard
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
            return;
        }

        const profiles = await response.json();

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
        const accessToken = localStorage.getItem('access_token');
        
        const response = await fetch(`${BASE_URL}/rest/v1/user_profiles`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                user_id: userId,
                display_name: displayName,
                handle: handle.toLowerCase(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            // Check if handle already exists
            if (errorText.includes('unique') || errorText.includes('duplicate')) {
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
        const accessToken = localStorage.getItem('access_token');
        
        // If we have a cached user and a token, return cached immediately (avoids re-login on refresh)
        const cachedUser = localStorage.getItem('cached_user');
        if (cachedUser && accessToken) {
            // Fire a background verification; if 401, only clear after confirming expired
            verifySessionInBackground(accessToken);
            return JSON.parse(cachedUser);
        }
        
        if (!accessToken) {
            // Try to refresh session via httpOnly cookie
            const refreshed = await tryRefreshSession();
            return refreshed;
        }

        // Validate the token with server
        const response = await fetch(`${BASE_URL}/api/auth/sessions/current`, {
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                // Try session refresh via cookie before giving up
                const refreshed = await tryRefreshSession();
                if (refreshed) return refreshed;
                // Truly expired - clear everything
                localStorage.removeItem('access_token');
                localStorage.removeItem('csrf_token');
                localStorage.removeItem('cached_user');
            }
            return null;
        }
        
        const { user } = await response.json();
        // Cache user data so subsequent page loads don't require server round-trip
        if (user) localStorage.setItem('cached_user', JSON.stringify(user));
        return user;
    } catch (error) {
        // Network error - return cached user if available to avoid logout on bad connection
        const cachedUser = localStorage.getItem('cached_user');
        if (cachedUser) return JSON.parse(cachedUser);
        return null;
    }
}

async function tryRefreshSession() {
    try {
        const response = await fetch(`${BASE_URL}/api/auth/sessions/refresh`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) return null;
        const data = await response.json();
        const { user, accessToken, csrfToken } = data;
        if (accessToken) {
            localStorage.setItem('access_token', accessToken);
            if (csrfToken) localStorage.setItem('csrf_token', csrfToken);
            if (user) localStorage.setItem('cached_user', JSON.stringify(user));
            return user;
        }
        return null;
    } catch {
        return null;
    }
}

function verifySessionInBackground(accessToken) {
    fetch(`${BASE_URL}/api/auth/sessions/current`, {
        credentials: 'include',
        headers: { 'Authorization': `Bearer ${accessToken}` }
    }).then(async res => {
        if (res.ok) {
            const { user } = await res.json();
            if (user) localStorage.setItem('cached_user', JSON.stringify(user));
        } else if (res.status === 401) {
            // Try to refresh silently
            tryRefreshSession().then(user => {
                if (!user) {
                    // Session truly expired; clear only if on a protected page
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('csrf_token');
                    localStorage.removeItem('cached_user');
                }
            });
        }
    }).catch(() => {/* ignore network errors in background */});
}

export async function signOut() {
    try {
        const accessToken = localStorage.getItem('access_token');
        await fetch(`${BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers: accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {}
        });
    } catch (error) {
        console.error('Sign out error:', error);
    } finally {
        localStorage.removeItem('access_token');
        localStorage.removeItem('csrf_token');
        localStorage.removeItem('cached_user');
        window.location.href = 'landing.html';
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
// INITIALIZATION
// =================================================================

// Check for OAuth callback on page load
if (window.location.pathname.includes('landing.html')) {
    handleOAuthCallback();
}
