// =================================================================
// EDUVERSE - DASHBOARD AUTHENTICATION GUARD
// =================================================================

import { getCurrentUser } from './auth-handler.js';

// Check authentication before loading dashboard
async function checkDashboardAuth() {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            // Not logged in, redirect to landing page
            console.log('No active session, redirecting to login...');
            window.location.href = 'landing.html';
            return false;
        }
        
        // User is authenticated
        console.log('User authenticated:', user.email);
        
        // Store user info globally for dashboard use
        window.currentUser = user;
        
        // Optionally load user profile from database
        await loadUserProfile(user.id);
        
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'landing.html';
        return false;
    }
}

// Load user profile from database using fetch
async function loadUserProfile(userId) {
    try {
        const response = await fetch(
            `https://aw63n46k.us-west.insforge.app/rest/v1/user_profiles?user_id=eq.${userId}`,
            {
                headers: {
                    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDQ3NDF9.bV1F7m9HL8EX-F7IjasCsDYB3C9iZxi6u9-fDI_Npb4',
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            }
        );
        
        const profiles = await response.json();
        
        if (profiles && profiles.length > 0) {
            const profile = profiles[0];
            window.userProfile = profile;
            console.log('User profile loaded:', profile);
            
            // Update any UI elements with user info
            updateDashboardUI(profile);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Update dashboard UI with user info
function updateDashboardUI(profile) {
    // Update user display name if element exists
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => {
        el.textContent = profile.display_name || window.currentUser.email;
    });
    
    // Update user handle if element exists
    const userHandleElements = document.querySelectorAll('.user-handle');
    userHandleElements.forEach(el => {
        el.textContent = `@${profile.handle}`;
    });
}

// Initialize authentication check
checkDashboardAuth();

export { checkDashboardAuth, loadUserProfile };
