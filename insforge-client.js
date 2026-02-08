// InsForge Browser Client using CDN SDK
// The SDK is loaded from CDN in landing.html

const INSFORGE_CONFIG = {
  baseUrl: 'https://aw63n46k.us-west.insforge.app',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTU2NzgtOTBhYi1jZGVmMTIzNDU2NzgiLCJlbWFpbCI6ImFub25AaW5zZm9yZ2UuY29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDQ3NDF9.bV1F7m9HL8EX-F7IjasCsDYB3C9iZxi6u9-fDI_Npb4'
};

// Wait for SDK to load, then create client
let insforge;

function initInsforge() {
  if (typeof window.Insforge !== 'undefined') {
    insforge = window.Insforge.createClient({
      baseUrl: INSFORGE_CONFIG.baseUrl,
      anonKey: INSFORGE_CONFIG.anonKey
    });
    console.log('✅ InsForge client initialized');
    return insforge;
  } else {
    console.error('❌ InsForge SDK not loaded from CDN');
    return null;
  }
}

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    insforge = initInsforge();
    window.insforge = insforge;
  });
} else {
  insforge = initInsforge();
  window.insforge = insforge;
}

export default insforge;
